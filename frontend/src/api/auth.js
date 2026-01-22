import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, {
    email,
    password
  });
  return response.data;
};

export const register = async (name, email, password, passwordConfirmation, role = 'student') => {
  const response = await axios.post(`${API_URL}/register`, {
    name,
    email,
    password,
    password_confirmation: passwordConfirmation,
    role
  });
  return response.data;
};

export const logout = async (token) => {
  const response = await axios.post(`${API_URL}/logout`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getCurrentUser = async (token) => {
  const response = await axios.get(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};
