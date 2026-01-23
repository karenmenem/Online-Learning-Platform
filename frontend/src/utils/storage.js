// Use sessionStorage for tab-specific sessions
// This allows multiple tabs with different roles logged in simultaneously

export const storage = {
  getItem: (key) => sessionStorage.getItem(key),
  setItem: (key, value) => sessionStorage.setItem(key, value),
  removeItem: (key) => sessionStorage.removeItem(key),
  clear: () => sessionStorage.clear(),
};

// Helper functions for auth
export const getAuthToken = () => storage.getItem('auth_token');
export const setAuthToken = (token) => storage.setItem('auth_token', token);
export const removeAuthToken = () => storage.removeItem('auth_token');

export const getUser = () => {
  const userData = storage.getItem('user');
  return userData ? JSON.parse(userData) : {};
};
export const setUser = (user) => storage.setItem('user', JSON.stringify(user));
export const removeUser = () => storage.removeItem('user');

export const logout = () => {
  removeAuthToken();
  removeUser();
};
