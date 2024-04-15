import { Router } from 'express'
import db from '../db.js' // import database connection
import jwt from 'jsonwebtoken'

const jwtSecret = process.env.JWTSECRET
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

    const user_id = decodedToken.user_id

    console.log(user_id)

    const newBookingQuery = `INSERT INTO bookings (user_id, house_id, check_in, check_out, total_price, booked_on)
      VALUES (${user_id}, ${house_id}, '${check_in}', '${check_out}', ${total_price}, '${booked_on}')
      RETURNING * `

    const { rows } = await db.query(newBookingQuery)

    res.json(rows)
  } catch (err) {
    console.error(err.message)
    res.json({ error: err.message })
  }
})

// route to a specific house if with params
router.get('/bookings', async (req, res) => {
  try {
    // Validate Token
    const decodedToken = jwt.verify(req.cookies.jwt, jwtSecret)
    if (!decodedToken || !decodedToken.user_id || !decodedToken.email) {
      throw new Error('Invalid authentication token')
    }
    // Get bookings
    let sqlquery = `
      SELECT
        TO_CHAR(bookings.from_date, 'D Mon yyyy') AS from_date,
        TO_CHAR(bookings.to_date, 'D Mon yyyy') AS to_date,
        bookings.price_night AS price,
        bookings.nights,
        bookings.price_total,
        houses.house_id,
        houses.location,
        houses.rooms,
        houses.bathrooms,
        houses.reviews_count,
        houses.rating,
        photos.photo
      FROM bookings
      LEFT JOIN houses ON houses.house_id = bookings.house_id
      LEFT JOIN (
          SELECT DISTINCT ON (house_id) house_id, photo
          FROM houses_photos
      ) AS photos ON photos.house_id = houses.house_id
      WHERE bookings.user_id = ${decodedToken.user_id}
      ORDER BY bookings.from_date DESC
    `
    // Respond
    let { rows } = await db.query(sqlquery)
    res.json(rows)
  } catch (err) {
    res.json({ error: err.message })
  }
})

router.delete('/bookings/:booking_id', async (req, res) => {
  try {
    let booking_id = req.params.booking_id

    const token = req.cookies.jwt

    if (!token) {
      throw new Error('Invalid authentication token. Please sign in')
    }

    const decodedToken = jwt.verify(token, jwtSecret)

    if (!decodedToken) {
      throw new Error('Invalid authorization token')
    }

    const user_id = decodedToken.user_id
    console.log(user_id)

    const { rows, rowCount } = await db.query(
      `DELETE FROM bookings WHERE booking_id = ${booking_id} AND user_id = ${user_id} RETURNING *`
    )

    if (rowCount === 0) {
      throw new Error('You are not authorized')
    }

    res.json(`booking: ${booking_id} has been deleted`)
  } catch (err) {
    res.json({ error: err.message })
  }
})

export default router
