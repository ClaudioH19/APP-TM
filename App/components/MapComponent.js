import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MapPin, X, Check } from 'lucide-react-native';
import CustomMarker from './CustomMarker';
import CreatePointModal from './CreatePointModal';
import PointDetailModal from './PointDetailModal';
import { getInterestPoints, formatPointsForMap, createInterestPoint } from '../services/interestPointsService';

const mapStyle = [
  {
    "featureType": "poi",
    "elementType": "labels",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "poi.business",
    "elementType": "labels",
    "stylers": [
      { "visibility": "off" }
    ]
  }
];

const MapComponent = () => {
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interestPoints, setInterestPoints] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  
  const [createMode, setCreateMode] = useState(false);
  const [centerCoordinate, setCenterCoordinate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  
  // Estados para el modal de detalles
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    getUserLocation();
    loadInterestPoints();
  }, []);

  // actualizar coordenada del centro al mover el mapa (solo en modo creación)
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Se necesita permiso de ubicación para mostrar tu posición en el mapa'
        );
        setRegion({
          latitude: -33.4489,
          longitude: -70.6693,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setLoading(false);
        return;
      }

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
      setRegion({
        latitude: -33.4489,
        longitude: -70.6693,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setLoading(false);
    }
  };

  const loadInterestPoints = async () => {
    setLoadingPoints(true);
    try {
      const rawPoints = await getInterestPoints();
      const formattedPoints = formatPointsForMap(rawPoints);
      setInterestPoints(formattedPoints);
      console.log(`✅ Se cargaron ${formattedPoints.length} puntos de interés`);
    } catch (error) {
      console.error('Error cargando puntos de interés:', error);
      Alert.alert('Error', 'No se pudieron cargar los puntos de interés. Verifica tu conexión.');
    } finally {
      setLoadingPoints(false);
    }
  };

  /**
   * Maneja cuando se presiona el callout de un marcador
   */
  const handleCalloutPress = (point) => {
    console.log('Abriendo detalles de:', point.title);
    setSelectedPoint(point);
    setShowDetailModal(true);
  };

  /**
   * Cierra el modal de detalles
   */
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPoint(null);
  };

  const handleActivateCreateMode = () => {
    setCreateMode(true);
    setCenterCoordinate({
      latitude: region.latitude,
      longitude: region.longitude,
    });
  };

  const handleCancelCreateMode = () => {
    setCreateMode(false);
    setCenterCoordinate(null);
  };

  const handleConfirmLocation = () => {
    Alert.alert(
      'Confirmar ubicación',
      '¿Deseas crear un punto de interés en esta ubicación?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí', onPress: () => setShowCreateModal(true) },
      ]
    );
  };

  const handleSubmitPoint = async (pointData) => {
    try {
      await createInterestPoint(pointData);
      
      Alert.alert(
        '¡Éxito!',
        'El punto de interés ha sido creado correctamente',
        [
          {
            text: 'OK',
            onPress: () => {
              loadInterestPoints();
              setCreateMode(false);
              setCenterCoordinate(null);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error al crear punto:', error);
      Alert.alert('Error', error.message || 'No se pudo crear el punto de interés');
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
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapStyle}
        initialRegion={region}
        showsPointsOfInterest={false}
        onRegionChangeComplete={(newRegion) => {
        
          // solo actualizar región en modo creación para capturar coordenada del centro
          if (createMode) {
            setRegion(newRegion);
          }
        }}
        showsUserLocation={true}
        showsMyLocationButton={!createMode} // ocultar botón GPS en modo creación
        followsUserLocation={false}
        rotateEnabled={true}
        pitchEnabled={true}
      >
        {/* Marcadores de puntos de interés */}
        {!createMode && interestPoints.map((point) => (
          <CustomMarker
            key={point.id}
            point={point}
            onCalloutPress={handleCalloutPress}
          />
        ))}
      </MapView>

      {/* pin rojo en el centro del mapa (solo visible en modo creación) */}
      {createMode && (
        <View style={styles.centerMarker}>
          <MapPin size={40} color="#ef4444" fill="#ef4444" />
        </View>
      )}

      {/* botón flotante para activar modo creación de puntos */}
      {!createMode && (
        <TouchableOpacity
          style={styles.createButtonFAB}
          onPress={handleActivateCreateMode}
        >
          <MapPin size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* botones de cancelar y confirmar (solo visibles en modo creación) */}
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

      {/* indicador de carga en esquina superior derecha */}
      {loadingPoints && (
        <View style={styles.loadingPointsContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingPointsText}>Cargando puntos...</Text>
        </View>
      )}

      {/* Modal de formulario para crear punto */}
      <CreatePointModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmitPoint}
        coordinate={centerCoordinate || { latitude: 0, longitude: 0 }}
      />

      {/* Modal de detalles del punto */}
      <PointDetailModal
        visible={showDetailModal}
        point={selectedPoint}
        onClose={handleCloseDetailModal}
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
    bottom: 615,
    right: 3,
    backgroundColor: '#3b82f6',
    borderRadius: 50,
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
    bottom: 80,
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
    backgroundColor: '#3b82f6',
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