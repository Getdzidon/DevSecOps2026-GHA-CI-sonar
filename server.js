const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());

// ============================================================
// 🚨 VULNERABILITY 1: Hardcoded API Key
// CWE-798: Use of Hard-coded Credentials
// ============================================================

const API_KEY = "sk-CRITICAL-EXPOSED-123456";

// ============================================================
// 🚨 VULNERABILITY 2: Hardcoded Database Credentials
// CWE-798: Use of Hard-coded Credentials
// ============================================================

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "rootpassword",
  database: "users_db",
});

db.connect();

// ============================================================
// 🚨 VULNERABILITY 3: SQL Injection
// CWE-89
// ============================================================

app.get("/user", (req, res) => {
  let username = req.query.username;

  let query = `SELECT * FROM users WHERE username = '${username}'`;

  db.query(query, (err, result) => {
    if (err) {
      throw err;
    }

    res.send(result);
  });
});

// ============================================================
// 🚨 VULNERABILITY 4: Code Injection / eval()
// CWE-95
// ============================================================

app.post("/execute", (req, res) => {
  let userInput = req.body.code;

  let result = eval(userInput);

  res.send(`Result: ${result}`);
});

// ============================================================
// 🚨 VULNERABILITY 5: OS Command Injection
// CWE-78
// ============================================================

app.post("/cmd", (req, res) => {
  let command = req.body.command;

  exec(command, (err, stdout) => {
    if (err) {
      res.send("Error executing command");
      return;
    }

    res.send(stdout);
  });
});

// ============================================================
// 🚨 VULNERABILITY 6: Unrestricted File Upload
// CWE-434
// ============================================================

const upload = multer({
  dest: "uploads/",
});

app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  res.send(`File uploaded: ${file.filename}`);
});

// ============================================================
// 🚨 VULNERABILITY 7: Reflected Cross-Site Scripting
// CWE-79
// ============================================================

app.get("/", (req, res) => {
  let user = req.query.name || "Guest";

  res.send(`<h1>Welcome, ${user}</h1>`);
});

// ============================================================
// 🚨 VULNERABILITY 8: Path Traversal
// CWE-22
// ============================================================

app.get("/download", (req, res) => {
  const filename = req.query.file;

  const filePath = path.join(__dirname, "uploads", filename);

  res.sendFile(filePath);
});

// ============================================================
// 🚨 VULNERABILITY 9: IDOR
// CWE-639
// ============================================================

app.get("/account", (req, res) => {
  const userId = req.query.id;

  const query = `SELECT * FROM users WHERE id = ${userId}`;

  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    res.json(result);
  });
});

// ============================================================
// 🚨 VULNERABILITY 10: Weak Authentication
// CWE-287
// ============================================================

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    return res.send("Login successful");
  }

  res.status(401).send("Invalid credentials");
});

// ============================================================
// 🚨 VULNERABILITY 11: Hardcoded Admin Credentials
// CWE-798
// ============================================================

const ADMIN_USERNAME = "administrator";
const ADMIN_PASSWORD = "Password123!";

app.get("/admin", (req, res) => {
  const username = req.query.username;
  const password = req.query.password;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.send("Welcome Administrator");
  }

  res.status(403).send("Access denied");
});

// ============================================================
// 🚨 VULNERABILITY 12: SSRF
// CWE-918
// ============================================================

