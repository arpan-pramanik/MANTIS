'use strict';

const { Router } = require('express');
const router = Router();

// Simulated data for demo API endpoints
const users = [
  { id: 1, name: 'Alice Chen', email: 'alice@example.com', role: 'admin', status: 'active' },
  { id: 2, name: 'Bob Kumar', email: 'bob@example.com', role: 'user', status: 'active' },
  { id: 3, name: 'Carol Wang', email: 'carol@example.com', role: 'user', status: 'active' },
  { id: 4, name: 'David Okafor', email: 'david@example.com', role: 'moderator', status: 'active' },
  { id: 5, name: 'Elena Volkov', email: 'elena@example.com', role: 'user', status: 'inactive' }
];

const products = [
  { id: 1, name: 'Enterprise Shield', price: 299.99, category: 'security', stock: 150 },
  { id: 2, name: 'Cloud Defender', price: 499.99, category: 'security', stock: 85 },
  { id: 3, name: 'API Guardian Pro', price: 799.99, category: 'security', stock: 42 },
  { id: 4, name: 'Threat Scanner X', price: 199.99, category: 'tools', stock: 200 },
  { id: 5, name: 'Compliance Suite', price: 1299.99, category: 'compliance', stock: 30 }
];

/** GET /api/v1/users */
router.get('/api/v1/users', (req, res) => {
  res.json({ data: users, total: users.length, page: 1 });
});

/** GET /api/v1/users/:id */
router.get('/api/v1/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id, 10));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ data: user });
});

/** POST /api/v1/users */
router.post('/api/v1/users', (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  res.status(201).json({ data: { id: users.length + 1, name, email, role: 'user', status: 'active' }, message: 'User created' });
});

/** GET /api/v1/products */
router.get('/api/v1/products', (req, res) => {
  res.json({ data: products, total: products.length, page: 1 });
});

/** GET /api/v1/products/:id */
router.get('/api/v1/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id, 10));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ data: product });
});

/** POST /api/v1/auth/login */
router.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  // Always return success for demo (real auth would validate)
  res.json({ token: 'demo_token_' + Date.now(), user: { username, role: 'user' }, expiresIn: '24h' });
});

/** POST /api/v1/auth/register */
router.post('/api/v1/auth/register', (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
  res.status(201).json({ message: 'Registration successful', user: { username, email, role: 'user' } });
});

/** GET /api/v1/data/export */
router.get('/api/v1/data/export', (req, res) => {
  res.json({
    data: { users: users.length, products: products.length },
    exportedAt: new Date().toISOString(),
    format: req.query.format || 'json'
  });
});

module.exports = router;
