/**
 * FindIt — Lost & Found Platform
 * Pure Node.js server — zero external dependencies
 * Run: node backend/server.js
 */

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const url    = require('url');

const PORT       = process.env.PORT || 3000;
const SECRET     = process.env.JWT_SECRET || 'findit_secret_key_2024';
const PUBLIC_DIR = path.join(__dirname, '../frontend/public');
const DATA_DIR   = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ITEMS_FILE = path.join(DATA_DIR, 'items.json');

// ── Ensure data dir exists ──────────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(ITEMS_FILE)) fs.writeFileSync(ITEMS_FILE, '[]');

// ── DB helpers ───────────────────────────────────────────────────────────────
const readJSON  = f => { try { return JSON.parse(fs.readFileSync(f,'utf8')); } catch { return []; }};
const writeJSON = (f,d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));
const readUsers  = ()  => readJSON(USERS_FILE);
const writeUsers = d   => writeJSON(USERS_FILE, d);
const readItems  = ()  => readJSON(ITEMS_FILE);
const writeItems = d   => writeJSON(ITEMS_FILE, d);

// ── Crypto / Auth ────────────────────────────────────────────────────────────
const b64u = s => Buffer.from(s).toString('base64url');

function makeToken(payload) {
  const h = b64u(JSON.stringify({ alg:'HS256', typ:'JWT' }));
  const b = b64u(JSON.stringify({ ...payload, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+604800 }));
  const s = crypto.createHmac('sha256', SECRET).update(`${h}.${b}`).digest('base64url');
  return `${h}.${b}.${s}`;
}

function readToken(token) {
  try {
    const [h,b,s] = (token||'').split('.');
    const expected = crypto.createHmac('sha256', SECRET).update(`${h}.${b}`).digest('base64url');
    if (s !== expected) return null;
    const p = JSON.parse(Buffer.from(b,'base64url').toString());
    return p.exp > Math.floor(Date.now()/1000) ? p : null;
  } catch { return null; }
}

function hashPw(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', salt).update(pw).digest('hex');
  return `${salt}:${hash}`;
}

function checkPw(pw, stored) {
  const [salt, hash] = stored.split(':');
  return crypto.createHmac('sha256', salt).update(pw).digest('hex') === hash;
}

const newId = pre => `${pre}_${crypto.randomBytes(6).toString('hex')}`;

// ── HTTP helpers ─────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type':'application/json', ...CORS });
  res.end(JSON.stringify(data));
}

function sendError(res, status, msg) { sendJSON(res, status, { error: msg }); }

function bodyJSON(req) {
  return new Promise((ok, fail) => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 12e6) req.destroy(); });
    req.on('end',  () => { try { ok(raw ? JSON.parse(raw) : {}); } catch { ok({}); }});
    req.on('error', fail);
  });
}

function authUser(req, res) {
  const h = req.headers['authorization'] || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : h;
  const u = readToken(token);
  if (!u) { sendError(res, 401, 'Not authenticated'); return null; }
  return u;
}

// ── Static file server ───────────────────────────────────────────────────────
const MIME = {
  '.html':'text/html', '.css':'text/css', '.js':'application/javascript',
  '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg',
  '.svg':'image/svg+xml', '.ico':'image/x-icon', '.woff2':'font/woff2',
};

function serveFile(res, filePath) {
  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch {
    // SPA fallback
    try {
      res.writeHead(200, { 'Content-Type':'text/html' });
      res.end(fs.readFileSync(path.join(PUBLIC_DIR,'index.html')));
    } catch { res.writeHead(404); res.end('Not found'); }
  }
}

