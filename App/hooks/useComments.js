import { useEffect, useState, useCallback } from 'react';
import fetchWithAuth from '../services/apiClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * useComments hook
 * @param {number|string} postId - id de la publicación
 */
export default function useComments(postId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${API_ENDPOINTS.COMMENTS}?publicacion_id=${postId}`;
      const res = await fetchWithAuth(url, { method: 'GET' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error('useComments.fetchComments error', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const createComment = useCallback(async (texto) => {
    if (!postId) throw new Error('postId is required');
    setCreating(true);
    setError(null);
    try {
      const url = `${API_ENDPOINTS.COMMENTS}`;
      const res = await fetchWithAuth(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicacion_id: postId, comentario: texto })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const result = await res.json();
      // Optimistic update: prepend created comment
      setComments(prev => [result.comment, ...prev]);
      return result;
    } catch (err) {
      console.error('useComments.createComment error', err);
      setError(err.message || String(err));
      throw err;
    } finally {
      setCreating(false);
    }
  }, [postId]);

  return { comments, loading, error, creating, fetchComments, createComment };
}
