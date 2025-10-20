/**
 * Obtiene el nombre de la ubicación (display_name) usando OpenStreetMap Nominatim.
 * @param {number} lat - Latitud en formato decimal
 * @param {number} lon - Longitud en formato decimal
 * @returns {Promise<string>} Nombre legible de la ubicación
 */
export async function getLocationName(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  try {
    const res = await fetch(url); // Use native fetch
    const data = await res.json();
    console.log('OpenStreetMap response:', data); // Debug log to inspect the full response
    // @ts-ignore
    if (data && typeof (data as any).display_name === 'string' && (data as any).display_name.length > 0) {
        const parts = (data as any).display_name.split(',').map((s: string) => s.trim());
        return parts.slice(0, 2).join(', ');
    }
    // @ts-ignore
    if (data && typeof data.error === 'string') return 'Ubicación desconocida';
    return `${lat}, ${lon}`;
  } catch (err) {
    console.error('Error obteniendo ubicación:', err);
    return 'Ubicación desconocida';
  }
}
