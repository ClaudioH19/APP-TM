// permite simplificar las llamadas a la API y una ip global para todo el frontend

export const API_URL = 'http://192.168.113.202:3000';

export const API_ENDPOINTS = {
  LOGIN: `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/auth/register`,
  POSTS: `${API_URL}/api/publications`,
  COMMENTS: `${API_URL}/api/comments`,
  MEDIA: `${API_URL}/media`,
  LOCATION: `${API_URL}/api/publications/location`,
  CREATEPOST: `${API_URL}/api/publications`,
  PETS: `${API_URL}/api/usuarios/pets`,
  AVATAR: `${API_URL}/api/auth/avatar`, // endpoint para avatar
  USER_AVATAR: (userId) => `${API_URL}/api/usuarios/avatar/${userId}`, // endpoint para obtener avatar por userId
  ME: `${API_URL}/api/auth/me`, // endpoint para verificar token y obtener usuario
  INTEREST_POINTS: `${API_URL}/api/interest_points`, //endpoint para obtener los puntos de interés
  // Endpoints de perfil
  PROFILE_PETS: `${API_URL}/api/perfil/mascotas`, // CRUD de mascotas del usuario
  PROFILE_POSTS: `${API_URL}/api/perfil/publicaciones`, // Publicaciones del usuario
};
