import mysql from "mysql2/promise";

const connection = mysql.createPool({
  host: "localhost",
  user: "admin",
  password: "password",
  database: "1015game",
});

// const connection = mysql.createPool({
//   host: "82.25.104.116",
//   user: "admin",
//   password: "password",
//   database: "91staging_db",
// });


// const connection = mysql.createPool({
//   host: "93.127.185.174", // MariaDB server IP
//   user: "admin", // Database user
//   password: "password", // Password for 'admin' user
//   database: "91club", // Database name
//   port: 3306, // Default MySQL port
// });



export default connection;
