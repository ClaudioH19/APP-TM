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
  const pinColor = getCategoryColor(point.category);
  const iconSource = categoryIcons[point.category];

  return (
    <Marker
      coordinate={point.coordinate}
      onPress={onPress}
      image={iconSource}
      tracksViewChanges={false}
    >
      {/* Callout personalizado */}
      <Callout
        onPress={() => onCalloutPress && onCalloutPress(point)}
        style={styles.callout}
      >
        <View style={styles.calloutContainer}>
          {/* Nombre del punto */}
          <Text style={styles.calloutTitle} numberOfLines={2}>
            {point.title}
          </Text>
          
          {/* Calificación */}
          <View style={styles.ratingRow}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.ratingText}>
              {rating} {hasRating && `(${point.reviewCount})`}
            </Text>
          </View>
          
          {/* Indicador de "tocar para más" */}
          <Text style={styles.tapHint}>Toca para ver detalles</Text>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  callout: {
    width: 200,
  },
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    width: 200,
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