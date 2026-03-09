const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function run() {
  const sqlPath = path.join(__dirname, "..", "db", "init.sql");
  if (!fs.existsSync(sqlPath)) {
    console.error("init.sql not found at", sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, "utf8");

  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "example",
    database: process.env.MYSQL_DATABASE || "mf_db",
    multipleStatements: true,
  });

  try {
    console.log("Executing init.sql...");
    await conn.query(sql);
    console.log("Database initialized.");
  } catch (err) {
    console.error("Error executing init.sql:", err.message);
    process.exit(2);
  } finally {
    await conn.end();
  }
}

run();
