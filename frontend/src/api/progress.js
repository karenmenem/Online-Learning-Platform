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

export const getOverallAnalytics = async () => {
  const response = await axios.get(`${API_URL}/progress/analytics`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getCourseAnalytics = async (courseId) => {
  const response = await axios.get(`${API_URL}/progress/courses/${courseId}/analytics`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