// ── Route handlers ───────────────────────────────────────────────────────────
async function handleRequest(req, res) {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname.replace(/\/$/, '') || '/';
  const method   = req.method;
  const q        = parsed.query;

  // Preflight
  if (method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }

  // ── /api/health ─────────────────────────────────────────────────────────
  if (pathname === '/api/health' && method === 'GET')
    return sendJSON(res, 200, { status:'ok', time: new Date().toISOString() });

  // ── /api/auth/register ──────────────────────────────────────────────────
  if (pathname === '/api/auth/register' && method === 'POST') {
    const b = await bodyJSON(req);
    const { fname, lname, email, phone, city, gender, password } = b;
    if (!fname||!lname||!email||!phone||!city||!gender||!password)
      return sendError(res, 400, 'All fields are required');
    if (password.length < 6)
      return sendError(res, 400, 'Password must be at least 6 characters');
    const users = readUsers();
    if (users.find(u => u.email === email.toLowerCase().trim()))
      return sendError(res, 409, 'Email is already registered');
    const user = {
      id: newId('u'), fname: fname.trim(), lname: lname.trim(),
      name: `${fname.trim()} ${lname.trim()}`,
      email: email.toLowerCase().trim(), phone: phone.trim(),
      city: city.trim(), gender,
      password: hashPw(password),
      createdAt: new Date().toISOString()
    };
    users.push(user); writeUsers(users);
    const { password:_, ...safe } = user;
    return sendJSON(res, 201, { user: safe, token: makeToken({ id: user.id, email: user.email }) });
  }

  // ── /api/auth/login ─────────────────────────────────────────────────────
  if (pathname === '/api/auth/login' && method === 'POST') {
    const b = await bodyJSON(req);
    const { email, password } = b;
    if (!email || !password) return sendError(res, 400, 'Email and password are required');
    const users = readUsers();
    const user  = users.find(u => u.email === email.toLowerCase().trim());
    if (!user || !checkPw(password, user.password))
      return sendError(res, 401, 'Invalid email or password');
    const { password:_, ...safe } = user;
    return sendJSON(res, 200, { user: safe, token: makeToken({ id: user.id, email: user.email }) });
  }

  // ── /api/auth/me ────────────────────────────────────────────────────────
  if (pathname === '/api/auth/me' && method === 'GET') {
    const auth = authUser(req, res); if (!auth) return;
    const user = readUsers().find(u => u.id === auth.id);
    if (!user) return sendError(res, 404, 'User not found');
    const { password:_, ...safe } = user;
    return sendJSON(res, 200, safe);
  }

  // ── /api/items/stats ────────────────────────────────────────────────────
  if (pathname === '/api/items/stats' && method === 'GET') {
    const auth = authUser(req, res); if (!auth) return;
    const items = readItems();
    return sendJSON(res, 200, {
      total:    items.length,
      lost:     items.filter(i => i.type   === 'lost').length,
      found:    items.filter(i => i.type   === 'found').length,
      pending:  items.filter(i => i.status === 'pending').length,
      returned: items.filter(i => i.status === 'returned').length,
      myItems:  items.filter(i => i.userId === auth.id).length,
    });
  }

  // ── GET /api/items ──────────────────────────────────────────────────────
  if (pathname === '/api/items' && method === 'GET') {
    const auth = authUser(req, res); if (!auth) return;
    let items = readItems();
    if (q.type)     items = items.filter(i => i.type     === q.type);
    if (q.category) items = items.filter(i => i.category === q.category);
    if (q.status)   items = items.filter(i => i.status   === q.status);
    if (q.colour)   items = items.filter(i => i.colour   === q.colour);
    if (q.userId)   items = items.filter(i => i.userId   === q.userId);
    if (q.q) {
      const s = q.q.toLowerCase();
      items = items.filter(i =>
        i.title?.toLowerCase().includes(s) ||
        i.description?.toLowerCase().includes(s) ||
        i.location?.toLowerCase().includes(s) ||
        i.category?.toLowerCase().includes(s)
      );
    }
    return sendJSON(res, 200, items.slice().reverse());
  }

  // ── POST /api/items ─────────────────────────────────────────────────────
  if (pathname === '/api/items' && method === 'POST') {
    const auth = authUser(req, res); if (!auth) return;
    const b = await bodyJSON(req);
    const { title, category, date, description, colour, location, type } = b;
    if (!title||!category||!date||!description||!colour||!location||!type)
      return sendError(res, 400, 'Required fields missing');
    const users = readUsers();
    const user  = users.find(u => u.id === auth.id);
    const item  = {
      id: newId('item'), type, status: type,
      userId: auth.id, userName: user?.name || 'Unknown',
      title: title.trim(), category, date, description: description.trim(), colour,
      size: b.size||'', brand: b.brand?.trim()||'', features: b.features?.trim()||'',
      condition: b.condition||'', location: location.trim(),
      landmark: b.landmark?.trim()||'', locationDesc: b.locationDesc?.trim()||'',
      currentLocation: b.currentLocation||'',
      contactName: user?.name||'', contactPhone: b.contactPhone?.trim()||user?.phone||'',
      contactEmail: user?.email||'', contactMethod: b.contactMethod||'Any',
      reward: b.reward?.trim()||'', imageData: b.imageData||null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      updates: [{ date: new Date().toISOString(), status: type,
        message: type==='lost' ? 'Report submitted — actively searching.' : 'Item found and reported — awaiting owner contact.' }]
    };
    const items = readItems(); items.push(item); writeItems(items);
    return sendJSON(res, 201, item);
  }

  // ── /api/items/:id  and sub-routes ──────────────────────────────────────
  const mItem = pathname.match(/^\/api\/items\/([^\/]+)(\/.*)?$/);
  if (mItem) {
    const itemId  = mItem[1];
    const subPath = mItem[2] || '';

    // GET single item
    if (!subPath && method === 'GET') {
      const auth = authUser(req, res); if (!auth) return;
      const item = readItems().find(i => i.id === itemId);
      return item ? sendJSON(res, 200, item) : sendError(res, 404, 'Item not found');
    }

    // PUT update item
    if (!subPath && method === 'PUT') {
      const auth = authUser(req, res); if (!auth) return;
      const b     = await bodyJSON(req);
      const items = readItems();
      const idx   = items.findIndex(i => i.id === itemId);
      if (idx === -1) return sendError(res, 404, 'Item not found');
      if (items[idx].userId !== auth.id) return sendError(res, 403, 'Not authorized');
      ['title','category','date','description','colour','size','brand','features',
       'condition','location','landmark','locationDesc','currentLocation',
       'contactPhone','contactMethod','reward','imageData']
        .forEach(f => { if (b[f] !== undefined) items[idx][f] = b[f]; });
      items[idx].updatedAt = new Date().toISOString();
      writeItems(items);
      return sendJSON(res, 200, items[idx]);
    }

    // DELETE item
    if (!subPath && method === 'DELETE') {
      const auth  = authUser(req, res); if (!auth) return;
      let items   = readItems();
      const item  = items.find(i => i.id === itemId);
      if (!item) return sendError(res, 404, 'Item not found');
      if (item.userId !== auth.id) return sendError(res, 403, 'Not authorized');
      writeItems(items.filter(i => i.id !== itemId));
      return sendJSON(res, 200, { message: 'Deleted' });
    }

    // PATCH /api/items/:id/status
    if (subPath === '/status' && method === 'PATCH') {
      const auth  = authUser(req, res); if (!auth) return;
      const b     = await bodyJSON(req);
      if (!b.status) return sendError(res, 400, 'Status required');
      const items = readItems();
      const idx   = items.findIndex(i => i.id === itemId);
      if (idx === -1) return sendError(res, 404, 'Item not found');
      if (items[idx].userId !== auth.id) return sendError(res, 403, 'Not authorized');
      items[idx].status = b.status;
      items[idx].updatedAt = new Date().toISOString();
      if (!items[idx].updates) items[idx].updates = [];
      items[idx].updates.push({ date: new Date().toISOString(), status: b.status,
        message: b.message || `Status updated to ${b.status}.` });
      writeItems(items);
      return sendJSON(res, 200, items[idx]);
    }

    // POST /api/items/:id/update
    if (subPath === '/update' && method === 'POST') {
      const auth  = authUser(req, res); if (!auth) return;
      const b     = await bodyJSON(req);
      if (!b.message) return sendError(res, 400, 'Message required');
      const items = readItems();
      const idx   = items.findIndex(i => i.id === itemId);
      if (idx === -1) return sendError(res, 404, 'Item not found');
      if (items[idx].userId !== auth.id) return sendError(res, 403, 'Not authorized');
      if (!items[idx].updates) items[idx].updates = [];
      items[idx].updates.push({ date: new Date().toISOString(),
        status: items[idx].status, message: b.message });
      items[idx].updatedAt = new Date().toISOString();
      writeItems(items);
      return sendJSON(res, 200, items[idx]);
    }
  }

  // ── /api/users/profile ──────────────────────────────────────────────────
  if (pathname === '/api/users/profile' && method === 'GET') {
    const auth = authUser(req, res); if (!auth) return;
    const user = readUsers().find(u => u.id === auth.id);
    if (!user) return sendError(res, 404, 'User not found');
    const { password:_, ...safe } = user;
    return sendJSON(res, 200, safe);
  }

  if (pathname === '/api/users/profile' && method === 'PUT') {
    const auth  = authUser(req, res); if (!auth) return;
    const b     = await bodyJSON(req);
    const users = readUsers();
    const idx   = users.findIndex(u => u.id === auth.id);
    if (idx === -1) return sendError(res, 404, 'User not found');
    ['fname','lname','phone','city'].forEach(f => { if (b[f]) users[idx][f] = b[f].trim(); });
    if (b.fname || b.lname) users[idx].name = `${users[idx].fname} ${users[idx].lname}`;
    users[idx].updatedAt = new Date().toISOString();
    writeUsers(users);
    const { password:_, ...safe } = users[idx];
    return sendJSON(res, 200, safe);
  }

  // ── Unmatched API ────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/'))
    return sendError(res, 404, 'API endpoint not found');

  // ── Static files ─────────────────────────────────────────────────────────
  const reqPath = pathname === '/' ? '/index.html' : pathname;
  const absPath = path.resolve(path.join(PUBLIC_DIR, reqPath));
  // Security: prevent directory traversal
  if (!absPath.startsWith(path.resolve(PUBLIC_DIR))) {
    res.writeHead(403); return res.end('Forbidden');
  }
  serveFile(res, absPath);
}

