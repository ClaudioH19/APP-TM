// permite simplificar las llamadas a la API y una ip global para todo el frontend

export const API_URL = 'http://192.168.18.94:3000';

export const API_ENDPOINTS = {
  LOGIN: `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/auth/register`,
  POSTS: `${API_URL}/api/publications`,
  COMMENTS: `${API_URL}/api/comments`,
  MEDIA: `${API_URL}/media`,
  LOCATION: `${API_URL}/api/publications/location`,
  CREATEPOST: `${API_URL}/api/publications`,
  PETS: `${API_URL}/api/usuarios/pets`,
  ME: `${API_URL}/api/auth/me`, // endpoint para verificar token y obtener usuario
  INTEREST_POINTS: `${API_URL}/api/interest_points` //endpoint para obtener los puntos de interés
};
