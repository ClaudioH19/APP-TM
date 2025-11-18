import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Star } from 'lucide-react-native';
import { addReview } from '../services/interestPointsService';

const AddReviewModal = ({ visible, pointId, pointName, onClose, onReviewAdded }) => {
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible]);

  const resetState = () => {
    setRating(0);
    setDescription('');
    setErrorMessage('');
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!rating) {
      setErrorMessage('Selecciona una calificación para tu reseña.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      await addReview(pointId, rating, description);

      onReviewAdded?.();
      resetState();
    } catch (error) {
      const message = error?.message || 'No pudimos crear tu reseña. Intenta nuevamente.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isActive = starValue <= rating;
          return (
            <TouchableOpacity
              key={starValue}
              style={styles.starButton}
              onPress={() => setRating(starValue)}
            >
              <Star
                size={32}
                color={isActive ? '#f59e0b' : '#d1d5db'}
                fill={isActive ? '#f59e0b' : 'transparent'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrapper}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Añadir reseña</Text>
                {pointName ? (
                  <Text style={styles.pointName}>{pointName}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Calificación</Text>
              {renderStars()}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Tu reseña</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Comparte tu experiencia (opcional)"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                maxLength={400}
                value={description}
                onChangeText={setDescription}
              />
              <Text style={styles.charCounter}>{description.length}/400</Text>
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Añadir reseña</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalWrapper: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pointName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  starButton: {
    flex: 1,
    alignItems: 'center',
  },
  textInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  charCounter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddReviewModal;
