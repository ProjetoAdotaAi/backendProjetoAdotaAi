const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const connectDB = async () => {
  try {
    await pool.connect();
    console.log('conectou');
  } catch (error) {
    console.error('erro no banco:', error);
    throw new Error('conexão com o banco falhou');
  }
};

module.exports = {
  connectDB,
  pool,
};