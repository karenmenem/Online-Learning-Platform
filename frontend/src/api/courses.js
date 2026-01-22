import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const getCourses = async () => {
  const response = await axios.get(`${API_URL}/courses`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getCourse = async (id) => {
  const response = await axios.get(`${API_URL}/courses/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const enrollCourse = async (courseId) => {
  const response = await axios.post(`${API_URL}/courses/${courseId}/enroll`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getEnrolledCourses = async () => {
  const response = await axios.get(`${API_URL}/my-courses`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getCourseProgress = async (courseId) => {
  const response = await axios.get(`${API_URL}/courses/${courseId}/progress`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
