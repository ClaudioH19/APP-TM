/**
 * Obtiene el nombre de la ubicación (display_name) usando OpenStreetMap Nominatim.
 * @param {number} lat - Latitud en formato decimal
 * @param {number} lon - Longitud en formato decimal
 * @returns {Promise<string>} Nombre legible de la ubicación
 */
export async function getLocationName(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'APP-TM/1.0', // IMPORTANTE: Nominatim requiere User-Agent
        'Accept': 'application/json',
      }
    });

    // Verificar que la respuesta sea exitosa
    if (!res.ok) {
      console.warn(`Nominatim respondió con status ${res.status}`);
      return 'Ubicación desconocida';
    }

    // Verificar que sea JSON antes de parsear
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`Nominatim respondió con Content-Type: ${contentType} (se esperaba JSON)`);
      return 'Ubicación desconocida';
    }

    const data = await res.json();
    console.log('OpenStreetMap response:', data);

    // Verificar si hay un display_name válido
    if (data && typeof data.display_name === 'string' && data.display_name.length > 0) {
      const parts = data.display_name.split(',').map((s: string) => s.trim());
      return parts.slice(0, 2).join(', ');
    }

    // Si hay un error en la respuesta
    if (data && typeof data.error === 'string') {
      console.warn('Error de Nominatim:', data.error);
      return 'Ubicación desconocida';
    }

    // Fallback a coordenadas
    return `${lat}, ${lon}`;
  } catch (err) {
    console.error('Error obteniendo ubicación:', err);
    return 'Ubicación desconocida';
  }
}
