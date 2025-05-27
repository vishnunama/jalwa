// import mysql from "mysql2/promise";

// const connection = mysql.createPool({
//   host: "localhost",
//   user: "admin",
//   password: "password",
//   database: "paklottery",
// });

// export default connection;

import mysql from "mysql2/promise";

const connection = mysql.createPool({
  host: "localhost",
  user: "root", // admin ki jagah root
  password: "", // agar password nahi diya to blank
  database: "nitrogendb", // paklottery ki jagah nitrogendb
});

export default connection;
