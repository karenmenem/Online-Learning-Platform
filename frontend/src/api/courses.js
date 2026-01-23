import axios from 'axios';
import { getAuthToken } from '../utils/storage';

const API_URL = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const getCourses = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.category) params.append('category', filters.category);
  if (filters.difficulty) params.append('difficulty', filters.difficulty);
  if (filters.instructor) params.append('instructor', filters.instructor);

  const queryString = params.toString();
  const url = `${API_URL}/courses${queryString ? `?${queryString}` : ''}`;
  
  const response = await axios.get(url, {
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

export const getStudentStats = async () => {
  const response = await axios.get(`${API_URL}/student/stats`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
