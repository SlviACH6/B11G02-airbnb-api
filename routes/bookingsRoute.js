import { Router } from 'express'
import db from '../db.js' // import the database connection

const router = Router()

router.get('/bookings', async (req, res) => {
  // don't forget async
  try {
    const { rows } = await db.query('SELECT * FROM bookings') // query the database
    console.log(rows)
    res.json(rows) // respond with the data
  } catch (err) {
    console.error(err.message)
    res.json(err)
  }
})

router.get('/bookings/1', async (req, res) => {
  // don't forget async
  try {
    const { rows } = await db.query('SELECT * FROM bookings WHERE user_id = 1') // query the database
    console.log(rows)
    res.json(rows) // respond with the data
  } catch (err) {
    console.error(err.message)
    res.json(err)
  }
})

export default router
