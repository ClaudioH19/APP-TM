// Sistema de caché para publicaciones
class PostCacheService {
  constructor() {
    this.cache = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    this.listeners = new Set();
  }

  // Obtener publicaciones del caché
  getPosts() {
    if (this.cache && this.isValid()) {
      console.log('📦 Retornando posts desde caché');
      return this.cache;
    }
    return null;
  }

  // Guardar publicaciones en caché
  setPosts(posts) {
    console.log('💾 Guardando posts en caché:', posts.length, 'posts');
    this.cache = posts;
    this.lastFetch = Date.now();
    this.notifyListeners(posts);
  }

  // Verificar si el caché es válido
  isValid() {
    if (!this.lastFetch) return false;
    const elapsed = Date.now() - this.lastFetch;
    return elapsed < this.cacheTimeout;
  }

  // Invalidar caché (forzar recarga)
  invalidate() {
    console.log('🗑️ Invalidando caché de posts');
    this.cache = null;
    this.lastFetch = null;
    this.notifyListeners(null);
  }

  // Suscribirse a cambios en el caché
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notificar a todos los listeners
  notifyListeners(posts) {
    this.listeners.forEach(callback => callback(posts));
  }

  // Actualizar un post específico en el caché
  updatePost(postId, updates) {
    if (!this.cache) return;
    
    this.cache = this.cache.map(post => 
      post.id === postId ? { ...post, ...updates } : post
    );
    this.notifyListeners(this.cache);
  }

  // Agregar un nuevo post al caché
  addPost(newPost) {
    if (!this.cache) return;
    
    this.cache = [newPost, ...this.cache];
    this.notifyListeners(this.cache);
  }

  // Eliminar un post del caché
  removePost(postId) {
    if (!this.cache) return;
    
    this.cache = this.cache.filter(post => post.id !== postId);
    this.notifyListeners(this.cache);
  }
}

// Exportar instancia singleton
export const postCache = new PostCacheService();
