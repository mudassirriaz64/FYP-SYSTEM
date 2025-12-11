// API utility with interceptors for auto-logout on 401
export const API_BASE = 'http://localhost:5073/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Handle unauthorized responses
const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }
  return response;
};

// API object with HTTP methods
const api = {
  get: async (url) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  post: async (url, data) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  put: async (url, data) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (url) => {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Legacy helper function for backwards compatibility
export const apiCall = async (url, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
  
  return handleResponse(response);
};

export default api;

