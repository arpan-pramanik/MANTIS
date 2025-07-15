const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const rateLimit = require('express-rate-limit');
const app = express();
app.set('trust proxy', ['127.0.0.1', '::1']); // Only trust localhost proxies for security
const PORT = 3000;

const DB_FILE = path.join(__dirname, 'storage.db');
const db = new sqlite3.Database(DB_FILE);

app.use(express.json());

// Initialize tables
function initDB() {
    db.run(`CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT, token TEXT, path TEXT, method TEXT, userAgent TEXT, body TEXT, timestamp TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS blocklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT, token TEXT
    )`);
}
initDB();

// Rate limiter
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many requests' });
    }
});
app.use(limiter);

// Helper: get real client IP
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || req.ip;
}

// Middleware: Blocker
app.use((req, res, next) => {
    const ip = getClientIp(req);
    const token = req.headers['x-api-token'] || '';
    db.get('SELECT 1 FROM blocklist WHERE ip = ? OR token = ?', [ip, token], (err, row) => {
        if (row) {
            return res.status(403).json({ error: 'Blocked by MANTIS' });
        }
        next();
    });
});

// Middleware: Logger
app.use((req, res, next) => {
    const logEntry = {
        ip: getClientIp(req),
        token: req.headers['x-api-token'] || '',
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'] || '',
        body: req.method === 'POST' ? JSON.stringify(req.body) : '',
        timestamp: new Date().toISOString()
    };
    db.run(`INSERT INTO logs (ip, token, path, method, userAgent, body, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [logEntry.ip, logEntry.token, logEntry.path, logEntry.method, logEntry.userAgent, logEntry.body, logEntry.timestamp],
        () => next()
    );
});

// Health endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Demo endpoints
app.get('/api/user', (req, res) => {
    res.json({ user: 'demo', status: 'ok' });
});

app.get('/api/product', (req, res) => {
    res.json({ product: 'demo', status: 'ok' });
});

app.post('/api/login', (req, res) => {
    res.json({ login: 'attempted', status: 'ok' });
});

// Blocklist management API (optional)
app.post('/api/block', (req, res) => {
    const { ip, token } = req.body;
    if (!ip && !token) return res.status(400).json({ error: 'ip or token required' });
    db.run('INSERT INTO blocklist (ip, token) VALUES (?, ?)', [ip || '', token || ''], () => {
        res.json({ status: 'blocked', ip, token });
    });
});

// Catch-all for unknown endpoints
app.use((req, res) => {
    res.status(404).json({ error: 'Unknown endpoint' });
});

app.listen(PORT, () => {
    console.log(`MANTIS API server running on port ${PORT}`);
});
