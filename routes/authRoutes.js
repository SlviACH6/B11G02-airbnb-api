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
      throw new Error('Email already exists')
    }
    //hash the password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newUser.password, salt)
    //create the user
    const queryString = `INSERT INTO users (first_name, last_name, email, password)
    VALUES ('${newUser.first_name}', '${newUser.last_name}', '${newUser.email}', '${hashedPassword}')
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
    res.json({ message: 'logged in' })
  } catch (err) {
    res.json({ error: err.message })
  }
})
//LOGIN POST user already in DB
router.post('/login', async (req, res) => {
  const { password, email, user_id, first_name, last_name } = req.body
  let dbpassword = `SELECT * FROM users WHERE users.email = '${email}'`
  try {
    let { rows } = await db.query(dbpassword)

    const isPswValid = await bcrypt.compare(password, rows[0].password)

    if (rows.length === 0) {
      throw new Error('User not found or password incorrect')
    }

    if (isPswValid) {
      let payload = {
        email: rows[0].email,
        user_id: rows[0].user_id
      }

      let token = jwt.sign(payload, jwtSecret)
      res.cookie('jwt', token)

      res.json(`${rows[0].last_name} you are logged in`)
    }
  } catch (err) {
    res.json({ error: err.message })
  }
})

// Logout user
router.get('/logout', (req, res) => {
  res.clearCookie('jwt')
  res.send('You are logged out')
})

export default router