// ── Seed demo data on first run ──────────────────────────────────────────────
function seedDemo() {
  const users = readUsers();
  if (users.find(u => u.email === 'demo@findit.com')) return;

  const demo = {
    id:'u_demo', fname:'Demo', lname:'User', name:'Demo User',
    email:'demo@findit.com', phone:'+91 98765 00000',
    city:'Chennai', gender:'Other',
    password: hashPw('demo123'),
    createdAt: new Date().toISOString()
  };
  users.push(demo); writeUsers(users);

  const d = (n) => new Date(Date.now() - n*86400000).toISOString();
  const seed = [
    { id:'item_s1', type:'lost',  status:'lost',     userId:'u_demo', userName:'Demo User', title:'Black Samsung Galaxy S23',   category:'Electronics', date:d(2).split('T')[0], description:'Lost my Samsung Galaxy S23 near the food court. Has a cracked screen protector and a red phone case.', colour:'Black', size:'Small',     brand:'Samsung', features:'Red case, cracked screen protector', location:'Phoenix Mall, Chennai',         landmark:'Near food court',     contactName:'Demo User', contactPhone:'+91 98765 00000', contactEmail:'demo@findit.com', contactMethod:'Any',        reward:'₹1000 reward', imageData:null, createdAt:d(2), updatedAt:d(1), updates:[{date:d(2),message:'Report submitted — actively searching.',status:'lost'},{date:d(1),message:'Checked with mall security — no luck yet.',status:'lost'}] },
    { id:'item_s2', type:'found', status:'found',    userId:'u_demo', userName:'Demo User', title:'Brown Leather Wallet',        category:'Wallet',      date:d(1).split('T')[0], description:'Found a brown leather wallet near the bus stop. Contains cash and ID cards. Not opened the contents.',  colour:'Brown', size:'Small',     brand:'',        features:'Gold buckle, initials "R.K." on front',  location:'T. Nagar Bus Stop, Chennai',     landmark:'Stop No. 7',          contactName:'Demo User', contactPhone:'+91 98765 00000', contactEmail:'demo@findit.com', contactMethod:'Phone call', reward:'',             imageData:null, createdAt:d(1), updatedAt:d(1), updates:[{date:d(1),message:'Item found and reported — awaiting owner contact.',status:'found'}], currentLocation:'With me (safe custody)' },
    { id:'item_s3', type:'lost',  status:'returned', userId:'u_demo', userName:'Demo User', title:'Blue School Bag (Nike)',      category:'Bags',        date:d(5).split('T')[0], description:"Lost my son's blue Nike school bag on the MTC bus. Contains textbooks, a pencil case, and a water bottle.", colour:'Blue',  size:'Large',     brand:'Nike',    features:'Name tag "Arjun" inside',                location:'MTC Bus Route 21C',              landmark:'Adyar Signal',        contactName:'Demo User', contactPhone:'+91 98765 00000', contactEmail:'demo@findit.com', contactMethod:'WhatsApp',   reward:'₹500 reward',  imageData:null, createdAt:d(5), updatedAt:d(3), updates:[{date:d(5),message:'Report submitted — bag lost on bus.',status:'lost'},{date:d(4),message:'A kind person found it and contacted us!',status:'pending'},{date:d(3),message:'Bag successfully returned. Thank you! 🙏',status:'returned'}] },
    { id:'item_s4', type:'found', status:'pending',  userId:'u_demo', userName:'Demo User', title:'Gold Chain Necklace',         category:'Jewellery',   date:d(3).split('T')[0], description:'Found a gold chain near the beach. Looks valuable. Please describe it correctly to claim.',             colour:'Gold',  size:'Very Small', brand:'',        features:'Small pendant, religious symbol',         location:'Marina Beach, Chennai',          landmark:'Near lighthouse',     contactName:'Demo User', contactPhone:'+91 98765 00000', contactEmail:'demo@findit.com', contactMethod:'WhatsApp',   reward:'',             imageData:null, createdAt:d(3), updatedAt:d(2), updates:[{date:d(3),message:'Item found and reported.',status:'found'},{date:d(2),message:'Someone has reached out — verifying details.',status:'pending'}], currentLocation:'With me (safe custody)' },
    { id:'item_s5', type:'lost',  status:'lost',     userId:'u_demo', userName:'Demo User', title:'Maroon Passport & Documents', category:'Documents',   date:d(0).split('T')[0], description:'Lost my passport and visa documents at the airport. Very urgent — flying in 3 days!',              colour:'Red',   size:'Small',     brand:'Govt of India', features:'Name: Rajesh Kumar',               location:'Chennai International Airport', landmark:'Terminal 2, Departures', contactName:'Demo User', contactPhone:'+91 98765 00000', contactEmail:'demo@findit.com', contactMethod:'Phone call', reward:'',             imageData:null, createdAt:d(0), updatedAt:d(0), updates:[{date:d(0),message:'URGENT: Documents lost at airport!',status:'lost'}] },
  ];

  const existing = readItems();
  writeItems([...existing, ...seed.filter(s => !existing.find(e => e.id === s.id))]);
  console.log('  📦  Demo data ready  →  demo@findit.com  /  demo123');
}

// ── Start ────────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    console.error('Request error:', err);
    sendError(res, 500, 'Internal server error');
  });
});

server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   🔍  FindIt — Lost & Found Platform         ║');
  console.log('║                                              ║');
  console.log(`║   👉  Open:  http://localhost:${PORT}            ║`);
  console.log(`║   📡  API:   http://localhost:${PORT}/api        ║`);
  console.log('╚══════════════════════════════════════════════╝\n');
  seedDemo();
});
