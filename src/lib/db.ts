import mysql from "mysql2/promise";

const connection = mysql.createPool({
  host: process.env.NEW_DB_HOST,
  port: Number(process.env.NEW_DB_PORT ?? 3306),
  user: process.env.NEW_DB_USER,
  password: process.env.NEW_DB_PASSWORD,
  database: process.env.NEW_DB,
  waitForConnections: true,
  connectionLimit: 10,
});
//
export default connection;
