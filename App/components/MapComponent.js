import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { MapPin, X, Check } from 'lucide-react-native';
import CustomMarker from './CustomMarker';
import CreatePointModal from './CreatePointModal';
import { getInterestPoints, formatPointsForMap, createInterestPoint } from '../services/interestPointsService';

const MapComponent = () => {
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interestPoints, setInterestPoints] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  
  // Estados para el modo de creación
  const [createMode, setCreateMode] = useState(false);
  const [centerCoordinate, setCenterCoordinate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getUserLocation();
    loadInterestPoints(); // Cargar puntos al montar el componente
  }, []);

  // Actualizar coordenada del centro cuando cambia la región (solo en modo creación)
  useEffect(() => {
    if (createMode && region) {
      setCenterCoordinate({
        latitude: region.latitude,
        longitude: region.longitude,
      });
    }
  }, [region, createMode]);

  const getUserLocation = async () => {
    try {
      // solicita permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Se necesita permiso de ubicación para mostrar tu posición en el mapa'
        );
        // ubicacion por defecto si no se otorgan permisos
        setRegion({
          latitude: -33.4489,
          longitude: -70.6693,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setLoading(false);
        return;
      }

      // obtiene la ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      setUserLocation({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
      // ubicacion por defecto en caso de error
      setRegion({
        latitude: -33.4489,
        longitude: -70.6693,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setLoading(false);
    }
  };

  /**
   * Función para cargar los puntos de interés desde la API
   */
  const loadInterestPoints = async () => {
    setLoadingPoints(true);
    try {
      // 1. Obtener datos desde la API
      const rawPoints = await getInterestPoints();
      
      // 2. Formatear los datos para el mapa
      const formattedPoints = formatPointsForMap(rawPoints);
      
      // 3. Guardar en el estado
      setInterestPoints(formattedPoints);
      
      console.log(`✅ Se cargaron ${formattedPoints.length} puntos de interés`);
    } catch (error) {
      console.error('Error cargando puntos de interés:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los puntos de interés. Verifica tu conexión.'
      );
    } finally {
      setLoadingPoints(false);
    }
  };

  const handleMarkerPress = (point) => {
    console.log('Marcador presionado:', point.title);
  };

  /**
   * Activa el modo de creación de puntos
   */
  const handleActivateCreateMode = () => {
    setCreateMode(true);
    setCenterCoordinate({
      latitude: region.latitude,
      longitude: region.longitude,
    });
  };

  /**
   * Cancela el modo de creación
   */
  const handleCancelCreateMode = () => {
    setCreateMode(false);
    setCenterCoordinate(null);
  };

  /**
   * Confirma la ubicación y abre el modal
   */
  const handleConfirmLocation = () => {
    Alert.alert(
      'Confirmar ubicación',
      '¿Deseas crear un punto de interés en esta ubicación?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Sí',
          onPress: () => setShowModal(true),
        },
      ]
    );
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmitPoint = async (pointData) => {
    try {
      // Crear el punto de interés
      await createInterestPoint(pointData);
      
      Alert.alert(
        '¡Éxito!',
        'El punto de interés ha sido creado correctamente',
        [
          {
            text: 'OK',
            onPress: () => {
              // Recargar los puntos
              loadInterestPoints();
              // Salir del modo de creación
              setCreateMode(false);
              setCenterCoordinate(null);
            },
          },
        ]
      );
    } catch (error) {
      throw error; // El modal mostrará el error
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={!createMode} // Ocultar en modo creación
        followsUserLocation={!createMode} // Desactivar seguimiento en modo creación
      >
        {/* Marcador de ubicación del usuario */}
        {!createMode && userLocation && (
          <Marker
            coordinate={userLocation}
            title="Mi ubicación"
            description="Estás aquí"
            pinColor="#3b82f6"
          />
        )}

        {/* Marcadores de puntos de interés */}
        {!createMode && interestPoints.map((point) => (
          <CustomMarker
            key={point.id}
            point={point}
            onPress={() => handleMarkerPress(point)}
          />
        ))}
      </MapView>

      {/* Pin en el centro (solo visible en modo creación) */}
      {createMode && (
        <View style={styles.centerMarker}>
          <MapPin size={40} color="#ef4444" fill="#ef4444" />
        </View>
      )}

      {/* Botón flotante circular para activar modo creación */}
      {!createMode && (
        <TouchableOpacity
          style={styles.createButtonFAB}
          onPress={handleActivateCreateMode}
        >
          <MapPin size={24} color="#fff" />
        </TouchableOpacity>
      )}
    

      {/* Botones de acción en modo creación */}
      {createMode && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelCreateMode}
          >
            <X size={20} color="#374151" />
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={handleConfirmLocation}
          >
            <Check size={20} color="#fff" />
            <Text style={styles.confirmButtonText}>Crear punto de interés</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Indicador de carga de puntos */}
      {loadingPoints && (
        <View style={styles.loadingPointsContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingPointsText}>Cargando puntos...</Text>
        </View>
      )}

      {/* Modal de formulario */}
      <CreatePointModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitPoint}
        coordinate={centerCoordinate || { latitude: 0, longitude: 0 }}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  centerMarker: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -20,
    marginTop: -40,
    zIndex: 1,
  },
  createButtonFAB: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 50, // Hace el botón circular
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 80, // Encima del Footer
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingPointsContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingPointsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#3b82f6',
  },
});

export default MapComponent;