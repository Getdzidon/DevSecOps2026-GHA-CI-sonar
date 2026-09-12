const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());

// 🚨 Critical Vulnerability 1: Hardcoded API Key
const API_KEY = "sk-CRITICAL-EXPOSED-123456"; // Exposing sensitive key

// 🚨 Critical Vulnerability 2: SQL Injection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "rootpassword", // Hardcoded password
    database: "users_db"
});
db.connect();

// 🚨 Critical Vulnerability 3: SQL Injection
app.get("/user", (req, res) => {
    let username = req.query.username;
    let query = `SELECT * FROM users WHERE username = '${username}'`; // No parameterized queries
    db.query(query, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

// 🚨 Critical Vulnerability 4: Remote Code Execution (eval)
app.post("/execute", (req, res) => {
    let userInput = req.body.code;
    let result = eval(userInput); // Dangerous usage of eval
    res.send(`Result: ${result}`);
});

// 🚨 Critical Vulnerability 5: Command Injection
app.post("/cmd", (req, res) => {
    let command = req.body.command;
    exec(command, (err, stdout) => {
        if (err) {
            res.send("Error executing command");
            return;
        }
        res.send(stdout); // Executes arbitrary commands
    });
});

// 🚨 Critical Vulnerability 6: File Upload Vulnerability (no sanitization)
const upload = multer({ dest: 'uploads/' });
app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send(`File uploaded: ${file.filename}`);
});

// 🚨 Critical Vulnerability 7: XSS
app.get("/", (req, res) => {
    let user = req.query.name || "Guest";
    res.send(`<h1>Welcome, ${user}</h1>`); // XSS vulnerability
});

app.listen(3000, () => console.log("🚨 Vulnerable App Running on http://localhost:3000"));
