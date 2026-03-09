const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const fs = require("fs");
const axios = require("axios");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3000;

// Session middleware (use memory store for demo; switch to persistent store for production)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Run DB initialization at startup if the pigs table is missing
async function ensureDbInitialized() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "example",
      database: process.env.MYSQL_DATABASE || "mf_db",
      multipleStatements: true,
    });

    // Check for pigs table
    const [rows] = await conn.query("SHOW TABLES LIKE 'pigs'");
    if (rows.length === 0) {
      // Try to read init.sql and execute it
      const initPath = path.join(__dirname, "db", "init.sql");
      if (fs.existsSync(initPath)) {
        const sql = fs.readFileSync(initPath, "utf8");
        console.log("Initializing database using db/init.sql...");
        await conn.query(sql);
      }
    }
    await conn.end();
  } catch (err) {
    console.warn("Database initialization skipped or failed:", err.message);
  }
}

// Start DB init (don't block server startup indefinitely)
ensureDbInitialized();

// Serve static frontend files from public/
app.use(express.static(path.join(__dirname, "public")));

// Auth middleware: check if user is logged in
const requireAuth = (req, res, next) => {
  if (req.session && req.session.isLoggedIn) {
    return next();
  }
  // Redirect to login form
  res.redirect("/admin/login");
};

// Role-based middleware: can be extended with roles in session
const requireRole = (role) => (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn)
    return res.status(401).send("Unauthorized");
  const userRole = req.session.role || "admin";
  if (role === "admin" && userRole !== "admin")
    return res.status(403).send("Forbidden");
  return next();
};

// Admin login form
app.get("/admin/login", (req, res) => {
  // If admin React app exists, serve it; otherwise fall back to static admin.html
  const adminAppIndex = path.join(
    __dirname,
    "public",
    "admin-app",
    "index.html",
  );
  if (fs.existsSync(adminAppIndex)) return res.sendFile(adminAppIndex);
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Admin dashboard (protected)
app.get("/admin", requireAuth, (req, res) => {
  const adminAppIndex = path.join(
    __dirname,
    "public",
    "admin-app",
    "index.html",
  );
  if (fs.existsSync(adminAppIndex)) return res.sendFile(adminAppIndex);
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Proxy analytics endpoints to analytics service (useful in docker-compose)
app.get("/analytics/summary", async (req, res) => {
  try {
    const target = process.env.ANALYTICS_URL || "http://localhost:5001";
    const r = await axios.get(`${target}/analytics/summary`);
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/analytics/csv", async (req, res) => {
  try {
    const target = process.env.ANALYTICS_URL || "http://localhost:5001";
    const r = await axios.get(`${target}/analytics/csv`, {
      responseType: "stream",
    });
    res.setHeader(
      "Content-Disposition",
      r.headers["content-disposition"] ||
        'attachment; filename="analytics.csv"',
    );
    r.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat endpoint: proxies to an LLM if configured, otherwise uses simple rule-based replies
app.post("/api/chat", async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "Missing message" });

  // If OPENAI_API_KEY is set, proxy to OpenAI Chat Completions
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
      const r = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model,
          messages: [{ role: "user", content: message }],
          max_tokens: 500,
        },
        { headers: { Authorization: `Bearer ${openaiKey}` } },
      );
      const reply = r.data.choices?.[0]?.message?.content || "No reply";
      return res.json({ reply });
    } catch (err) {
      console.error("OpenAI proxy error:", err.message);
      // fallthrough to rule-based
    }
  }

  // Rule-based fallback: handle common intents by calling internal analytics endpoints
  const text = message.toLowerCase();
  try {
    if (text.includes("average") || text.includes("weight")) {
      const r = await axios.get(
        (process.env.ANALYTICS_URL || "http://localhost:5001") +
          "/analytics/summary",
      );
      const j = r.data;
      if (j.message === "no data")
        return res.json({ reply: "No data available." });
      return res.json({
        reply: `Rows: ${j.rows}. Avg weight: ${j.weight_mean ?? "n/a"} kg. Avg age: ${j.age_mean ?? "n/a"} months.`,
      });
    }
    if (
      text.includes("export") ||
      text.includes("csv") ||
      text.includes("tableau")
    ) {
      return res.json({ reply: `Download CSV for Tableau at /analytics/csv` });
    }
    if (text.includes("list") || text.includes("pigs")) {
      const r = await axios.get(
        (process.env.BACKEND_URL || "http://localhost:3000") + "/api/pigs",
      );
      const j = r.data;
      if (Array.isArray(j)) {
        return res.json({
          reply: `Found ${j.length} pigs. Example: ${j
            .slice(0, 3)
            .map((p) => p.name)
            .join(", ")}`,
        });
      }
    }
  } catch (err) {
    console.warn("Chat fallback error:", err.message);
  }

  return res.json({
    reply:
      "I can fetch analytics summary, list pigs, or provide a CSV link for Tableau. Try: 'average weight', 'list pigs', or 'export csv'",
  });
});

// Simple DB endpoints for admin to inspect MySQL (dangerous in production — secure these!)
app.get("/api/db/tables", async (req, res) => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "example",
      database: process.env.MYSQL_DATABASE || "mf_db",
    });
    const [rows] = await conn.query("SHOW TABLES");
    await conn.end();
    return res.json({ tables: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
// CRUD endpoints for pigs table
app.get("/api/pigs", async (req, res) => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "example",
      database: process.env.MYSQL_DATABASE || "mf_db",
    });
    const [rows] = await conn.query("SELECT * FROM pigs LIMIT 100");
    await conn.end();
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/pigs", async (req, res) => {
  const { name, breed, weight, age } = req.body || {};
  if (!name) return res.status(400).json({ error: "Missing name" });

  try {
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "example",
      database: process.env.MYSQL_DATABASE || "mf_db",
    });
    await conn.query(
      "INSERT INTO pigs (name, breed, weight, age) VALUES (?, ?, ?, ?)",
      [name, breed || null, weight || null, age || null],
    );
    await conn.end();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/pigs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "example",
      database: process.env.MYSQL_DATABASE || "mf_db",
    });
    await conn.query("DELETE FROM pigs WHERE id = ?", [id]);
    await conn.end();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
// Example API endpoint compatible with TanStack Query on the frontend
app.get("/api/admin", (req, res) => {
  // Return minimal admin data; replace with real auth/DB logic
  res.json({
    uptime: process.uptime(),
    env: process.env.NODE_ENV || "development",
    message: "Admin API — replace with real endpoints",
  });
});

// Login POST handler
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body || {};

  // BASIC AUTH: For demo purposes only. Replace with real database + bcrypt in production.
  const validUsername = process.env.ADMIN_USER || "admin";
  const validPassword = process.env.ADMIN_PASS || "password";

  if (username === validUsername && password === validPassword) {
    req.session.isLoggedIn = true;
    req.session.user = username;
    return res.redirect("/admin");
  }

  res
    .status(401)
    .send("Invalid credentials. <a href='/admin/login'>Try again</a>");
});

// Logout route
app.get("/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Logout failed");
    res.redirect("/");
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
