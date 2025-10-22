// permite simplificar las llamadas a la API y una ip global para todo el frontend

export const API_URL = 'http://192.168.1.36:3000';

export const API_ENDPOINTS = {
  LOGIN: `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/auth/register`,
  POSTS: `${API_URL}/api/publications`,
  MEDIA: `${API_URL}/media`,
  LOCATION: `${API_URL}/api/publications/location`,
  CREATEPOST: `${API_URL}/api/publications/create`,
  PETS: `${API_URL}/api/usuarios/pets`,
  ME: `${API_URL}/auth/me`
};
