// Sistema de caché para avatares con timestamp para cache busting
class AvatarCacheService {
  constructor() {
    this.timestamps = {}; // userId -> timestamp
  }

  // Obtener URL del avatar con cache busting
  getAvatarUrl(userId, baseUrl) {
    if (!userId) return null;
    
    const timestamp = this.timestamps[userId] || Date.now();
    return `${baseUrl}?t=${timestamp}`;
  }

  // Invalidar caché de un usuario específico
  invalidate(userId) {
    console.log('🔄 Invalidando caché de avatar para usuario:', userId);
    this.timestamps[userId] = Date.now();
  }

  // Invalidar todos los avatares
  invalidateAll() {
    console.log('🔄 Invalidando caché de todos los avatares');
    this.timestamps = {};
  }
}

// Exportar instancia singleton
export const avatarCache = new AvatarCacheService();