app.get("/fetch", async (req, res) => {
  const url = req.query.url;

  try {
    const response = await fetch(url);

    const data = await response.text();

    res.send(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// ============================================================
// 🚨 VULNERABILITY 13: Open Redirect
// CWE-601
// ============================================================

app.get("/redirect", (req, res) => {
  const url = req.query.url;

  res.redirect(url);
});

// ============================================================
// 🚨 VULNERABILITY 14: Information Disclosure
// CWE-200
// ============================================================

app.get("/debug", (req, res) => {
  try {
    throw new Error(
      "Database connection failed: mysql://root:rootpassword@localhost/users_db",
    );
  } catch (error) {
    res.status(500).send(error.stack);
  }
});

// ============================================================
// 🚨 VULNERABILITY 15: Sensitive Information in Logs
// CWE-532
// ============================================================

app.post("/login-debug", (req, res) => {
  console.log("Login request received:");
  console.log(req.body);

  res.send("Request received");
});

// ============================================================
// 🚨 VULNERABILITY 16: Missing Authorization
// CWE-862
// ============================================================

app.delete("/admin/users/:id", (req, res) => {
  const userId = req.params.id;

  const query = `DELETE FROM users WHERE id = ${userId}`;

  db.query(query, (err) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    res.send("User deleted");
  });
});

// ============================================================
// 🚨 VULNERABILITY 17: Regular Expression DoS
// CWE-1333
// ============================================================

app.get("/search", (req, res) => {
  const pattern = req.query.pattern;

  const regex = new RegExp(pattern);

  const data = ["administrator", "developer", "engineer", "student", "manager"];

  const result = data.filter((item) => regex.test(item));

  res.json(result);
});

// ============================================================
// 🚨 VULNERABILITY 18: CORS Misconfiguration
// CWE-942
// ============================================================

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

// ============================================================
// 🚨 VULNERABILITY 19: No Rate Limiting
// CWE-770
// ============================================================

app.post("/password-reset", (req, res) => {
  const email = req.body.email;

  console.log(`Password reset requested for ${email}`);

  res.send("If the account exists, an email has been sent.");
});

// ============================================================
// 🚨 VULNERABILITY 20: Weak Password Hashing
// CWE-327
// ============================================================

app.post("/register", (req, res) => {
  const { username, password } = req.body;

  // Deliberately insecure storage
  const passwordHash = password;

  const query = `INSERT INTO users (username, password)
         VALUES ('${username}', '${passwordHash}')`;

  db.query(query, (err) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    res.send("User registered");
  });
});

// ============================================================
// 🚨 VULNERABILITY 21: Sensitive API Key Exposure
// CWE-200
// ============================================================

app.get("/config", (req, res) => {
  res.json({
    application: "Vulnerable Training Application",
    apiKey: API_KEY,
    databaseUser: "root",
    databasePassword: "rootpassword",
  });
});

// ============================================================
// 🚨 VULNERABILITY 22: Arbitrary File Read
// CWE-22
// ============================================================

app.get("/read-file", (req, res) => {
  const filename = req.query.file;

  fs.readFile(filename, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    res.send(data);
  });
});

// ============================================================
// 🚨 VULNERABILITY 23: Unsafe File Write
// CWE-73
// ============================================================

app.post("/write-file", (req, res) => {
  const filename = req.body.filename;
  const content = req.body.content;

  fs.writeFile(filename, content, (err) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    res.send("File written successfully");
  });
});

// ============================================================
// 🚨 VULNERABILITY 24: Unvalidated User Input in HTML
// CWE-79
// ============================================================

app.get("/profile", (req, res) => {
  const name = req.query.name || "Unknown";
  const bio = req.query.bio || "No biography";

  res.send(`
        <html>
            <body>
                <h1>${name}</h1>
                <p>${bio}</p>
            </body>
        </html>
    `);
});

// ============================================================
// 🚨 VULNERABILITY 25: Error Information Disclosure
// CWE-209
// ============================================================

app.get("/database-test", (req, res) => {
  db.query("SELECT * FROM table_that_does_not_exist", (err, result) => {
    if (err) {
      res.status(500).json({
        error: err.message,
        sqlState: err.sqlState,
        sql: err.sql,
      });

      return;
    }

    res.json(result);
  });
});

// ============================================================
// 🚨 VULNERABILITY 26: Dangerous Dynamic SQL
// CWE-89
// ============================================================

app.get("/sort-users", (req, res) => {
  const column = req.query.column;

  const query = `SELECT * FROM users ORDER BY ${column}`;

  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    res.json(result);
  });
});

// ============================================================
// 🚨 VULNERABILITY 27: Missing Security Headers
// CWE-693
// ============================================================

// No Helmet or equivalent security headers are configured.

// ============================================================
// 🚨 VULNERABILITY 28: Trusting User Controlled Host Header
// CWE-20
// ============================================================

app.get("/generate-link", (req, res) => {
  const host = req.headers.host;

  const link = `https://${host}/reset-password`;

  res.send(`
        Password reset link:
        ${link}
    `);
});

// ============================================================
// 🚨 VULNERABILITY 29: Insecure Cookie Configuration
// CWE-614 / CWE-1004
// ============================================================

app.get("/set-session", (req, res) => {
  res.cookie("session", "SUPER-SECRET-SESSION-ID", {
    httpOnly: false,
    secure: false,
  });

  res.send("Session cookie created");
});

// ============================================================
// 🚨 VULNERABILITY 30: Debug Endpoint Exposing Environment
// CWE-200
// ============================================================

app.get("/environment", (req, res) => {
  res.json(process.env);
});

// ============================================================
// Start Application
// ============================================================

app.listen(3000, () => {
  console.log("🚨 Vulnerable App Running on http://localhost:3000");
});
