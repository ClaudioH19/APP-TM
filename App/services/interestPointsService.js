import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Obtiene todos los puntos de interés desde la API
 */
export const getInterestPoints = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(API_ENDPOINTS.INTEREST_POINTS, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo puntos de interés:', error);
    throw error;
  }
};

/**
 * Crea un nuevo punto de interés
 * @param {Object} pointData - Datos del punto de interés
 * @param {string} pointData.nombre - Nombre del punto (obligatorio)
 * @param {number} pointData.latitud - Latitud (obligatorio)
 * @param {number} pointData.longitud - Longitud (obligatorio)
 * @param {string} pointData.categoria - Categoría del punto (obligatorio)
 * @param {string} pointData.descripcion - Descripción del punto (opcional)
 * @returns {Promise<Object>} Punto de interés creado
 */
export const createInterestPoint = async (pointData) => {
  try {
    // Obtener el token de autenticación
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('No hay sesión activa. Por favor inicia sesión.');
    }

    // Validaciones básicas
    if (!pointData.nombre || !pointData.nombre.trim()) {
      throw new Error('El nombre es obligatorio');
    }
    
    if (!pointData.latitud || !pointData.longitud) {
      throw new Error('La ubicación es obligatoria');
    }
    
    if (!pointData.categoria) {
      throw new Error('La categoría es obligatoria');
    }

    // Preparar el body
    const body = {
      nombre: pointData.nombre.trim(),
      latitud: Number(pointData.latitud),
      longitud: Number(pointData.longitud),
      categoria: pointData.categoria,
      descripcion: pointData.descripcion ? pointData.descripcion.trim() : null,
    };

    console.log('📍 Creando punto de interés:', body);

    // Hacer la petición POST
    const response = await fetch(API_ENDPOINTS.INTEREST_POINTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    // Verificar respuesta
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP: ${response.status}`);
    }

    const newPoint = await response.json();
    console.log('✅ Punto de interés creado:', newPoint);
    
    return newPoint;
  } catch (error) {
    console.error('❌ Error creando punto de interés:', error);
    throw error;
  }
};

/**
 * Transforma los datos de la API al formato que necesita el mapa
 */
export const formatPointsForMap = (points) => {
  return points.map(point => ({
    id: point.id,
    coordinate: {
      latitude: point.latitud,
      longitude: point.longitud,
    },
    title: point.nombre,
    description: point.descripcion || 'Sin descripción',
    category: point.categoria,
    rating: point.cantidad_resenas > 0 
      ? (point.suma_valoraciones / point.cantidad_resenas).toFixed(1)
      : 'Sin calificación',
    reviewCount: point.cantidad_resenas,
    createdBy: point.usuario.nombre,
    username: point.usuario.usuario,
    createdAt: point.fecha_creacion,
  }));
};

/**
 * Obtiene las reseñas de un punto de interés (paginadas)
 * @param {number} pointId - ID del punto de interés
 * @param {number} index - Índice de paginación (default: 0)
 * @param {number} limit - Límite de resultados (default: 10)
 * @returns {Promise<Object>} Objeto con items, total, offset y limit
 */
export const getReviews = async (pointId, index = 0, limit = 10) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('No hay sesión activa. Por favor inicia sesión.');
    }

    const url = `${API_ENDPOINTS.REVIEWS}/${pointId}?index=${index}&limit=${limit}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo reseñas:', error);
    throw error;
  }
};