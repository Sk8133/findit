const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readUsers, writeUsers } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fname, lname, email, phone, city, gender, password } = req.body;

    if (!fname || !lname || !email || !phone || !city || !gender || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const users = readUsers();
    if (users.find(u => u.email === email.toLowerCase())) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const user = {
      id: 'u_' + uuidv4().split('-')[0],
      fname: fname.trim(),
      lname: lname.trim(),
      name: `${fname.trim()} ${lname.trim()}`,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      city: city.trim(),
      gender,
      password: hashedPass,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    writeUsers(users);

    const { password: _, ...safeUser } = user;
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = readUsers();
    const user = users.find(u => u.email === email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password: _, ...safeUser } = user;
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authMiddleware, (req, res) => {
  const users = readUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

module.exports = router;
