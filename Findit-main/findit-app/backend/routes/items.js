const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readItems, writeItems, readUsers } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/items - browse with filters
router.get('/', authMiddleware, (req, res) => {
  let items = readItems();
  const { type, category, status, colour, q, userId } = req.query;

  if (type) items = items.filter(i => i.type === type);
  if (category) items = items.filter(i => i.category === category);
  if (status) items = items.filter(i => i.status === status);
  if (colour) items = items.filter(i => i.colour === colour);
  if (userId) items = items.filter(i => i.userId === userId);
  if (q) {
    const query = q.toLowerCase();
    items = items.filter(i =>
      i.title?.toLowerCase().includes(query) ||
      i.description?.toLowerCase().includes(query) ||
      i.location?.toLowerCase().includes(query) ||
      i.category?.toLowerCase().includes(query)
    );
  }

  items = items.slice().reverse();
  res.json(items);
});

// GET /api/items/stats - dashboard stats
router.get('/stats', authMiddleware, (req, res) => {
  const items = readItems();
  res.json({
    total: items.length,
    lost: items.filter(i => i.type === 'lost').length,
    found: items.filter(i => i.type === 'found').length,
    pending: items.filter(i => i.status === 'pending').length,
    returned: items.filter(i => i.status === 'returned').length,
    myItems: items.filter(i => i.userId === req.user.id).length
  });
});

// GET /api/items/:id
router.get('/:id', authMiddleware, (req, res) => {
  const items = readItems();
  const item = items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

// POST /api/items - create item
router.post('/', authMiddleware, (req, res) => {
  const { title, category, date, description, colour, location, type } = req.body;
  if (!title || !category || !date || !description || !colour || !location || !type) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  const users = readUsers();
  const user = users.find(u => u.id === req.user.id);

  const item = {
    id: 'item_' + uuidv4().split('-')[0],
    type,
    status: type,
    userId: req.user.id,
    userName: user?.name || 'Unknown',
    title: title.trim(),
    category,
    date,
    description: description.trim(),
    colour,
    size: req.body.size || '',
    brand: req.body.brand?.trim() || '',
    features: req.body.features?.trim() || '',
    condition: req.body.condition || '',
    location: location.trim(),
    landmark: req.body.landmark?.trim() || '',
    locationDesc: req.body.locationDesc?.trim() || '',
    currentLocation: req.body.currentLocation || '',
    contactName: user?.name || '',
    contactPhone: req.body.contactPhone?.trim() || user?.phone || '',
    contactEmail: user?.email || '',
    contactMethod: req.body.contactMethod || 'Any',
    reward: req.body.reward?.trim() || '',
    imageData: req.body.imageData || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updates: [{
      date: new Date().toISOString(),
      message: type === 'lost' ? 'Report submitted — actively searching.' : 'Item found and reported — awaiting owner contact.',
      status: type
    }]
  };

  const items = readItems();
  items.push(item);
  writeItems(items);

  res.status(201).json(item);
});

// PUT /api/items/:id - update item
router.put('/:id', authMiddleware, (req, res) => {
  const items = readItems();
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  if (items[idx].userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  const allowed = ['title','category','date','description','colour','size','brand','features','condition',
    'location','landmark','locationDesc','currentLocation','contactPhone','contactMethod','reward','imageData'];
  
  allowed.forEach(field => {
    if (req.body[field] !== undefined) items[idx][field] = req.body[field];
  });
  items[idx].updatedAt = new Date().toISOString();
  writeItems(items);

  res.json(items[idx]);
});

// PATCH /api/items/:id/status - update status only
router.patch('/:id/status', authMiddleware, (req, res) => {
  const { status, message } = req.body;
  if (!status) return res.status(400).json({ error: 'Status required' });

  const items = readItems();
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  if (items[idx].userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  items[idx].status = status;
  items[idx].updatedAt = new Date().toISOString();
  if (!items[idx].updates) items[idx].updates = [];
  items[idx].updates.push({
    date: new Date().toISOString(),
    message: message || `Status updated to ${status}.`,
    status
  });

  writeItems(items);
  res.json(items[idx]);
});

// POST /api/items/:id/update - add timeline update
router.post('/:id/update', authMiddleware, (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const items = readItems();
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  if (items[idx].userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  if (!items[idx].updates) items[idx].updates = [];
  items[idx].updates.push({
    date: new Date().toISOString(),
    message,
    status: items[idx].status
  });
  items[idx].updatedAt = new Date().toISOString();

  writeItems(items);
  res.json(items[idx]);
});

// DELETE /api/items/:id
router.delete('/:id', authMiddleware, (req, res) => {
  let items = readItems();
  const item = items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  items = items.filter(i => i.id !== req.params.id);
  writeItems(items);

  res.json({ message: 'Item deleted successfully' });
});

module.exports = router;
