import mysql from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: mysql.Pool | undefined;
}

const connection =
  global.__dbPool ??
  mysql.createPool({
    host: process.env.NEW_DB_HOST,
    port: Number(process.env.NEW_DB_PORT ?? 3306),
    user: process.env.NEW_DB_USER,
    password: process.env.NEW_DB_PASSWORD,
    database: process.env.NEW_DB,
    waitForConnections: true,
    connectionLimit: 4,
  });

if (process.env.NODE_ENV !== "production") {
  global.__dbPool = connection;
}

export default connection;
