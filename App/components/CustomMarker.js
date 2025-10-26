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
const CustomMarker = ({ point, onPress }) => {
  const pinColor = getCategoryColor(point.category);
  const iconSource = categoryIcons[point.category];

  return (
    <Marker
      coordinate={point.coordinate}
      onPress={onPress}
      image={iconSource}
      tracksViewChanges={false}
    >
      <Callout tooltip>
        <View style={styles.calloutContainer}>
          {/* Título */}
          <Text style={styles.calloutTitle}>{point.title}</Text>
          
          {/* Categoría */}
          <View style={[styles.categoryBadge, { backgroundColor: pinColor }]}>
            <Text style={styles.categoryText}>{point.category}</Text>
          </View>
          
          {/* Calificación */}
          <Text style={styles.calloutRating}>
            ⭐ {point.rating} ({point.reviewCount} reseñas)
          </Text>
          
          {/* Descripción */}
          {point.description && (
            <Text style={styles.calloutDescription} numberOfLines={3}>
              {point.description}
            </Text>
          )}
          
          {/* Creador */}
          <Text style={styles.calloutCreator}>
            Creado por: {point.createdBy} (@{point.username})
          </Text>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  calloutRating: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  calloutDescription: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 8,
    lineHeight: 18,
  },
  calloutCreator: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default CustomMarker;