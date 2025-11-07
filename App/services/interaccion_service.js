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
    return {
      success: true,
      counters: result.counters,
      message: result.message
    };
  } catch (err) {
    console.error('Error en sendInteraccion:', err);
    return {
      success: false,
      message: err.message || 'Error de conexión'
    };
  }
}

/**
 * Obtiene las interacciones del usuario para un post específico
 * @param {string|number} postId - ID de la publicación
 * @returns {Promise<object>} objeto con hasLiked, hasCommented, hasShared
 */
export async function getUserInteractions(postId) {
  try {
    // Obtener el token del almacenamiento local
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.log('No hay token, usuario no autenticado');
      return { hasLiked: false, hasCommented: false, hasShared: false };
    }
    
    console.log(`Obteniendo interacciones del usuario para post ${postId}`);
    const res = await fetch(`${API_URL}/api/publications/${postId}/user-interactions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        console.log('Token inválido o expirado');
        return { hasLiked: false, hasCommented: false, hasShared: false };
      }
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    
    const interactions = await res.json();
    console.log('Interacciones obtenidas:', interactions);
    return interactions;
  } catch (err) {
    console.error('Error obteniendo interacciones del usuario:', err);
    return { hasLiked: false, hasCommented: false, hasShared: false };
  }
}
