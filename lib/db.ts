import mysql from 'mysql2/promise'

// Pool de conexões MySQL Singleton para Next.js
const globalForDb = global as unknown as { pool: mysql.Pool | undefined }

export const pool =
  globalForDb.pool ||
  mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'finance_flow',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
  })

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool

export default pool
