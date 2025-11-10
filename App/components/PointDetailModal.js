import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { X, MapPin, Calendar, MessageSquare, Star, Tag, ChevronRight } from 'lucide-react-native';
import ReviewsModal from './ReviewsModal';

/**
 * Formatea la fecha de creación
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Obtiene el color según la categoría
 */
const getCategoryColor = (category) => {
  const colors = {
    'Veterinario': '#ef4444',
    'Ocio': '#3b82f6',
    'Tienda': '#10b981',
    'Parque': '#22c55e',
    'Restaurante': '#f59e0b',
    'Hospital': '#dc2626',
    'Guardería': '#8b5cf6',
    'Deporte': '#f97316',
    'Otro': '#6b7280',
  };
  return colors[category] || '#6b7280';
};

const PointDetailModal = ({ visible, point, onClose }) => {
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  
  if (!point) return null;

  const categoryColor = getCategoryColor(point.category);
  const hasRating = point.reviewCount > 0;
  const rating = hasRating ? parseFloat(point.rating) : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header con botón cerrar */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Detalles del punto</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Nombre del punto */}
            <View style={styles.section}>
              <View style={styles.iconRow}>
                <MapPin size={24} color={categoryColor} />
                <Text style={styles.pointName}>{point.title}</Text>
              </View>
            </View>

            {/* Categoría */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Tag size={18} color="#6b7280" />
                <Text style={styles.label}>Categoría</Text>
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                <Text style={styles.categoryText}>{point.category}</Text>
              </View>
            </View>

            {/* Calificación */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Star size={18} color="#f59e0b" />
                <Text style={styles.label}>Calificación</Text>
              </View>
              {hasRating ? (
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
                  <Star size={24} color="#f59e0b" fill="#f59e0b" />
                  <Text style={styles.ratingCount}>({point.reviewCount} reseñas)</Text>
                </View>
              ) : (
                <Text style={styles.noRatingText}>Sin calificaciones aún</Text>
              )}
              
              {/* Botón para ver todas las reseñas */}
              {hasRating && (
                <TouchableOpacity
                  style={styles.viewReviewsButton}
                  onPress={() => setShowReviewsModal(true)}
                >
                  <Text style={styles.viewReviewsButtonText}>
                    Ver todas las reseñas
                  </Text>
                  <ChevronRight size={20} color="#3b82f6" />
                </TouchableOpacity>
              )}
            </View>

            {/* Fecha de creación */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Calendar size={18} color="#6b7280" />
                <Text style={styles.label}>Fecha de creación</Text>
              </View>
              <Text style={styles.value}>{formatDate(point.createdAt)}</Text>
            </View>

            {/* Descripción */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <MessageSquare size={18} color="#6b7280" />
                <Text style={styles.label}>Descripción</Text>
              </View>
              {point.description && point.description !== 'Sin descripción' ? (
                <Text style={styles.description}>{point.description}</Text>
              ) : (
                <Text style={styles.noDescription}>Sin descripción</Text>
              )}
            </View>

            {/* Creado por */}
            <View style={styles.section}>
              <Text style={styles.creatorLabel}>Creado por</Text>
              <Text style={styles.creatorName}>
                {point.createdBy} <Text style={styles.username}>(@{point.username})</Text>
              </Text>
            </View>

            {/* Coordenadas */}
            <View style={styles.coordinatesSection}>
              <Text style={styles.coordinatesText}>
                📍 Lat: {point.coordinate.latitude.toFixed(6)}, Lon: {point.coordinate.longitude.toFixed(6)}
              </Text>
            </View>
          </ScrollView>

          {/* Botón de cerrar al final */}
          <TouchableOpacity style={styles.closeBottomButton} onPress={onClose}>
            <Text style={styles.closeBottomButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Modal de reseñas */}
      <ReviewsModal
        visible={showReviewsModal}
        pointId={point.id}
        pointName={point.title}
        onClose={() => setShowReviewsModal(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  section: {
    marginBottom: 20,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  ratingCount: {
    fontSize: 16,
    color: '#6b7280',
  },
  noRatingText: {
    fontSize: 16,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  viewReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  viewReviewsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  noDescription: {
    fontSize: 16,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  creatorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  creatorName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  username: {
    color: '#6b7280',
    fontWeight: '400',
  },
  coordinatesSection: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  closeBottomButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeBottomButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PointDetailModal;