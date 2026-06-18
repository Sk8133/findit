const express = require('express');
const router = express.Router();
const { readUsers, writeUsers } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', authMiddleware, (req, res) => {
  const users = readUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// PUT /api/users/profile
router.put('/profile', authMiddleware, (req, res) => {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });

  const allowed = ['fname', 'lname', 'phone', 'city'];
  allowed.forEach(f => {
    if (req.body[f]) users[idx][f] = req.body[f].trim();
  });
  if (req.body.fname || req.body.lname) {
    users[idx].name = `${users[idx].fname} ${users[idx].lname}`;
  }
  users[idx].updatedAt = new Date().toISOString();
  writeUsers(users);

  const { password, ...safeUser } = users[idx];
  res.json(safeUser);
});

module.exports = router;
