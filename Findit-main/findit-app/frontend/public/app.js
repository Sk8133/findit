// ============ UTILS ============
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function catIcon(cat) {
  const m = { Electronics:'📱', Clothing:'👕', Documents:'📄', Jewellery:'💍', Bags:'👜', Keys:'🔑', Wallet:'👛', Books:'📚', Toys:'🧸', Other:'📦' };
  return m[cat] || '📦';
}

function statusBadge(status) {
  const map = {
    lost: `<span class="badge badge-lost">● Lost</span>`,
    found: `<span class="badge badge-found">● Found</span>`,
    pending: `<span class="badge badge-pending">⏳ Pending</span>`,
    returned: `<span class="badge badge-returned">✓ Returned</span>`,
  };
  return map[status] || `<span class="badge badge-pending">${status}</span>`;
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function loading(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
}

// ============ ROUTER ============
let currentPage = '';
let currentUser = null;

async function navigate(page, params = {}) {
  currentUser = getCurrentUser();
  if (!currentUser && page !== 'login' && page !== 'register') {
    renderLogin();
    return;
  }
  if (currentUser && (page === 'login' || page === 'register')) {
    navigate('dashboard');
    return;
  }
  currentPage = page;
  switch (page) {
    case 'login':     renderLogin(); break;
    case 'register':  renderRegister(); break;
    case 'dashboard': await renderDashboard(); break;
    case 'browse':    await renderBrowse(params); break;
    case 'report-lost':  renderReportForm('lost'); break;
    case 'report-found': renderReportForm('found'); break;
    case 'my-items':  await renderMyItems(); break;
    case 'item-detail': await renderItemDetail(params.id); break;
    case 'edit-item':   await renderEditItem(params.id); break;
    default: navigate('dashboard');
  }
}

// ============ SIDEBAR ============
function getSidebar(active) {
  if (!currentUser) return '';
  const links = [
    { page: 'dashboard',     icon: '🏠', label: 'Dashboard' },
    { page: 'browse',        icon: '🗂️', label: 'Browse Items' },
    { page: 'report-lost',   icon: '🔴', label: 'Report Lost' },
    { page: 'report-found',  icon: '🟢', label: 'Report Found' },
    { page: 'my-items',      icon: '📋', label: 'My Reports' },
  ];
  const navLinks = links.map(l => `
    <button class="nav-link ${active === l.page ? 'active' : ''}" onclick="navigate('${l.page}')">
      <span class="nav-icon">${l.icon}</span>
      <span>${l.label}</span>
    </button>
  `).join('');
  return `
  <aside class="sidebar">
    <div>
      <a class="sidebar-logo" onclick="navigate('dashboard')" style="cursor:pointer;">
        <div class="sidebar-logo-icon">🔍</div>
        <div class="sidebar-logo-text">FindIt</div>
      </a>
      <div class="nav-section-label">Navigation</div>
      ${navLinks}
    </div>
    <div>
      <div class="user-chip">
        <div class="user-avatar">${currentUser.fname[0]}${currentUser.lname[0]}</div>
        <div style="min-width:0;">
          <div class="user-name">${currentUser.name}</div>
          <div class="user-city">${currentUser.city}</div>
        </div>
      </div>
      <button class="btn-logout" onclick="doLogout()">Sign Out</button>
    </div>
  </aside>`;
}

function withLayout(page, html) {
  return `
  <div class="app-layout">
    ${getSidebar(page)}
    <div class="main-content">
      <div class="page-wrap">${html}</div>
    </div>
  </div>`;
}

function render(html) {
  document.getElementById('app').innerHTML = html;
}

// ============ LOGIN PAGE ============
function renderLogin() {
  render(`
  <div class="auth-page">
    <div class="auth-orb auth-orb-1"></div>
    <div class="auth-orb auth-orb-2"></div>
    <div class="login-card">
      <div class="login-left">
        <div class="login-logo">
          <div class="login-logo-icon">🔍</div>
          <div class="login-logo-text">FindIt</div>
        </div>
        <h1>Reuniting People<br>with their <span>Lost</span><br>Belongings</h1>
        <p>A community-powered lost & found platform that helps you track, report, and recover lost items with ease.</p>
        <div class="feature-list">
          <div class="feature-item"><div class="feature-dot"></div> Report lost or found items instantly</div>
          <div class="feature-item"><div class="feature-dot"></div> Upload photos & detailed descriptions</div>
          <div class="feature-item"><div class="feature-dot"></div> Track status: Lost · Found · Pending · Returned</div>
          <div class="feature-item"><div class="feature-dot"></div> Connect directly with finders & owners</div>
        </div>
      </div>
      <div class="login-right">
        <h2>Welcome Back</h2>
        <p class="sub">Sign in to your FindIt account</p>
        <div class="form-error" id="loginError"></div>
        <div class="form-group">
          <label>Email Address</label>
          <input class="form-control" type="email" id="loginEmail" placeholder="you@example.com">
        </div>
        <div class="form-group">
          <label>Password</label>
          <input class="form-control" type="password" id="loginPass" placeholder="••••••••"
            onkeydown="if(event.key==='Enter') doLogin()">
        </div>
        <button class="btn btn-primary btn-lg" style="width:100%;margin-top:4px;" onclick="doLogin()" id="loginBtn">
          Sign In →
        </button>
        <div class="divider" style="margin:20px 0;">or</div>
        <div class="link-text">Don't have an account? <button onclick="navigate('register')">Create one free</button></div>
        <div style="margin-top:16px;padding:12px;background:rgba(108,99,255,0.08);border:1px solid rgba(108,99,255,0.2);border-radius:9px;font-size:12px;color:var(--muted);">
          <strong style="color:var(--text2);">Demo account:</strong> demo@findit.com / demo123
        </div>
      </div>
    </div>
  </div>`);
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value.trim();
  const errEl = document.getElementById('loginError');
  errEl.className = 'form-error';

  if (!email || !pass) {
    errEl.textContent = 'Please fill in all fields.';
    errEl.className = 'form-error show'; return;
  }

  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Signing in…';

  try {
    const data = await api.login(email, pass);
    setAuth(data.user, data.token);
    currentUser = data.user;
    showToast(`Welcome back, ${data.user.fname}! 👋`);
    navigate('dashboard');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.className = 'form-error show';
    btn.disabled = false; btn.textContent = 'Sign In →';
  }
}

// ============ REGISTER PAGE ============
function renderRegister() {
  render(`
  <div class="auth-page">
    <div class="auth-orb auth-orb-1" style="background:var(--accent2);"></div>
    <div class="auth-orb auth-orb-2" style="background:var(--accent);"></div>
    <div class="register-card">
      <div class="register-header">
        <div>
          <div class="login-logo" style="margin-bottom:0;">
            <div class="login-logo-icon" style="width:36px;height:36px;font-size:18px;">🔍</div>
            <div class="login-logo-text" style="font-size:20px;">FindIt</div>
          </div>
        </div>
        <div>
          <h2 style="font-family:var(--font-display);font-size:21px;font-weight:700;">Create Your Account</h2>
          <p style="color:var(--muted);font-size:13px;margin-top:4px;">Join the community and help reunite people with their belongings</p>
        </div>
      </div>
      <div class="register-body">
        <div class="form-error" id="regError"></div>
        <div class="form-success" id="regSuccess">Account created! Signing you in…</div>
        <div class="form-grid-2">
          <div class="form-group">
            <label>First Name *</label>
            <input class="form-control" type="text" id="regFname" placeholder="John">
          </div>
          <div class="form-group">
            <label>Last Name *</label>
            <input class="form-control" type="text" id="regLname" placeholder="Doe">
          </div>
          <div class="form-group">
            <label>Email Address *</label>
            <input class="form-control" type="email" id="regEmail" placeholder="john@example.com">
          </div>
          <div class="form-group">
            <label>Phone Number *</label>
            <input class="form-control" type="tel" id="regPhone" placeholder="+91 98765 43210">
          </div>
          <div class="form-group">
            <label>City / Location *</label>
            <input class="form-control" type="text" id="regCity" placeholder="Chennai">
          </div>
          <div class="form-group">
            <label>Gender *</label>
            <select class="form-control" id="regGender">
              <option value="">Select gender</option>
              <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
            </select>
          </div>
          <div class="form-group">
            <label>Password *</label>
            <input class="form-control" type="password" id="regPass" placeholder="Min 6 characters">
            <div class="form-help">Must be at least 6 characters</div>
          </div>
          <div class="form-group">
            <label>Confirm Password *</label>
            <input class="form-control" type="password" id="regCpass" placeholder="Repeat password"
              onkeydown="if(event.key==='Enter') doRegister()">
          </div>
        </div>
        <div class="checkbox-group" style="margin-top:16px;">
          <input type="checkbox" id="regAgree">
          <label for="regAgree">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>. I understand that posting false information is prohibited.</label>
        </div>
        <div class="register-footer">
          <div class="link-text">Already have an account? <button onclick="navigate('login')">Sign in</button></div>
          <button class="btn btn-primary" style="padding:12px 32px;" onclick="doRegister()" id="regBtn">Create Account →</button>
        </div>
      </div>
    </div>
  </div>`);
}

async function doRegister() {
  const errEl = document.getElementById('regError');
  const sucEl = document.getElementById('regSuccess');
  errEl.className = 'form-error';
  sucEl.className = 'form-success';

  const fname  = document.getElementById('regFname').value.trim();
  const lname  = document.getElementById('regLname').value.trim();
  const email  = document.getElementById('regEmail').value.trim();
  const phone  = document.getElementById('regPhone').value.trim();
  const city   = document.getElementById('regCity').value.trim();
  const gender = document.getElementById('regGender').value;
  const pass   = document.getElementById('regPass').value;
  const cpass  = document.getElementById('regCpass').value;
  const agree  = document.getElementById('regAgree').checked;

  const show = (msg) => { errEl.textContent = msg; errEl.className = 'form-error show'; };

  if (!fname||!lname||!email||!phone||!city||!gender||!pass||!cpass) return show('Please fill in all required fields.');
  if (pass.length < 6) return show('Password must be at least 6 characters.');
  if (pass !== cpass) return show('Passwords do not match.');
  if (!agree) return show('Please agree to the Terms of Service.');

  const btn = document.getElementById('regBtn');
  btn.disabled = true; btn.textContent = 'Creating account…';

  try {
    const data = await api.register({ fname, lname, email, phone, city, gender, password: pass });
    setAuth(data.user, data.token);
    currentUser = data.user;
    sucEl.className = 'form-success show';
    setTimeout(() => navigate('dashboard'), 1200);
  } catch (err) {
    show(err.message);
    btn.disabled = false; btn.textContent = 'Create Account →';
  }
}

// ============ LOGOUT ============
function doLogout() {
  clearAuth();
  currentUser = null;
  showToast('Signed out successfully', 'info');
  navigate('login');
}

// ============ DASHBOARD ============
async function renderDashboard() {
  render(withLayout('dashboard', `
    <div class="page-header">
      <div class="page-header-left">
        <h1 id="welcomeMsg">👋 Loading…</h1>
        <p>Here's what's happening on FindIt today</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-danger" onclick="navigate('report-lost')">+ Report Lost</button>
        <button class="btn btn-success" onclick="navigate('report-found')">+ Report Found</button>
      </div>
    </div>
    <div class="stats-grid" id="statsGrid">
      ${[1,2,3,4].map(() => `<div class="stat-card"><div class="spinner" style="width:24px;height:24px;margin:auto;"></div></div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-bottom:22px;">
      <div class="card">
        <div class="card-header">
          <span class="card-title">🔴 Recent Lost Items</span>
          <button class="section-link" onclick="navigate('browse',{type:'lost'})">View all →</button>
        </div>
        <div class="card-body" id="recentLost"><div class="spinner" style="width:22px;height:22px;margin:auto;"></div></div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">🟢 Recent Found Items</span>
          <button class="section-link" onclick="navigate('browse',{type:'found'})">View all →</button>
        </div>
        <div class="card-body" id="recentFound"><div class="spinner" style="width:22px;height:22px;margin:auto;"></div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">📋 My Recent Reports</span>
        <button class="section-link" onclick="navigate('my-items')">View all →</button>
      </div>
      <div class="card-body" id="myRecent"><div class="spinner" style="width:22px;height:22px;margin:auto;"></div></div>
    </div>
  `));

  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('welcomeMsg').textContent = `${greet}, ${currentUser.fname}! 👋`;

  try {
    const [stats, allItems] = await Promise.all([api.getStats(), api.getItems()]);
    const myItems = allItems.filter(i => i.userId === currentUser.id);

    // Stats
    document.getElementById('statsGrid').innerHTML = [
      { val: stats.lost,     label: 'Total Lost Reports',   color: 'var(--danger)',  icon: '🔴', stripe: '#ff4d6a' },
      { val: stats.found,    label: 'Total Found Reports',  color: 'var(--success)', icon: '🟢', stripe: '#00d4aa' },
      { val: stats.pending,  label: 'Pending Resolution',   color: 'var(--pending)', icon: '⏳', stripe: '#f0a500' },
      { val: stats.returned, label: 'Items Returned',       color: 'var(--success)', icon: '✅', stripe: '#00d4aa' },
    ].map(s => `
      <div class="stat-card" style="--stripe-color:${s.stripe};">
        <span class="stat-icon">${s.icon}</span>
        <div class="stat-val">${s.val}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `).join('');

    // Recent lost
    const lost = allItems.filter(i => i.type === 'lost').slice(0, 5);
    document.getElementById('recentLost').innerHTML = lost.length
      ? lost.map(i => miniItemHtml(i)).join('')
      : `<div style="text-align:center;padding:24px;color:var(--muted);font-size:14px;">No lost reports yet</div>`;

    // Recent found
    const found = allItems.filter(i => i.type === 'found').slice(0, 5);
    document.getElementById('recentFound').innerHTML = found.length
      ? found.map(i => miniItemHtml(i)).join('')
      : `<div style="text-align:center;padding:24px;color:var(--muted);font-size:14px;">No found reports yet</div>`;

    // My recent
    const mine = myItems.slice(0, 6);
    if (!mine.length) {
      document.getElementById('myRecent').innerHTML = `
        <div class="empty-state" style="padding:32px;">
          <span class="empty-icon">📋</span>
          <h3>No reports yet</h3>
          <p>Start by reporting a lost or found item</p>
        </div>`;
    } else {
      document.getElementById('myRecent').innerHTML = `
        <div class="data-table">
          <div class="table-header table-row-5">
            <div>Item</div><div>Type</div><div>Category</div><div>Date</div><div>Status</div>
          </div>
          ${mine.map(item => `
            <div class="table-row table-row-5" onclick="navigate('item-detail',{id:'${item.id}'})">
              <div style="font-weight:500;">${item.title}</div>
              <div>${statusBadge(item.type)}</div>
              <div style="color:var(--muted);font-size:12px;">${item.category}</div>
              <div style="color:var(--muted);font-size:12px;">${formatDate(item.date)}</div>
              <div>${statusBadge(item.status)}</div>
            </div>
          `).join('')}
        </div>`;
    }
  } catch (err) {
    showToast('Failed to load dashboard data', 'error');
  }
}

function miniItemHtml(item) {
  const thumb = item.imageData
    ? `<div class="mini-thumb"><img src="${item.imageData}" alt="${item.title}"></div>`
    : `<div class="mini-thumb">${catIcon(item.category)}</div>`;
  return `
    <div class="mini-item" onclick="navigate('item-detail',{id:'${item.id}'})">
      ${thumb}
      <div style="flex:1;min-width:0;">
        <div class="mini-title">${item.title}</div>
        <div class="mini-meta">📍 ${item.location} · ${formatDate(item.date)}</div>
      </div>
      ${statusBadge(item.status)}
    </div>`;
}

// ============ BROWSE PAGE ============
let browseView = 'grid';
let browseFilters = {};

async function renderBrowse(params = {}) {
  if (params.type) browseFilters.type = params.type;

  render(withLayout('browse', `
    <div class="page-header">
      <div class="page-header-left">
        <h1>🗂️ Browse All Items</h1>
        <p>Search and filter through all lost and found reports</p>
      </div>
    </div>

    <div class="filters-bar">
      <div class="filters-row">
        <div class="form-group" style="margin:0;">
          <label>Search</label>
          <input class="form-control" type="text" id="searchQ" placeholder="Search title, location, description…" oninput="applyBrowseFilters()">
        </div>
        <div class="form-group" style="margin:0;">
          <label>Type</label>
          <select class="form-control" id="filterType" onchange="applyBrowseFilters()">
            <option value="">All Types</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </div>
        <div class="form-group" style="margin:0;">
          <label>Category</label>
          <select class="form-control" id="filterCat" onchange="applyBrowseFilters()">
            <option value="">All Categories</option>
            <option>Electronics</option><option>Clothing</option><option>Documents</option>
            <option>Jewellery</option><option>Bags</option><option>Keys</option>
            <option>Wallet</option><option>Books</option><option>Toys</option><option>Other</option>
          </select>
        </div>
        <div class="form-group" style="margin:0;">
          <label>Status</label>
          <select class="form-control" id="filterStatus" onchange="applyBrowseFilters()">
            <option value="">All Status</option>
            <option value="lost">Lost</option><option value="found">Found</option>
            <option value="pending">Pending</option><option value="returned">Returned</option>
          </select>
        </div>
        <div class="form-group" style="margin:0;">
          <label>Colour</label>
          <select class="form-control" id="filterColour" onchange="applyBrowseFilters()">
            <option value="">Any Colour</option>
            <option>Black</option><option>White</option><option>Grey</option><option>Red</option>
            <option>Blue</option><option>Green</option><option>Yellow</option><option>Orange</option>
            <option>Pink</option><option>Purple</option><option>Brown</option><option>Gold</option><option>Silver</option>
          </select>
        </div>
        <div style="display:flex;align-items:flex-end;">
          <button class="btn btn-ghost btn-sm" onclick="clearBrowseFilters()">Clear</button>
        </div>
      </div>
    </div>

    <div class="result-bar">
      <div class="result-count" id="resultCount">Loading…</div>
      <div class="view-toggle">
        <button class="btn btn-ghost btn-sm" id="btnGrid" onclick="setBrowseView('grid')">⊞ Grid</button>
        <button class="btn btn-ghost btn-sm" id="btnList" onclick="setBrowseView('list')">≡ List</button>
      </div>
    </div>

    <div id="browseItems"><div class="loading-spinner"><div class="spinner"></div></div></div>
  `));

  // Set pre-filters from params
  if (params.type) document.getElementById('filterType').value = params.type;

  setBrowseView(browseView);
  await loadBrowseItems();
}

async function loadBrowseItems() {
  window._allBrowseItems = await api.getItems();
  applyBrowseFilters();
}

function applyBrowseFilters() {
  if (!window._allBrowseItems) return;
  const q      = document.getElementById('searchQ')?.value.toLowerCase() || '';
  const type   = document.getElementById('filterType')?.value || '';
  const cat    = document.getElementById('filterCat')?.value || '';
  const status = document.getElementById('filterStatus')?.value || '';
  const colour = document.getElementById('filterColour')?.value || '';

  let items = window._allBrowseItems;
  if (type)   items = items.filter(i => i.type === type);
  if (cat)    items = items.filter(i => i.category === cat);
  if (status) items = items.filter(i => i.status === status);
  if (colour) items = items.filter(i => i.colour === colour);
  if (q)      items = items.filter(i =>
    i.title?.toLowerCase().includes(q) ||
    i.description?.toLowerCase().includes(q) ||
    i.location?.toLowerCase().includes(q) ||
    i.category?.toLowerCase().includes(q)
  );

  document.getElementById('resultCount').textContent = `${items.length} item${items.length !== 1 ? 's' : ''} found`;
  renderBrowseItems(items);
}

function clearBrowseFilters() {
  ['searchQ','filterType','filterCat','filterStatus','filterColour'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  applyBrowseFilters();
}

function setBrowseView(v) {
  browseView = v;
  const gBtn = document.getElementById('btnGrid');
  const lBtn = document.getElementById('btnList');
  if (!gBtn) return;
  gBtn.style.background = v === 'grid' ? 'rgba(108,99,255,0.15)' : '';
  gBtn.style.color = v === 'grid' ? 'var(--accent)' : '';
  lBtn.style.background = v === 'list' ? 'rgba(108,99,255,0.15)' : '';
  lBtn.style.color = v === 'list' ? 'var(--accent)' : '';
  if (window._allBrowseItems) applyBrowseFilters();
}

function renderBrowseItems(items) {
  const container = document.getElementById('browseItems');
  if (!container) return;
  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><h3>No items found</h3><p>Try adjusting your search filters</p></div>`;
    return;
  }

  if (browseView === 'grid') {
    container.innerHTML = `<div class="items-grid">${items.map(item => {
      const thumb = item.imageData
        ? `<div class="item-card-img"><img src="${item.imageData}" alt="${item.title}"></div>`
        : `<div class="item-card-img">${catIcon(item.category)}</div>`;
      return `
        <div class="item-card" onclick="navigate('item-detail',{id:'${item.id}'})">
          ${thumb}
          <div class="item-card-body">
            <div class="item-card-title">${item.title}</div>
            <div class="item-card-meta">
              <span class="item-tag">${item.category}</span>
              ${item.colour ? `<span class="item-tag">${item.colour}</span>` : ''}
              ${item.brand ? `<span class="item-tag">${item.brand}</span>` : ''}
            </div>
            <div class="item-card-location">📍 ${item.location}</div>
            <div class="item-card-footer">
              ${statusBadge(item.status)}
              <span class="item-card-date">${formatDate(item.date)}</span>
            </div>
          </div>
        </div>`;
    }).join('')}</div>`;
  } else {
    container.innerHTML = items.map(item => {
      const thumb = item.imageData
        ? `<div class="list-thumb"><img src="${item.imageData}" alt="${item.title}"></div>`
        : `<div class="list-thumb">${catIcon(item.category)}</div>`;
      return `
        <div class="item-list-row" onclick="navigate('item-detail',{id:'${item.id}'})">
          ${thumb}
          <div class="list-info">
            <div class="list-title">${item.title}</div>
            <div class="list-sub">📍 ${item.location}${item.landmark ? ', ' + item.landmark : ''}</div>
            <div class="list-tags">
              <span class="item-tag">${item.category}</span>
              ${item.colour ? `<span class="item-tag">${item.colour}</span>` : ''}
              ${statusBadge(item.status)}
              <span style="font-size:11px;color:var(--muted);">${formatDate(item.date)}</span>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            ${statusBadge(item.type)}
            <div style="font-size:11px;color:var(--muted);margin-top:5px;">By ${item.userName}</div>
          </div>
        </div>`;
    }).join('');
  }
}

// ============ REPORT FORM (LOST / FOUND) ============
function renderReportForm(type) {
  const isLost = type === 'lost';
  const colour = isLost ? 'var(--danger)' : 'var(--success)';
  const title  = isLost ? '🔴 Report a Lost Item' : '🟢 Report a Found Item';
  const sub    = isLost ? 'Fill in as many details as possible to help others identify your item' : 'Thank you for helping — fill in the details so the owner can find you';

  render(withLayout(`report-${type}`, `
    <div class="page-header">
      <div class="page-header-left">
        <h1>${title}</h1>
        <p>${sub}</p>
      </div>
    </div>
    <div class="report-layout">
      <!-- LEFT: Main form -->
      <div>
        <div class="card form-section" style="padding:28px;margin-bottom:18px;">
          <div class="form-section-title">📝 Basic Information</div>
          <div class="form-group">
            <label>Item Title *</label>
            <input class="form-control" type="text" id="fTitle" placeholder="${isLost ? 'e.g. Black Samsung Galaxy S23' : 'e.g. Blue leather wallet'}">
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label>Category *</label>
              <select class="form-control" id="fCategory">
                <option value="">Select category</option>
                <option>Electronics</option><option>Clothing</option><option>Documents</option>
                <option>Jewellery</option><option>Bags</option><option>Keys</option>
                <option>Wallet</option><option>Books</option><option>Toys</option><option>Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Date ${isLost ? 'Lost' : 'Found'} *</label>
              <input class="form-control" type="date" id="fDate">
            </div>
          </div>
          <div class="form-group">
            <label>Description *</label>
            <textarea class="form-control" id="fDesc" placeholder="${isLost ? 'Describe the item in detail — any unique markings, damage, stickers, etc.' : 'Describe the item — colour, brand, condition, contents (if applicable)…'}"></textarea>
          </div>
        </div>

        <div class="card form-section" style="padding:28px;margin-bottom:18px;">
          <div class="form-section-title">🎨 Appearance</div>
          <div class="form-grid-3">
            <div class="form-group">
              <label>Colour *</label>
              <select class="form-control" id="fColour">
                <option value="">Select colour</option>
                <option>Black</option><option>White</option><option>Grey</option><option>Red</option>
                <option>Blue</option><option>Green</option><option>Yellow</option><option>Orange</option>
                <option>Pink</option><option>Purple</option><option>Brown</option><option>Gold</option>
                <option>Silver</option><option>Multi-colour</option><option>Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Size</label>
              <select class="form-control" id="fSize">
                <option value="">Select size</option>
                <option>Very Small</option><option>Small</option><option>Medium</option><option>Large</option>
              </select>
            </div>
            <div class="form-group">
              <label>Brand / Make</label>
              <input class="form-control" type="text" id="fBrand" placeholder="e.g. Apple, Nike…">
            </div>
          </div>
          ${isLost ? `
          <div class="form-group">
            <label>Unique Identifying Features</label>
            <input class="form-control" type="text" id="fFeatures" placeholder="e.g. scratched back, custom case, initials engraved">
          </div>` : `
          <div class="form-group">
            <label>Item Condition</label>
            <select class="form-control" id="fCondition">
              <option value="">Select condition</option>
              <option>Excellent — like new</option><option>Good — minor wear</option>
              <option>Fair — some damage</option><option>Poor — heavily damaged</option>
            </select>
          </div>`}
        </div>

        <div class="card form-section" style="padding:28px;margin-bottom:18px;">
          <div class="form-section-title">📍 Location Details</div>
          <div class="form-grid-2">
            <div class="form-group">
              <label>Location ${isLost ? 'Lost' : 'Found'} *</label>
              <input class="form-control" type="text" id="fLocation" placeholder="${isLost ? 'e.g. Marina Beach, Chennai' : 'e.g. T. Nagar Bus Stop, Chennai'}">
            </div>
            <div class="form-group">
              <label>Area / Landmark</label>
              <input class="form-control" type="text" id="fLandmark" placeholder="e.g. near bus stop no.12">
            </div>
          </div>
          ${isLost ? `
          <div class="form-group">
            <label>Additional Location Info</label>
            <textarea class="form-control" id="fLocationDesc" style="min-height:60px;" placeholder="Any extra location details…"></textarea>
          </div>` : `
          <div class="form-group">
            <label>Where is it now?</label>
            <select class="form-control" id="fCurrentLoc">
              <option value="">Select</option>
              <option>With me (safe custody)</option><option>Submitted to police station</option>
              <option>Submitted to lost & found office</option><option>Left at the spot</option><option>Other</option>
            </select>
          </div>`}
        </div>

        <div class="card form-section" style="padding:28px;margin-bottom:18px;">
          <div class="form-section-title">📞 Contact Details</div>
          <div class="form-grid-2">
            <div class="form-group">
              <label>Your Name</label>
              <input class="form-control input-readonly" type="text" id="fContactName" readonly value="${currentUser.name}">
            </div>
            <div class="form-group">
              <label>Phone Number *</label>
              <input class="form-control" type="tel" id="fPhone" value="${currentUser.phone || ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Preferred Contact Method</label>
            <select class="form-control" id="fContactMethod">
              <option>Phone call</option><option>WhatsApp</option><option>Email</option><option>Any</option>
            </select>
          </div>
          ${isLost ? `
          <div class="form-group">
            <label>Reward Offered (Optional)</label>
            <input class="form-control" type="text" id="fReward" placeholder="e.g. ₹500 reward for finder">
          </div>` : ''}
        </div>

        <div class="form-error" id="reportError"></div>
        <button class="btn btn-primary btn-lg" style="width:100%;background:${colour};" onclick="submitReport('${type}')" id="reportBtn">
          Submit ${isLost ? 'Lost' : 'Found'} Item Report →
        </button>
      </div>

      <!-- RIGHT: Image + Tips -->
      <div>
        <div class="card" style="padding:22px;margin-bottom:18px;">
          <div class="form-section-title">📷 Upload Photo</div>
          <div class="drop-zone" id="dropZone" onclick="document.getElementById('imgInput').click()">
            <div id="previewArea">
              <span class="drop-icon">📸</span>
              <div class="drop-text">Click or drag to upload a photo</div>
              <div class="drop-hint">JPG, PNG up to 5MB</div>
            </div>
          </div>
          <input type="file" id="imgInput" accept="image/*" style="display:none;" onchange="handleImgUpload(this)">
          <button id="removeImgBtn" style="display:none;width:100%;margin-top:10px;" class="btn btn-danger btn-sm" onclick="removeImg()">Remove Image</button>
        </div>

        <div class="card" style="padding:22px;">
          <div class="form-section-title">${isLost ? '💡 Tips for Better Results' : '🙏 You\'re Making a Difference'}</div>
          ${isLost ? `
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${['Upload a clear photo of the item or a similar one','Mention serial numbers, IMEIs, or unique marks','Be specific about the exact location and time','Update the status once your item is found','Offering a reward increases response rates'].map(t => `
              <div style="display:flex;gap:10px;align-items:flex-start;">
                <span style="color:var(--accent);flex-shrink:0;font-weight:700;">✓</span>
                <span style="font-size:13px;color:var(--muted);">${t}</span>
              </div>`).join('')}
          </div>` : `
          <p style="font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:14px;">By reporting this found item, you're helping someone reconnect with something important to them. Thank you!</p>
          ${['Take a clear photo before submitting','Keep the item safe until the owner contacts you','Don\'t share sensitive personal info from documents','Meet in a public place when returning the item'].map(t => `
            <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;">
              <span style="color:var(--success);flex-shrink:0;font-weight:700;">✓</span>
              <span style="font-size:13px;color:var(--muted);">${t}</span>
            </div>`).join('')}
          `}
        </div>
      </div>
    </div>
  `));

  // Set today's date
  document.getElementById('fDate').value = new Date().toISOString().split('T')[0];

  // Drag & drop
  const dz = document.getElementById('dropZone');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.borderColor = 'var(--accent)'; });
  dz.addEventListener('dragleave', () => dz.style.borderColor = '');
  dz.addEventListener('drop', e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { const dt = new DataTransfer(); dt.items.add(file); document.getElementById('imgInput').files = dt.files; handleImgUpload(document.getElementById('imgInput')); }
  });
}

