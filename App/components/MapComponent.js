import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { MapPin, X, Check, Play, Square, Footprints } from 'lucide-react-native';
import CustomMarker from './CustomMarker';
import CreatePointModal from './CreatePointModal';
import PointDetailModal from './PointDetailModal';
import { getInterestPoints, formatPointsForMap, createInterestPoint } from '../services/interestPointsService';
import { useIsFocused } from '@react-navigation/native';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import twrnc from 'twrnc';


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
  const isFocused = useIsFocused();
  
  // Estados para el modal de detalles
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Estados para el recorrido
  const [isTracking, setIsTracking] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [currentStepCount, setCurrentStepCount] = useState(0);
  const [initialStepCount, setInitialStepCount] = useState(0);
  const [subscription, setSubscription] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [showPetSelectionModal, setShowPetSelectionModal] = useState(false);
  const [myPets, setMyPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    getUserLocation();
    loadInterestPoints();
    fetchMyPets();
    return () => {
      stopTracking(); // Limpiar al desmontar
    };
  }, []);

  const fetchMyPets = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(API_ENDPOINTS.PROFILE_PETS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        // El backend devuelve un array directamente o un objeto con la propiedad mascotas
        const pets = Array.isArray(data) ? data : (data.mascotas || []);
        setMyPets(pets);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  const startTracking = async (pet) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere permiso de ubicación para rastrear la ruta.');
        return;
      }

      const isPedometerAvailable = await Pedometer.isAvailableAsync();
      if (!isPedometerAvailable) {
        Alert.alert('Error', 'El podómetro no está disponible en este dispositivo.');
        // Podríamos continuar sin pasos, pero por ahora retornamos
        // return; 
      }

      setIsTracking(true);
      setRouteCoordinates([]);
      setCurrentStepCount(0);
      setSelectedPet(pet);
      setShowPetSelectionModal(false);

      // Iniciar podómetro
      if (isPedometerAvailable) {
        const sub = Pedometer.watchStepCount(result => {
          setCurrentStepCount(result.steps);
        });
        setSubscription(sub);
      }

      // Iniciar rastreo de ubicación
      const locSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // cada 5 segundos
          distanceInterval: 5, // cada 5 metros
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          setRouteCoordinates(prev => [...prev, { latitude, longitude, timestamp: new Date() }]);
          
          // Centrar mapa en la nueva ubicación
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude,
              longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }, 500);
          }
        }
      );
      setLocationSubscription(locSub);

    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Error', 'No se pudo iniciar el recorrido.');
      setIsTracking(false);
    }
  };

  const stopTracking = async () => {
    if (!isTracking) return;

    // Detener suscripciones
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }

    setIsTracking(false);

    if (routeCoordinates.length > 0 && selectedPet) {
      // Guardar recorrido
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const puntos = routeCoordinates.map(coord => ({
          latitud: coord.latitude,
          longitud: coord.longitude,
          timestamp: coord.timestamp
        }));

        const response = await fetch(API_ENDPOINTS.RECORRIDOS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            mascotaId: selectedPet.mascota_id,
            pasos: currentStepCount,
            puntos
          })
        });

        if (response.ok) {
          Alert.alert('¡Recorrido finalizado!', `Has dado ${currentStepCount} pasos con ${selectedPet.nombre}.`);
        } else {
          Alert.alert('Error', 'No se pudo guardar el recorrido.');
        }
      } catch (error) {
        console.error('Error saving route:', error);
        Alert.alert('Error', 'Error de conexión al guardar el recorrido.');
      }
    } else {
        if(isTracking) Alert.alert('Aviso', 'No se registraron datos suficientes para guardar el recorrido.');
    }
    
    // Limpiar estado
    setRouteCoordinates([]);
    setCurrentStepCount(0);
    setSelectedPet(null);
  };

  const handleStartPress = () => {
    if (myPets.length === 0) {
      Alert.alert('Sin mascotas', 'Necesitas registrar una mascota en tu perfil para iniciar un recorrido.');
      return;
    }
    if (myPets.length === 1) {
      startTracking(myPets[0]);
    } else {
      setShowPetSelectionModal(true);
    }
  };

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
      setShowCreateModal(false);
      Alert.alert(
        '¡Éxito!',
        'El punto de interés ha sido creado correctamente',
        [
          {
            text: 'OK',
            onPress: () => {
              setCreateMode(false);
              setCenterCoordinate(null);
              loadInterestPoints();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error al crear punto:', error);
      setShowCreateModal(false);
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
        showsUserLocation={isFocused}  
        showsCompass={false}     
        rotateEnabled={false}    
        onRegionChangeComplete={(newRegion) => {
        
          // solo actualizar región en modo creación para capturar coordenada del centro
          if (createMode) {
            setRegion(newRegion);
          }
        }}
        showsMyLocationButton={!createMode} // ocultar botón GPS en modo creación
        followsUserLocation={false}
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

        {/* Ruta actual */}
        {isTracking && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#3b82f6"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Panel de control de recorrido */}
      {isTracking && (
        <View style={twrnc`absolute top-12 left-4 right-4 bg-white rounded-xl p-4 shadow-lg flex-row justify-between items-center`}>
          <View>
            <Text style={twrnc`text-gray-500 text-xs font-bold uppercase`}>Paseando a</Text>
            <Text style={twrnc`text-lg font-bold text-gray-800`}>{selectedPet?.nombre}</Text>
          </View>
          <View style={twrnc`items-center`}>
            <View style={twrnc`flex-row items-center`}>
              <Footprints size={20} color="#3b82f6" />
              <Text style={twrnc`text-2xl font-bold ml-2 text-blue-600`}>{currentStepCount}</Text>
            </View>
            <Text style={twrnc`text-xs text-gray-500`}>pasos</Text>
          </View>
          <TouchableOpacity
            style={twrnc`bg-red-500 p-3 rounded-full`}
            onPress={() => Alert.alert(
              'Terminar recorrido',
              '¿Deseas finalizar y guardar el recorrido?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Finalizar', onPress: stopTracking }
              ]
            )}
          >
            <Square size={20} color="white" fill="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Botón para iniciar recorrido (solo si no está creando punto ni rastreando) */}
      {!createMode && !isTracking && (
        <TouchableOpacity
          style={twrnc`absolute bottom-40 right-3 bg-green-500 w-14 h-14 rounded-full items-center justify-center shadow-lg`}
          onPress={handleStartPress}
        >
          <Play size={24} color="white" fill="white" />
        </TouchableOpacity>
      )}

      {/* Modal de selección de mascota */}
      <Modal
        visible={showPetSelectionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPetSelectionModal(false)}
      >
        <View style={twrnc`flex-1 bg-black bg-opacity-50 justify-end`}>
          <View style={twrnc`bg-white rounded-t-2xl p-6`}>
            <Text style={twrnc`text-xl font-bold mb-4 text-center`}>¿Con quién vas a pasear?</Text>
            <FlatList
              data={myPets}
              keyExtractor={(item) => item.mascota_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={twrnc`flex-row items-center p-4 border-b border-gray-100`}
                  onPress={() => startTracking(item)}
                >
                  <View style={twrnc`w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4`}>
                    <Text style={twrnc`text-xl`}>🐾</Text>
                  </View>
                  <View>
                    <Text style={twrnc`font-bold text-lg`}>{item.nombre}</Text>
                    <Text style={twrnc`text-gray-500`}>{item.especie}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={twrnc`mt-4 bg-gray-200 p-4 rounded-xl items-center`}
              onPress={() => setShowPetSelectionModal(false)}
            >
              <Text style={twrnc`font-bold text-gray-700`}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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