// db.js
import pg from 'pg'

const DBURL = process.env.DBURL
const { Pool } = pg

// Database connection parameters

const db = new Pool({
  ssl: {
    rejectUnauthorized: false
  },
  connectionString: DBURL
})

export default db
