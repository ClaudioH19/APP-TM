import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function usePosts(apiUrl) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchPosts = async () => {
    if (!apiUrl) {
      console.log('No apiUrl provided to usePosts');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    console.log('Fetching posts from:', apiUrl);
    
    try {
      const res = await fetch(apiUrl);
      console.log('Response status:', res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Error al obtener publicaciones`);
      
      const data = await res.json();
      console.log('Posts data received:', data);
      
      // Enriquecer cada post con el nombre de la ubicación
      const enriched = await Promise.all(data.map(async post => {
        if (post.ubicacion_lat && post.ubicacion_lon) {
          try {
            const ubicacion = await fetch(`${API_ENDPOINTS.LOCATION}?lat=${post.ubicacion_lat}&lon=${post.ubicacion_lon}`)
              .then(res => res.json())
              .then(data => data.name)
              .catch(() => null);
            return { ...post, ubicacion };
          } catch (err) {
            console.log('Error fetching location for post:', err);
            return post;
          }
        }
        return post;
      }));
      
      setPosts(enriched);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(`Failed to fetch posts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [apiUrl]);

  const createPost = async (postData) => {
    setCreating(true);
    setError(null);
    
    try {
      console.log('Creating post with data:', postData);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token del usuario');
      }

      // Generar un ID único para el archivo
      const fileId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Crear FormData para la subida de archivo
      const formData = new FormData();
      
      // Determinar la extensión del archivo
      const fileExtension = (postData.media.uri.split('.').pop() || (postData.media.type === 'video' ? 'mp4' : 'jpg')).toLowerCase();
      const fileName = `${fileId}.${fileExtension}`;

      // Mapear extensión a MIME type más preciso
      const imageMap = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        heic: 'image/heic',
        gif: 'image/gif',
      };
      const videoMap = {
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        m4v: 'video/x-m4v',
        webm: 'video/webm',
        avi: 'video/x-msvideo',
        '3gp': 'video/3gpp',
      };

      let inferredMime = '';
      if (postData.media.type === 'video') {
        inferredMime = videoMap[fileExtension] || 'video/mp4';
      } else {
        inferredMime = imageMap[fileExtension] || 'image/jpeg';
      }

      console.log('File info:', { fileId, fileName, fileExtension, inferredMime });

      // Añadir el archivo al FormData usando el mime correcto
      formData.append('file', {
        uri: postData.media.uri,
        type: inferredMime,
        name: fileName,
      });
      
      // Añadir otros datos del post
      formData.append('ubicacion_lon', postData.location.longitude.toString());
      formData.append('ubicacion_lat', postData.location.latitude.toString());
      formData.append('descripcion', postData.description);
      formData.append('mascota_id', postData.petId.toString());
      formData.append('id_video', fileId);
      formData.append('mime_type', inferredMime);
      
      console.log('Making request to:', API_ENDPOINTS.CREATEPOST);
      
      // Realizar la petición al backend
      const response = await fetch(API_ENDPOINTS.CREATEPOST, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // No establecer Content-Type para FormData, React Native lo hace automáticamente
        },
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Error al crear la publicación'}`);
      }

      const result = await response.json();
      console.log('Post created successfully:', result);
      
      // Actualizar la lista de posts localmente
      setPosts(prevPosts => [result, ...prevPosts]);
      
      return result;
      
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  return { posts, loading, error, creating, createPost, refreshPosts: fetchPosts };
}
