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

export const checkCertificateEligibility = async (courseId) => {
  const response = await axios.get(`${API_URL}/courses/${courseId}/certificate/check`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getMyCertificates = async () => {
  const response = await axios.get(`${API_URL}/certificates`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const downloadCertificate = async (certificateId) => {
  const token = getAuthToken();
  const response = await axios.get(`${API_URL}/certificates/${certificateId}/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'blob',
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `certificate-${certificateId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
};

export const verifyCertificate = async (code) => {
  const response = await axios.get(`${API_URL}/certificates/verify/${code}`);
  return response.data;
};