let _imageData = null;

function handleImgUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    _imageData = e.target.result;
    const dz = document.getElementById('dropZone');
    dz.innerHTML = `<img src="${_imageData}" style="width:100%;height:160px;object-fit:cover;border-radius:12px;display:block;">`;
    dz.classList.add('has-image');
    document.getElementById('removeImgBtn').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function removeImg() {
  _imageData = null;
  document.getElementById('imgInput').value = '';
  const dz = document.getElementById('dropZone');
  dz.classList.remove('has-image');
  dz.innerHTML = `<span class="drop-icon">📸</span><div class="drop-text">Click or drag to upload a photo</div><div class="drop-hint">JPG, PNG up to 5MB</div>`;
  document.getElementById('removeImgBtn').style.display = 'none';
}

async function submitReport(type) {
  const isLost = type === 'lost';
  const errEl  = document.getElementById('reportError');
  errEl.className = 'form-error';

  const title    = document.getElementById('fTitle').value.trim();
  const category = document.getElementById('fCategory').value;
  const date     = document.getElementById('fDate').value;
  const desc     = document.getElementById('fDesc').value.trim();
  const colour   = document.getElementById('fColour').value;
  const location = document.getElementById('fLocation').value.trim();
  const phone    = document.getElementById('fPhone').value.trim();

  const show = (msg) => { errEl.textContent = msg; errEl.className = 'form-error show'; window.scrollTo(0, document.body.scrollHeight); };

  if (!title || !category || !date || !desc || !colour || !location || !phone) {
    return show('Please fill in all required (*) fields.');
  }

  const btn = document.getElementById('reportBtn');
  btn.disabled = true; btn.textContent = 'Submitting…';

  try {
    await api.createItem({
      type, title, category, date, description: desc, colour,
      size:             document.getElementById('fSize')?.value || '',
      brand:            document.getElementById('fBrand')?.value?.trim() || '',
      features:         document.getElementById('fFeatures')?.value?.trim() || '',
      condition:        document.getElementById('fCondition')?.value || '',
      location,
      landmark:         document.getElementById('fLandmark')?.value?.trim() || '',
      locationDesc:     document.getElementById('fLocationDesc')?.value?.trim() || '',
      currentLocation:  document.getElementById('fCurrentLoc')?.value || '',
      contactPhone:     phone,
      contactMethod:    document.getElementById('fContactMethod')?.value || 'Any',
      reward:           document.getElementById('fReward')?.value?.trim() || '',
      imageData:        _imageData,
    });
    _imageData = null;
    showToast(`✅ ${isLost ? 'Lost' : 'Found'} item reported successfully!`);
    navigate('my-items');
  } catch (err) {
    show(err.message);
    btn.disabled = false;
    btn.textContent = `Submit ${isLost ? 'Lost' : 'Found'} Item Report →`;
  }
}

