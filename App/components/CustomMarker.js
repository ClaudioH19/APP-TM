import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Marker, Callout } from 'react-native-maps';

// Mapeo de categorías a iconos
const categoryIcons = {
  'Veterinario': require('../assets/veterinario.png'),
  'Tienda': require('../assets/tienda.png'),
  'Ocio': require('../assets/ocio.png'),
  'Deporte': require('../assets/deporte.png'),
  'Otro': require('../assets/otro.png'),
};

/**
 * Obtiene el icono según la categoría
 */
const getCategoryIcon = (category) => {
  return categoryIcons[category] || categoryIcons['Otro'];
};

const getCategoryColor = (category) => {
  const colors = {
    'Veterinario': '#ef4444',      // rojo
    'Ocio': '#3b82f6',              // azul
    'Tienda': '#10b981',            // verde
    'Deporte': '#22c55e',            // verde claro
    'Otro': '#6b7280',              // gris por defecto
  };
  
  return colors[category] || '#6b7280'; // gris por defecto
};

/**
 * Componente de marcador personalizado
 */
const CustomMarker = ({ point, onCalloutPress }) => {
  const iconSource = getCategoryIcon(point.category);
  const hasRating = point.reviewCount > 0;
  const rating = hasRating ? parseFloat(point.rating).toFixed(1) : 'N/A';
  
  // Preparar title y description para el callout nativo
  const markerTitle = point.title;
  const markerDescription = `⭐ ${rating} ${hasRating ? `(${point.reviewCount} reseñas)` : ''}`;

  return (
    <Marker
      coordinate={point.coordinate}
      onCalloutPress={() => onCalloutPress && onCalloutPress(point)}
      image={iconSource}
      title={markerTitle}
      description={markerDescription}
    />
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIcon: {
    width: 40,
    height: 40,
  },
  callout: {
    width: 200,
  },
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    minWidth: 180,
    maxWidth: 200,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  starIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  tapHint: {
    fontSize: 11,
    color: '#3b82f6',
    fontStyle: 'italic',
    marginTop: 4,
  },
});

export default CustomMarker;