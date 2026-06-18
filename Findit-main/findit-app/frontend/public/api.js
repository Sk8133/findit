// ============ API CLIENT ============
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('findit_token');
}

function setAuth(user, token) {
  localStorage.setItem('findit_token', token);
  localStorage.setItem('findit_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('findit_token');
  localStorage.removeItem('findit_user');
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('findit_user'));
  } catch {
    return null;
  }
}

async function apiRequest(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${getToken()}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(API_BASE + path, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

const api = {
  // Auth
  login: (email, password) => apiRequest('POST', '/auth/login', { email, password }, false),
  register: (data) => apiRequest('POST', '/auth/register', data, false),
  me: () => apiRequest('GET', '/auth/me'),

  // Items
  getItems: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest('GET', `/items${q ? '?' + q : ''}`);
  },
  getItem: (id) => apiRequest('GET', `/items/${id}`),
  getStats: () => apiRequest('GET', '/items/stats'),
  createItem: (data) => apiRequest('POST', '/items', data),
  updateItem: (id, data) => apiRequest('PUT', `/items/${id}`, data),
  updateStatus: (id, status, message) => apiRequest('PATCH', `/items/${id}/status`, { status, message }),
  addUpdate: (id, message) => apiRequest('POST', `/items/${id}/update`, { message }),
  deleteItem: (id) => apiRequest('DELETE', `/items/${id}`),

  // Users
  getProfile: () => apiRequest('GET', '/users/profile'),
  updateProfile: (data) => apiRequest('PUT', '/users/profile', data),
};