// ============ MY ITEMS ============
let myTab = 'all';

async function renderMyItems() {
  render(withLayout('my-items', `
    <div class="page-header">
      <div class="page-header-left">
        <h1>📋 My Reports</h1>
        <p>Manage all your lost and found reports</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-danger" onclick="navigate('report-lost')">+ Report Lost</button>
        <button class="btn btn-success" onclick="navigate('report-found')">+ Report Found</button>
      </div>
    </div>
    <div class="tabs">
      <button class="tab-btn active" id="tab-all"      onclick="switchMyTab('all')">All Items</button>
      <button class="tab-btn"        id="tab-lost"     onclick="switchMyTab('lost')">🔴 Lost</button>
      <button class="tab-btn"        id="tab-found"    onclick="switchMyTab('found')">🟢 Found</button>
      <button class="tab-btn"        id="tab-returned" onclick="switchMyTab('returned')">✅ Returned</button>
    </div>
    <div id="myItemsList"><div class="loading-spinner"><div class="spinner"></div></div></div>
  `));

  window._myItemsAll = await api.getItems({ userId: currentUser.id });
  switchMyTab(myTab);
}

function switchMyTab(tab) {
  myTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const el = document.getElementById('tab-' + tab);
  if (el) el.classList.add('active');
  renderMyItemsList();
}

