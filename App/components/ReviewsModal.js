import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Star, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { getReviews } from '../services/interestPointsService';

/**
 * Formatea la fecha de la reseña
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Componente para mostrar una reseña individual
 */
const ReviewItem = ({ review }) => {
  return (
    <View style={styles.reviewItem}>
      {/* Header con usuario y fecha */}
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{review.usuario.nombre}</Text>
          <Text style={styles.username}>@{review.usuario.usuario}</Text>
        </View>
        <Text style={styles.reviewDate}>{formatDate(review.fecha_creacion)}</Text>
      </View>

      {/* Calificación */}
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            color="#f59e0b"
            fill={star <= review.valoracion ? '#f59e0b' : 'transparent'}
          />
        ))}
        <Text style={styles.ratingNumber}>{review.valoracion}/5</Text>
      </View>

      {/* Descripción */}
      {review.descripcion && (
        <Text style={styles.reviewDescription}>{review.descripcion}</Text>
      )}
    </View>
  );
};

/**
 * Modal para mostrar las reseñas de un punto de interés
 */
const ReviewsModal = ({ visible, pointId, pointName, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (visible && pointId) {
      loadReviews(0);
    }
  }, [visible, pointId]);

  const loadReviews = async (page) => {
    setLoading(true);
    try {
      const data = await getReviews(pointId, page, limit);
      setReviews(data.items);
      setTotal(data.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error cargando reseñas:', error);
      Alert.alert('Error', 'No se pudieron cargar las reseñas');
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    if (nextPage * limit < total) {
      loadReviews(nextPage);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      loadReviews(currentPage - 1);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = (currentPage + 1) * limit < total;
  const hasPreviousPage = currentPage > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Reseñas</Text>
              <Text style={styles.pointName} numberOfLines={1}>
                {pointName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Total de reseñas */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>
              {total} {total === 1 ? 'reseña' : 'reseñas'} en total
            </Text>
          </View>

          {/* Lista de reseñas */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Cargando reseñas...</Text>
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Star size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>
                Aún no hay reseñas para este lugar
              </Text>
              <Text style={styles.emptySubtext}>
                ¡Sé el primero en dejar una reseña!
              </Text>
            </View>
          ) : (
            <FlatList
              data={reviews}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <ReviewItem review={item} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
            />
          )}

          {/* Paginación */}
          {!loading && reviews.length > 0 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  !hasPreviousPage && styles.paginationButtonDisabled,
                ]}
                onPress={handlePreviousPage}
                disabled={!hasPreviousPage}
              >
                <ChevronLeft
                  size={20}
                  color={hasPreviousPage ? '#3b82f6' : '#d1d5db'}
                />
                <Text
                  style={[
                    styles.paginationButtonText,
                    !hasPreviousPage && styles.paginationButtonTextDisabled,
                  ]}
                >
                  Anterior
                </Text>
              </TouchableOpacity>

              <Text style={styles.pageIndicator}>
                Página {currentPage + 1} de {totalPages}
              </Text>

              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  !hasNextPage && styles.paginationButtonDisabled,
                ]}
                onPress={handleNextPage}
                disabled={!hasNextPage}
              >
                <Text
                  style={[
                    styles.paginationButtonText,
                    !hasNextPage && styles.paginationButtonTextDisabled,
                  ]}
                >
                  Siguiente
                </Text>
                <ChevronRight
                  size={20}
                  color={hasNextPage ? '#3b82f6' : '#d1d5db'}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
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
    height: '90%',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  pointName: {
    fontSize: 14,
    color: '#6b7280',
  },
  closeButton: {
    padding: 4,
  },
  totalContainer: {
    marginBottom: 16,
  },
  totalText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  reviewItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  username: {
    fontSize: 13,
    color: '#6b7280',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  reviewDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 16,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.4,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  paginationButtonTextDisabled: {
    color: '#d1d5db',
  },
  pageIndicator: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
});

export default ReviewsModal;
