// permite simplificar las llamadas a la API y una ip global para todo el frontend

export const API_URL = 'http://172.16.76.68:3000';

export const API_ENDPOINTS = {
  LOGIN: `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/auth/register`,
};
