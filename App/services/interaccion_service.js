import { API_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Envía una interacción al backend
 * @param {string|number} postId - ID de la publicación
 * @param {number} tipo - 1: like, 2: comentario, 3: compartir
 * @returns {Promise<object>} respuesta del backend
 */
export async function sendInteraccion(postId, tipo) {
  try {
    // Obtener el token del almacenamiento local
    const token = await AsyncStorage.getItem('token');
    console.log('Token obtenido:', token ? 'Token encontrado' : 'Token no encontrado');
    if (!token) {
      throw new Error('No se encontró el token del usuario');
    }
    
    console.log('Enviando interacción:', { postId, tipo });
    const res = await fetch(`${API_URL}/api/publications/${postId}/interaccion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ interaccion_tipo: tipo }),
    });
    console.log('Respuesta del servidor:', res.status, res.statusText);
    if (!res.ok) {
      const errorText = await res.text();
      console.log('Error response:', errorText);
      throw new Error(`Error al enviar interacción: ${res.status} ${errorText}`);
    }
    const result = await res.json();
    console.log('Resultado exitoso:', result);
    return result;
  } catch (err) {
    console.error('Error en sendInteraccion:', err);
    throw err;
  }
}
