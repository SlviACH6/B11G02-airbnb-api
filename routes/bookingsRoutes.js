import { Router } from 'express'
import db from '../db.js' // import database connection

import jwt from 'jsonwebtoken'
import { jwtSecret } from '../secrets.js'

const router = Router()

//routes to POST info on DATA BASE
router.post('/bookings', async (req, res) => {
  try {
    const { house_id, check_in, check_out, total_price, booked_on } = req.body

    const token = req.cookies.jwt
    console.log(token)

    if (!token) {
      throw new Error('Invalid authentication token. Please sign in')
    }

    const decodedToken = jwt.verify(token, jwtSecret)

    if (!decodedToken) {
      throw new Error('Invalid authorization token')
    }

    const userId = decodedToken.user_id

    console.log(userId)

    const newBookingQuery = `INSERT INTO bookings (user_id, house_id, check_in, check_out, total_price, booked_on)
      VALUES (${userId}, ${house_id}, '${check_in}', '${check_out}', ${total_price}, '${booked_on}')
      RETURNING * `

    const { rows } = await db.query(newBookingQuery)

    res.json(rows)
  } catch (err) {
    console.error(err.message)
    res.json({ error: err.message })
  }
})

//routes to GET info from DATA BASE
router.get('/bookings', async (req, res) => {
  try {
    let userBooking = ''

    const token = req.cookies.jwt

    if (!token) {
      throw new Error('Invalid authentication token. Please sign in')
    }

    const decodedToken = jwt.verify(token, jwtSecret)

    if (!decodedToken) {
      throw new Error('Invalid authorization token')
    }

    const userId = decodedToken.user_id

    if (userId) {
      userBooking = `SELECT * FROM bookings WHERE user_id = ${userId} ORDER BY check_in DESC`
    }
    if (!userId) {
      userBooking = `SELECT * FROM bookings ORDER BY check_in DESC`
    }
    console.log(userBooking)
    const { rows } = await db.query(userBooking)
    if (!rows.length) {
      throw new Error(`There is no booking corresponding to this user.`)
    }
    res.json(rows)
  } catch (err) {
    console.error(err.message)
    res.json({ error: err.message })
  }
})

// route to a specific house if with params
router.get('/bookings/:bookingId', async (req, res) => {
  try {
    let bookingId = req.params.bookingId
    const token = req.cookies.jwt

    if (!token) {
      throw new Error('Invalid authentication token. Please sign in')
    }

    const decodedToken = jwt.verify(token, jwtSecret)

    if (!decodedToken) {
      throw new Error('Invalid authorization token')
    }

    const userId = decodedToken.user_id

    const { rows, rowCount } = await db.query(
      `SELECT * FROM bookings WHERE booking_id = ${bookingId} AND user_id = ${userId} RETURNING *`
    )
    if (!rows.length) {
      throw new Error(`The booking Id number ${bookingId} does not exist.`)
    }
    console.log(rows)
    res.json(rows)
  } catch (err) {
    console.error(err.message)
    res.json({ error: err.message })
  }
})

export default router
