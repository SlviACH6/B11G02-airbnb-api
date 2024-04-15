import { Router } from 'express'
import db from '../db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const router = Router()
const jwtSecret = process.env.JWTSECRET

//Signup POST or create a new user
router.post('/signup', async (req, res) => {
  try {
    const newUser = req.body
    // check if user email exists
    const queryResult = await db.query(`
    SELECT * FROM users
    WHERE email ='${newUser.email}'
    `)
    if (queryResult.rowCount) {
      throw new Error('Email already exists, please LogIn')
    }
    //hash the password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newUser.password, salt)
    //create the user
    const queryString = `INSERT INTO users (first_name, last_name, email, password, profile_pictureurl)
    VALUES ('${newUser.first_name}', '${newUser.last_name}', '${newUser.email}', '${hashedPassword}', '${newUser.profile_pictureurl}')
    RETURNING user_id, email`
    const insertion = await db.query(queryString)
    //creating the token
    let payload = {
      email: newUser.email,
      user_id: newUser.user_id
    }
    console.log(payload)
    //Generate a token
    let token = jwt.sign(payload, jwtSecret)
    console.log(token)
    // creating the cookie
    res.cookie('jwt', token)
    res.json({ message: 'Sign up OK! Welcome!' })
  } catch (err) {
    res.json({ error: err.message })
  }
})
//LOGIN POST user already in DB
router.post('/login', async (req, res) => {
  const { password, email } = req.body
  let dbpassword = `SELECT * FROM users WHERE users.email = '${email}'`
  try {
    let { rows } = await db.query(dbpassword)

    const isPswValid = await bcrypt.compare(password, rows[0].password)

    if (!rows.length) {
      throw new Error('User not found or password incorrect')
    }

    if (isPswValid) {
      let payload = {
        email: rows[0].email,
        user_id: rows[0].user_id
      }

      let token = jwt.sign(payload, jwtSecret)
      res.cookie('jwt', token)

      res.json(`${rows[0].first_name} you are logged in`)
    }
  } catch (err) {
    res.json({ error: err.message })
  }
})

// Logout user
router.get('/logout', (req, res) => {
  try {
    res.clearCookie('jwt', {
      secure: true,
      sameSite: 'none'
    })
    res.json({ message: 'You are logged out' })
  } catch (err) {
    res.json({ error: err.message })
  }
})

router.get('/profile', async (req, res) => {
  try {
    // Validate Token
    const decodedToken = jwt.verify(req.cookies.jwt, jwtSecret)
    if (!decodedToken || !decodedToken.user_id || !decodedToken.email) {
      throw new Error('Invalid authentication token')
    }
    const { rows: userRows } = await db.query(`
      SELECT user_id, first_name, last_name, email, profile_pictureurl
      FROM users WHERE user_id = ${decodedToken.user_id}
    `)
    res.json(userRows[0])
  } catch (err) {
    res.json({ error: err.message })
  }
})

router.patch('/profile', async (req, res) => {
  try {
    // Validate Token
    const decodedToken = jwt.verify(req.cookies.jwt, jwtSecret)
    if (!decodedToken || !decodedToken.user_id || !decodedToken.email) {
      throw new Error('Invalid authentication token')
    }
    // Validate fields
    if (
      !req.body.first_name ||
      !req.body.last_name ||
      !req.body.email ||
      !req.body.profile_pictureurl
    ) {
      throw new Error('at least 1 field must be modified')
    }
    // Update user
    let query = `UPDATE users SET `
    if (req.body.first_name) {
      query += `first_name = '${req.body.first_name}', `
    }
    if (req.body.last_name) {
      query += `last_name = '${req.body.last_name}', `
    }
    if (req.body.email) {
      query += `email = '${req.body.email}', `
    }
    if (req.body.profile_pictureurl) {
      query += `profile_pictureurl = '${req.body.profile_pictureurl}', `
    }
    query = query.slice(0, -2)
    query += `WHERE user_id = ${decodedToken.user_id} RETURNING user_id, first_name, last_name, email, profile_pictureurl  `
    const { rows: userRows } = await db.query(query)
    // Respond
    res.json(userRows[0])
  } catch (err) {
    res.json({ error: err.message })
  }
})

export default router
