import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { postCache } from '../services/postCache';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useCachedPosts(filterByUserId = null) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async (forceRefresh = false) => {
    try {
      // Si estamos filtrando por usuario pero no tenemos el ID aún, esperar
      if (filterByUserId !== null && !filterByUserId) {
        return;
      }

      // Si no es refresh forzado, intentar usar caché
      if (!forceRefresh) {
        const cachedPosts = postCache.getPosts();
        if (cachedPosts) {
          const filtered = filterByUserId 
            ? cachedPosts.filter(post => post.usuario?.usuario_id === filterByUserId)
            : cachedPosts;
          setPosts(filtered);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      console.log('🌐 Fetching posts from API...');
      
      // Obtener token para que el backend sepa quién somos (y nos diga si dimos like)
      const token = await AsyncStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(API_ENDPOINTS.POSTS, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Error al obtener publicaciones`);
      }

      const data = await response.json();

      // Guardar en caché directamente (sin enriquecimiento lento de ubicación)
      // La ubicación se cargará bajo demanda si es necesario, o el backend debería enviarla
      postCache.setPosts(data);

      // Filtrar si es necesario
      const filtered = filterByUserId 
        ? data.filter(post => post.usuario?.usuario_id === filterByUserId)
        : data;

      setPosts(filtered);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(`Failed to fetch posts: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterByUserId]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    postCache.invalidate(); // Invalidar caché
    fetchPosts(true); // Forzar refresh
  }, [fetchPosts]);

  // Suscribirse a cambios en el caché
  useEffect(() => {
    const unsubscribe = postCache.subscribe((cachedPosts) => {
      if (cachedPosts) {
        const filtered = filterByUserId 
          ? cachedPosts.filter(post => post.usuario?.usuario_id === filterByUserId)
          : cachedPosts;
        setPosts(filtered);
      }
    });

    return unsubscribe;
  }, [filterByUserId]);

  // Cargar posts al montar
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { 
    posts, 
    loading, 
    error, 
    refreshing, 
    refresh 
  };
}
