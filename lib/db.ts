import mysql from 'mysql2/promise'

// Pool de conexões MySQL Singleton para Next.js
const globalForDb = global as unknown as { pool: mysql.Pool | undefined }

// No Hostinger / Node 18+, 'localhost' resolve para IPv6 '::1', o que causa erro de acesso recusado pelo MySQL ('user'@'::1').
// Forçamos '127.0.0.1' (IPv4 loopback) para garatir compatibilidade completa.
const rawHost = process.env.MYSQL_HOST || '127.0.0.1'
const host = rawHost === 'localhost' ? '127.0.0.1' : rawHost

export const pool =
  globalForDb.pool ||
  mysql.createPool({
    host,
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
