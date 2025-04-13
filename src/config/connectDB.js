import mysql from "mysql2/promise";

// const connection = mysql.createPool({
//   host: process.env.DATABASE_HOST,
//   user: process.env.DATABASE_USER,
//   password: process.env.DATABASE_PASSWORD,
//   database: process.env.DATABASE_NAME,
// });

const connection = mysql.createPool({
  host: "localhost", // MariaDB server IP
  user: "harsh", // Database user
  password: "Harsh@123", // Password for 'admin' user
  database: "91club", // Database name
  port: 3306, // Default MySQL port
});
// const connection = mysql.createPool({
//   host: "93.127.185.174", // MariaDB server IP
//   user: "admin", // Database user
//   password: "password", // Password for 'admin' user
//   database: "91club", // Database name
//   port: 3306, // Default MySQL port
// });

export default connection;