function renderMyItemsList() {
  let items = window._myItemsAll || [];
  if (myTab === 'lost')     items = items.filter(i => i.type === 'lost' && i.status !== 'returned');
  if (myTab === 'found')    items = items.filter(i => i.type === 'found' && i.status !== 'returned');
  if (myTab === 'returned') items = items.filter(i => i.status === 'returned');

  const container = document.getElementById('myItemsList');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">📋</span><h3>No items here</h3><p>You haven't reported any items yet. <button class="section-link" onclick="navigate('report-lost')">Report one now</button></p></div>`;
    return;
  }

  const stripeColor = { lost:'var(--danger)', found:'var(--success)', pending:'var(--pending)', returned:'var(--success)' };

  container.innerHTML = items.map(item => {
    const lastUpdate = item.updates && item.updates.length > 1 ? item.updates[item.updates.length - 1] : null;
    const thumb = item.imageData
      ? `<div class="my-item-thumb"><img src="${item.imageData}" alt="${item.title}"></div>`
      : `<div class="my-item-thumb">${catIcon(item.category)}</div>`;

    return `
      <div class="my-item-row">
        <div class="my-item-stripe" style="background:${stripeColor[item.status] || 'var(--muted)'}"></div>
        ${thumb}
        <div class="my-item-body">
          <div class="my-item-title" onclick="navigate('item-detail',{id:'${item.id}'})">${item.title}</div>
          <div class="my-item-meta">
            ${statusBadge(item.type)}
            ${statusBadge(item.status)}
            <span>📍 ${item.location}</span>
            <span>📅 ${formatDate(item.date)}</span>
            <span>🏷️ ${item.category}</span>
          </div>
          ${lastUpdate ? `<div class="update-note">Latest: ${lastUpdate.message}</div>` : ''}
        </div>
        <div class="my-item-actions">
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;gap:5px;flex-wrap:wrap;">
              ${item.status !== 'pending'  ? `<button class="btn btn-sm" style="background:rgba(240,165,0,0.1);border:1px solid rgba(240,165,0,0.3);color:var(--pending);" onclick="myQuickStatus('${item.id}','pending')">⏳ Pending</button>` : ''}
              ${item.status !== 'returned' ? `<button class="btn btn-sm" style="background:rgba(0,212,170,0.1);border:1px solid rgba(0,212,170,0.3);color:var(--success);" onclick="myQuickStatus('${item.id}','returned')">✅ Returned</button>` : ''}
            </div>
            <div style="display:flex;gap:5px;">
              <button class="btn btn-ghost btn-sm" onclick="navigate('item-detail',{id:'${item.id}'})">View</button>
              <button class="btn btn-ghost btn-sm" onclick="navigate('edit-item',{id:'${item.id}'})">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="myDeleteItem('${item.id}')">🗑️</button>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

async function myQuickStatus(id, status) {
  const labels = { lost:'Marked as still lost.', found:'Marked as found.', pending:'Marked as pending resolution.', returned:'Item has been returned to owner! ✓' };
  try {
    await api.updateStatus(id, status, labels[status]);
    window._myItemsAll = await api.getItems({ userId: currentUser.id });
    renderMyItemsList();
    showToast(`Status updated to ${status}`);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function myDeleteItem(id) {
  if (!confirm('Are you sure you want to delete this report?')) return;
  try {
    await api.deleteItem(id);
    window._myItemsAll = window._myItemsAll.filter(i => i.id !== id);
    renderMyItemsList();
    showToast('Item deleted');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============ ITEM DETAIL ============
async function renderItemDetail(id) {
  render(withLayout('browse', `<div class="loading-spinner"><div class="spinner"></div></div>`));
  try {
    const item = await api.getItem(id);
    _renderDetail(item);
  } catch (err) {
    render(withLayout('browse', `<div class="empty-state"><span class="empty-icon">❌</span><h3>Item not found</h3><button class="section-link" onclick="navigate('browse')">← Back to Browse</button></div>`));
  }
}

function _renderDetail(item) {
  const isOwner = item.userId === currentUser.id;
  const statusColors = { lost: 'var(--danger)', found: 'var(--success)', pending: 'var(--pending)', returned: 'var(--success)' };
  const headerColor = statusColors[item.status] || 'var(--accent)';

  const thumb = item.imageData
    ? `<div class="detail-hero-img"><img src="${item.imageData}" alt="${item.title}"></div>`
    : `<div class="detail-hero-img">${catIcon(item.category)}</div>`;

  const infoRows = [
    ['Category',   item.category],
    ['Colour',     item.colour],
    ['Size',       item.size],
    ['Brand',      item.brand],
    ['Date ' + (item.type === 'lost' ? 'Lost' : 'Found'), formatDate(item.date)],
    ['Location',   item.location + (item.landmark ? ', ' + item.landmark : '')],
    item.features      ? ['Unique Features', item.features]     : null,
    item.condition     ? ['Condition',       item.condition]    : null,
    item.currentLocation ? ['Currently At',  item.currentLocation] : null,
    item.reward        ? ['Reward',          item.reward]       : null,
  ].filter(Boolean);

  const timeline = (item.updates || []).slice().reverse().map((u, idx, arr) => {
    const dotColor = u.status === 'returned' || u.status === 'found' ? 'var(--success)' : u.status === 'pending' ? 'var(--pending)' : 'var(--danger)';
    return `
      <div class="timeline-item">
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div class="timeline-dot" style="background:${dotColor};"></div>
          ${idx < arr.length - 1 ? '<div style="width:2px;flex:1;background:var(--border);margin-top:4px;min-height:20px;"></div>' : ''}
        </div>
        <div class="timeline-content">
          <div class="timeline-date">${formatDate(u.date)} ${statusBadge(u.status)}</div>
          <div class="timeline-msg">${u.message}</div>
        </div>
      </div>`;
  }).join('');

  render(withLayout('browse', `
    <div style="margin-bottom:20px;">
      <button class="back-link" onclick="navigate('browse')">← Back to Browse</button>
      <div class="page-header" style="margin-bottom:0;">
        <div class="page-header-left">
          <h1 style="font-size:24px;">${item.title}</h1>
          <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap;">
            ${statusBadge(item.type)} ${statusBadge(item.status)}
            <span style="font-size:12px;color:var(--muted);">Reported by ${item.userName} on ${formatDate(item.createdAt)}</span>
          </div>
        </div>
        ${isOwner ? `
        <div class="page-header-actions">
          <button class="btn btn-ghost" onclick="navigate('edit-item',{id:'${item.id}'})">✏️ Edit</button>
        </div>` : ''}
      </div>
    </div>

    <div class="detail-grid">
      <!-- LEFT -->
      <div>
        ${thumb}
        <div class="card" style="margin-bottom:20px;">
          <div class="card-header"><span class="card-title">📋 Description</span></div>
          <div class="card-body">
            <p style="font-size:14px;color:var(--text2);line-height:1.75;">${item.description || 'No description provided.'}</p>
            ${item.locationDesc ? `<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);font-size:13px;color:var(--muted);"><strong style="color:var(--text);">Location Notes:</strong> ${item.locationDesc}</div>` : ''}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">📊 Item Details</span></div>
          <div class="card-body">
            ${infoRows.map(([label, val]) => val ? `
              <div class="info-row">
                <div class="info-label">${label}</div>
                <div class="info-value">${val}</div>
              </div>` : '').join('')}
          </div>
        </div>
      </div>

      <!-- RIGHT -->
      <div>
        <!-- Contact Card -->
        <div class="card" style="margin-bottom:18px;border-top:3px solid ${headerColor};">
          <div class="card-header"><span class="card-title">📞 Contact Information</span></div>
          <div class="card-body">
            <div class="info-row"><div class="info-label">Name</div><div class="info-value" style="font-weight:600;">${item.contactName}</div></div>
            <div class="info-row"><div class="info-label">Phone</div><div class="info-value"><a href="tel:${item.contactPhone}" style="color:var(--accent);text-decoration:none;">${item.contactPhone}</a></div></div>
            <div class="info-row" style="border-bottom:none;"><div class="info-label">Email</div><div class="info-value"><a href="mailto:${item.contactEmail}" style="color:var(--accent);text-decoration:none;">${item.contactEmail}</a></div></div>
            ${!isOwner ? `<a href="mailto:${item.contactEmail}?subject=Regarding your FindIt post: ${item.title}" class="btn btn-primary" style="display:block;text-align:center;text-decoration:none;margin-top:16px;width:100%;">✉️ Contact About This Item</a>` : ''}
            ${item.reward ? `<div class="reward-box" style="margin-top:12px;">🎁 ${item.reward}</div>` : ''}
          </div>
        </div>

        <!-- Status Update (Owner Only) -->
        ${isOwner ? `
        <div class="card" style="margin-bottom:18px;">
          <div class="card-header"><span class="card-title">🔄 Update Status</span></div>
          <div class="card-body">
            <div class="status-grid" style="margin-bottom:14px;">
              <button class="status-btn ${item.status==='lost'?'active-lost':''}"     onclick="detailChangeStatus('${item.id}','lost')">🔴 Lost</button>
              <button class="status-btn ${item.status==='found'?'active-found':''}"   onclick="detailChangeStatus('${item.id}','found')">🟢 Found</button>
              <button class="status-btn ${item.status==='pending'?'active-pending':''}" onclick="detailChangeStatus('${item.id}','pending')">⏳ Pending</button>
              <button class="status-btn ${item.status==='returned'?'active-returned':''}" onclick="detailChangeStatus('${item.id}','returned')">✅ Returned</button>
            </div>
            <div class="form-group" style="margin-bottom:10px;">
              <label>Add Update Note</label>
              <textarea class="form-control" id="updateNote" style="min-height:70px;" placeholder="e.g. Owner has been contacted and will pick up tomorrow…"></textarea>
            </div>
            <button class="btn btn-primary" style="width:100%;" onclick="detailAddUpdate('${item.id}')">Post Update</button>
          </div>
        </div>` : ''}

        <!-- Timeline -->
        <div class="card">
          <div class="card-header"><span class="card-title">📅 Activity Timeline</span></div>
          <div class="card-body">
            ${timeline || '<div style="color:var(--muted);font-size:14px;">No updates yet.</div>'}
          </div>
        </div>
      </div>
    </div>
  `));
}

async function detailChangeStatus(id, status) {
  try {
    await api.updateStatus(id, status);
    showToast(`Status updated to ${status}`);
    await renderItemDetail(id);
  } catch (err) { showToast(err.message, 'error'); }
}

async function detailAddUpdate(id) {
  const note = document.getElementById('updateNote')?.value?.trim();
  if (!note) { showToast('Please enter an update message', 'error'); return; }
  try {
    await api.addUpdate(id, note);
    showToast('✅ Update posted!');
    await renderItemDetail(id);
  } catch (err) { showToast(err.message, 'error'); }
}

// ============ EDIT ITEM ============
async function renderEditItem(id) {
  render(withLayout('my-items', `<div class="loading-spinner"><div class="spinner"></div></div>`));
  let item;
  try {
    item = await api.getItem(id);
    if (item.userId !== currentUser.id) throw new Error('Not authorized');
  } catch (err) {
    render(withLayout('my-items', `<div class="empty-state"><span class="empty-icon">🚫</span><h3>${err.message}</h3><button class="section-link" onclick="navigate('my-items')">← Go back</button></div>`));
    return;
  }

  let _editImageData = item.imageData || null;

  render(withLayout('my-items', `
    <div class="page-header">
      <div class="page-header-left">
        <button class="back-link" onclick="navigate('my-items')">← Back to My Items</button>
        <h1>✏️ Edit Item Report</h1>
      </div>
    </div>
    <div class="report-layout">
      <!-- LEFT -->
      <div>
        <div class="card form-section" style="padding:28px;margin-bottom:18px;">
          <div class="form-section-title">📝 Basic Information</div>
          <div class="form-group"><label>Item Title *</label><input class="form-control" type="text" id="eTitle" value="${item.title}"></div>
          <div class="form-grid-2">
            <div class="form-group">
              <label>Category *</label>
              <select class="form-control" id="eCategory">
                <option>Electronics</option><option>Clothing</option><option>Documents</option>
                <option>Jewellery</option><option>Bags</option><option>Keys</option>
                <option>Wallet</option><option>Books</option><option>Toys</option><option>Other</option>
              </select>
            </div>
            <div class="form-group"><label>Date</label><input class="form-control" type="date" id="eDate" value="${item.date}"></div>
          </div>
          <div class="form-group"><label>Description *</label><textarea class="form-control" id="eDesc">${item.description || ''}</textarea></div>
        </div>

        <div class="card form-section" style="padding:28px;margin-bottom:18px;">
          <div class="form-section-title">🎨 Appearance</div>
          <div class="form-grid-3">
            <div class="form-group">
              <label>Colour</label>
              <select class="form-control" id="eColour">
                <option>Black</option><option>White</option><option>Grey</option><option>Red</option>
                <option>Blue</option><option>Green</option><option>Yellow</option><option>Orange</option>
                <option>Pink</option><option>Purple</option><option>Brown</option><option>Gold</option>
                <option>Silver</option><option>Multi-colour</option><option>Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Size</label>
              <select class="form-control" id="eSize">
                <option value="">Select</option>
                <option>Very Small</option><option>Small</option><option>Medium</option><option>Large</option>
              </select>
            </div>
            <div class="form-group"><label>Brand</label><input class="form-control" type="text" id="eBrand" value="${item.brand || ''}"></div>
          </div>
          <div class="form-group"><label>Unique Features</label><input class="form-control" type="text" id="eFeatures" value="${item.features || ''}"></div>
        </div>

        <div class="card form-section" style="padding:28px;margin-bottom:18px;">
          <div class="form-section-title">📍 Location</div>
          <div class="form-grid-2">
            <div class="form-group"><label>Location *</label><input class="form-control" type="text" id="eLocation" value="${item.location || ''}"></div>
            <div class="form-group"><label>Landmark</label><input class="form-control" type="text" id="eLandmark" value="${item.landmark || ''}"></div>
          </div>
          <div class="form-group"><label>Location Details</label><textarea class="form-control" id="eLocationDesc" style="min-height:60px;">${item.locationDesc || ''}</textarea></div>
        </div>

        <div class="card form-section" style="padding:28px;margin-bottom:18px;">
          <div class="form-section-title">📞 Contact</div>
          <div class="form-grid-2">
            <div class="form-group"><label>Phone</label><input class="form-control" type="tel" id="ePhone" value="${item.contactPhone || ''}"></div>
            ${item.type === 'lost' ? `<div class="form-group"><label>Reward</label><input class="form-control" type="text" id="eReward" value="${item.reward || ''}"></div>` : ''}
          </div>
        </div>

        <div class="form-error" id="editError"></div>
        <div style="display:flex;gap:12px;">
          <button class="btn btn-primary" style="flex:1;padding:14px;" onclick="saveItemEdit('${id}')" id="editSaveBtn">Save Changes</button>
          <button class="btn btn-ghost" style="padding:14px 24px;" onclick="navigate('my-items')">Cancel</button>
        </div>
      </div>

      <!-- RIGHT -->
      <div>
        <div class="card" style="padding:22px;margin-bottom:18px;">
          <div class="form-section-title">📷 Photo</div>
          <div class="drop-zone ${_editImageData ? 'has-image' : ''}" id="editDropZone" onclick="document.getElementById('editImgInput').click()">
            <div id="editPreview">
              ${_editImageData
                ? `<img src="${_editImageData}" style="width:100%;height:150px;object-fit:cover;border-radius:12px;display:block;">`
                : `<span class="drop-icon">📸</span><div class="drop-text">Click to upload</div>`}
            </div>
          </div>
          <input type="file" id="editImgInput" accept="image/*" style="display:none;" onchange="handleEditImg(this,'${id}')">
          <button class="btn btn-danger btn-sm" style="width:100%;margin-top:10px;" onclick="removeEditImg()">Remove Image</button>
        </div>

        <div class="card" style="padding:22px;">
          <div class="form-section-title">🔄 Quick Status</div>
          <div class="status-grid">
            <button class="status-btn ${item.status==='lost'?'active-lost':''}"     onclick="editQuickStatus('${id}','lost')">🔴 Lost</button>
            <button class="status-btn ${item.status==='found'?'active-found':''}"   onclick="editQuickStatus('${id}','found')">🟢 Found</button>
            <button class="status-btn ${item.status==='pending'?'active-pending':''}" onclick="editQuickStatus('${id}','pending')">⏳ Pending</button>
            <button class="status-btn ${item.status==='returned'?'active-returned':''}" onclick="editQuickStatus('${id}','returned')">✅ Returned</button>
          </div>
          <div style="margin-top:12px;padding:10px 14px;background:var(--surface);border-radius:8px;font-size:13px;color:var(--muted);">
            Current: ${statusBadge(item.status)}
          </div>
        </div>
      </div>
    </div>
  `));

  // Set select values
  const setSelect = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  setSelect('eCategory', item.category);
  setSelect('eColour', item.colour);
  setSelect('eSize', item.size);

  // Store edit image in a window var scoped to this item
  window._editImageData = item.imageData || null;
}

function handleEditImg(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    window._editImageData = e.target.result;
    document.getElementById('editPreview').innerHTML = `<img src="${window._editImageData}" style="width:100%;height:150px;object-fit:cover;border-radius:12px;display:block;">`;
    document.getElementById('editDropZone').classList.add('has-image');
  };
  reader.readAsDataURL(file);
}

function removeEditImg() {
  window._editImageData = null;
  document.getElementById('editImgInput').value = '';
  const dz = document.getElementById('editDropZone');
  dz.classList.remove('has-image');
  document.getElementById('editPreview').innerHTML = `<span class="drop-icon">📸</span><div class="drop-text">Click to upload</div>`;
}

async function editQuickStatus(id, status) {
  try {
    await api.updateStatus(id, status);
    showToast('Status updated to ' + status);
    // Refresh status buttons
    document.querySelectorAll('.status-btn').forEach(b => {
      b.className = 'status-btn';
      if (b.textContent.toLowerCase().includes(status)) b.className = `status-btn active-${status}`;
    });
  } catch (err) { showToast(err.message, 'error'); }
}

async function saveItemEdit(id) {
  const errEl = document.getElementById('editError');
  errEl.className = 'form-error';

  const title    = document.getElementById('eTitle').value.trim();
  const desc     = document.getElementById('eDesc').value.trim();
  const location = document.getElementById('eLocation').value.trim();

  if (!title || !desc || !location) {
    errEl.textContent = 'Title, description and location are required.';
    errEl.className = 'form-error show'; return;
  }

  const btn = document.getElementById('editSaveBtn');
  btn.disabled = true; btn.textContent = 'Saving…';

  try {
    await api.updateItem(id, {
      title,
      category:     document.getElementById('eCategory').value,
      date:         document.getElementById('eDate').value,
      description:  desc,
      colour:       document.getElementById('eColour').value,
      size:         document.getElementById('eSize').value,
      brand:        document.getElementById('eBrand').value.trim(),
      features:     document.getElementById('eFeatures').value.trim(),
      location,
      landmark:     document.getElementById('eLandmark').value.trim(),
      locationDesc: document.getElementById('eLocationDesc').value.trim(),
      contactPhone: document.getElementById('ePhone').value.trim(),
      reward:       document.getElementById('eReward')?.value?.trim() || '',
      imageData:    window._editImageData,
    });
    showToast('✅ Changes saved!');
    navigate('my-items');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.className = 'form-error show';
    btn.disabled = false; btn.textContent = 'Save Changes';
  }
}

// ============ INIT ============
(function init() {
  currentUser = getCurrentUser();
  if (!currentUser) {
    navigate('login');
  } else {
    navigate('dashboard');
  }
})();
