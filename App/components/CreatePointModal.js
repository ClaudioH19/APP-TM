import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const CATEGORIAS = [
  { label: 'Selecciona una categoría', value: '' },
  { label: 'Veterinario', value: 'Veterinario' },
  { label: 'Tienda', value: 'Tienda' },
  { label: 'Ocio', value: 'Ocio' },
  { label: 'Deporte', value: 'Deporte' },
  { label: 'Otro', value: 'Otro' },
];

const CreatePointModal = ({ visible, onClose, onSubmit, coordinate }) => {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validaciones
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    if (!categoria) {
      Alert.alert('Error', 'Debes seleccionar una categoría');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        categoria,
        descripcion: descripcion.trim(),
        latitud: coordinate.latitude,
        longitud: coordinate.longitude,
      });

      // Limpiar el formulario
      setNombre('');
      setCategoria('');
      setDescripcion('');
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo crear el punto de interés');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNombre('');
    setCategoria('');
    setDescripcion('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Título */}
            <Text style={styles.title}>Crear Punto de Interés</Text>
            
            {/* Coordenadas */}
            <Text style={styles.coordinatesText}>
              📍 Lat: {coordinate.latitude.toFixed(6)}, Lon: {coordinate.longitude.toFixed(6)}
            </Text>

            {/* Campo: Nombre */}
            <Text style={styles.label}>
              Nombre <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Veterinaria Los Perritos"
              value={nombre}
              onChangeText={setNombre}
              maxLength={100}
              editable={!loading}
            />

            {/* Campo: Categoría */}
            <Text style={styles.label}>
              Categoría <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={categoria}
                onValueChange={setCategoria}
                enabled={!loading}
                style={styles.picker}
              >
                {CATEGORIAS.map((cat) => (
                  <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                ))}
              </Picker>
            </View>

            {/* Campo: Descripción */}
            <Text style={styles.label}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe el lugar..."
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              numberOfLines={4}
              maxLength={500}
              editable={!loading}
            />

            {/* Botones */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Crear Punto</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
    textAlign: 'center',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
});

export default CreatePointModal;