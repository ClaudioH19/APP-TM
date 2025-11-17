import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { postCache } from '../services/postCache';

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
      const response = await fetch(API_ENDPOINTS.POSTS);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Error al obtener publicaciones`);
      }

      const data = await response.json();

      // Enriquecer con nombre de ubicación
      const enriched = await Promise.all(data.map(async post => {
        if (post.ubicacion_lat && post.ubicacion_lon) {
          try {
            const ubicacion = await fetch(`${API_ENDPOINTS.LOCATION}?lat=${post.ubicacion_lat}&lon=${post.ubicacion_lon}`)
              .then(res => res.json())
              .then(data => data.name)
              .catch(() => null);
            return { ...post, ubicacion };
          } catch (err) {
            return post;
          }
        }
        return post;
      }));

      // Guardar en caché
      postCache.setPosts(enriched);

      // Filtrar si es necesario
      const filtered = filterByUserId 
        ? enriched.filter(post => post.usuario?.usuario_id === filterByUserId)
        : enriched;

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
