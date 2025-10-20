import { useEffect, useState } from 'react';
import {API_ENDPOINTS} from '../config/api';

export function usePosts(apiUrl) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(apiUrl)
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener publicaciones');
        return res.json();
      })
      .then(async data => {
        // Enriquecer cada post con el nombre de la ubicación
        const enriched = await Promise.all(data.map(async post => {
          if (post.ubicacion_lat && post.ubicacion_lon) {
            const ubicacion = await fetch(`${API_ENDPOINTS.LOCATION}?lat=${post.ubicacion_lat}&lon=${post.ubicacion_lon}`)
              .then(res => res.json())
              .then(data => data.name)
              .catch(() => null);
            return { ...post, ubicacion };
          }
          return post;
        }));
        if (isMounted) setPosts(enriched);
      })
      .catch(err => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [apiUrl]);

  return { posts, loading, error };
}
