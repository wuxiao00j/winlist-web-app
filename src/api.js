const jsonHeaders = { 'Content-Type': 'application/json' };

function safeJsonParse(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: options.body ? jsonHeaders : undefined,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  const data = safeJsonParse(text);
  if (!response.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = response.status;
    error.details = data.details;
    error.raw = text;
    throw error;
  }
  return data;
}

export const api = {
  me: () => apiRequest('/api/me'),
  register: (payload) => apiRequest('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/api/auth/login', { method: 'POST', body: payload }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  appState: (category) => apiRequest(`/api/app-state?category=${encodeURIComponent(category)}`),
  updateStatus: (statusId) => apiRequest('/api/me/status', { method: 'PATCH', body: { statusId } }),
  createTask: (payload) => apiRequest('/api/tasks', { method: 'POST', body: payload }),
  updateTask: (id, payload) => apiRequest(`/api/tasks/${id}`, { method: 'PATCH', body: payload }),
  deleteTask: (id) => apiRequest(`/api/tasks/${id}`, { method: 'DELETE' }),
  toggleTask: (id) => apiRequest(`/api/tasks/${id}/toggle`, { method: 'POST' }),
  reorderTasks: (payload) => apiRequest('/api/tasks/reorder', { method: 'POST', body: payload }),
  copyTaskToMe: (id) => apiRequest(`/api/tasks/${id}/copy-to-me`, { method: 'POST' }),
  takeTaskToMe: (id) => apiRequest(`/api/tasks/${id}/take-to-me`, { method: 'POST' }),
  createComment: (id, payload) => apiRequest(`/api/tasks/${id}/comments`, { method: 'POST', body: payload }),
  comments: (id) => apiRequest(`/api/tasks/${id}/comments`),
  deleteComment: (id) => apiRequest(`/api/comments/${id}`, { method: 'DELETE' }),
  createPoke: (id) => apiRequest(`/api/tasks/${id}/pokes`, { method: 'POST' }),
  pokes: (id) => apiRequest(`/api/tasks/${id}/pokes`),
  friends: () => apiRequest('/api/friends'),
  requestFriend: (email) => apiRequest('/api/friends/request', { method: 'POST', body: { email } }),
  acceptFriend: (id) => apiRequest(`/api/friends/${id}/accept`, { method: 'POST' }),
  rejectFriend: (id) => apiRequest(`/api/friends/${id}/reject`, { method: 'POST' }),
  removeFriend: (id) => apiRequest(`/api/friends/${id}`, { method: 'DELETE' }),
  upload: (payload) => apiRequest('/api/uploads', { method: 'POST', body: payload })
};
