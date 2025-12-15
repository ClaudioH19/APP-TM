import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, Modal, FlatList, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Pedometer, Accelerometer } from 'expo-sensors';
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
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "poi.business",
    "elementType": "labels",
    "stylers": [{ "visibility": "off" }]
  }
];

const MapComponent = () => {
  const mapRef = useRef(null);
  const lastStepTime = useRef(0);
  const usingPedometerRef = useRef(false);
  const subscriptionRef = useRef(null);
  const locationSubscriptionRef = useRef(null);
  const accelerometerSubscriptionRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastMagRef = useRef(0);
  
  const [region, setRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interestPoints, setInterestPoints] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [centerCoordinate, setCenterCoordinate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [currentStepCount, setCurrentStepCount] = useState(0);
  const [showPetSelectionModal, setShowPetSelectionModal] = useState(false);
  const [myPets, setMyPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [usingPedometer, setUsingPedometer] = useState(false);

  const isFocused = useIsFocused();

  // Función auxiliar para calcular distancia
  const getDistanceFromLatLonInMeters = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Función de limpieza centralizada
  const cleanupSensors = useCallback(() => {
    console.log('🧹 Limpiando sensores...');
    
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.remove();
      } catch (e) {
        console.log('Error limpiando subscription:', e);
      }
      subscriptionRef.current = null;
    }

    if (locationSubscriptionRef.current) {
      try {
        locationSubscriptionRef.current.remove();
      } catch (e) {
        console.log('Error limpiando location:', e);
      }
      locationSubscriptionRef.current = null;
    }

    if (accelerometerSubscriptionRef.current) {
      try {
        accelerometerSubscriptionRef.current.remove();
      } catch (e) {
        console.log('Error limpiando accelerometer:', e);
      }
      accelerometerSubscriptionRef.current = null;
    }

    try {
      Accelerometer.removeAllListeners();
    } catch (e) {
      console.log('Error removing accelerometer listeners:', e);
    }
  }, []);

  // Fetch pets
  const fetchMyPets = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !isMountedRef.current) return;

      const response = await fetch(API_ENDPOINTS.PROFILE_PETS, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok && isMountedRef.current) {
        const data = await response.json();
        const pets = Array.isArray(data) ? data : (data.mascotas || []);
        setMyPets(pets);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  }, []);

  // Load interest points
  const loadInterestPoints = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setLoadingPoints(true);
    try {
      const rawPoints = await getInterestPoints();
      if (!isMountedRef.current) return;
      
      const formattedPoints = formatPointsForMap(rawPoints);
      setInterestPoints(formattedPoints);
      console.log(`✅ Cargados ${formattedPoints.length} puntos de interés`);
    } catch (error) {
      console.error('Error cargando puntos de interés:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'No se pudieron cargar los puntos de interés.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingPoints(false);
      }
    }
  }, []);

  // Get user location
  const getUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        if (isMountedRef.current) {
          Alert.alert('Permiso denegado', 'Se necesita permiso de ubicación');
          setRegion({
            latitude: -33.4489,
            longitude: -70.6693,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
          setLoading(false);
        }
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Cambiado de High a Balanced
      });

      if (!isMountedRef.current) return;

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
      if (isMountedRef.current) {
        Alert.alert('Error', 'No se pudo obtener tu ubicación');
        setRegion({
          latitude: -33.4489,
          longitude: -70.6693,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setLoading(false);
      }
    }
  }, []);

  // Start accelerometer
  const startAccelerometer = useCallback(async () => {
    try {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable) {
        console.log('❌ Acelerómetro no disponible');
        return;
      }

      console.log('🚀 Iniciando acelerómetro...');
      setUsingPedometer(true);
      usingPedometerRef.current = true;

      Accelerometer.setUpdateInterval(200); // Reducido de 100 a 200ms

      const sub = Accelerometer.addListener(({ x, y, z }) => {
        if (!isMountedRef.current || !usingPedometerRef.current) return;

        const rawMag = Math.sqrt(x * x + y * y + z * z);
        const magnitude = 0.8 * lastMagRef.current + 0.2 * rawMag;
        lastMagRef.current = magnitude;

        const now = Date.now();
        if (magnitude > 1.2 && now - lastStepTime.current > 350) {
          setCurrentStepCount(prev => prev + 1);
          lastStepTime.current = now;
        }
      });
      
      accelerometerSubscriptionRef.current = sub;
    } catch (error) {
      console.error('Error iniciando acelerómetro:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'No se pudo iniciar el sensor de movimiento.');
      }
    }
  }, []);

  // Start tracking
  const startTracking = useCallback(async (pet) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere permiso de ubicación.');
        return;
      }

      let usePedometer = false;
      try {
        const isPedometerAvailable = await Pedometer.isAvailableAsync();
        if (isPedometerAvailable) {
          const { status: pedometerStatus } = await Pedometer.getPermissionsAsync();
          if (pedometerStatus === 'granted') {
            usePedometer = true;
          } else {
            const { status: newStatus } = await Pedometer.requestPermissionsAsync();
            if (newStatus === 'granted') {
              usePedometer = true;
            }
          }
        }
      } catch (e) {
        console.log('Error verificando podómetro:', e);
      }

      setIsTracking(true);
      setRouteCoordinates([]);
      setCurrentStepCount(0);
      setSelectedPet(pet);
      setShowPetSelectionModal(false);
      setUsingPedometer(false);
      usingPedometerRef.current = false;

      if (usePedometer) {
        console.log('✅ Usando Pedometer');
        setUsingPedometer(true);
        usingPedometerRef.current = true;
        let initialSteps = null;
        const sub = Pedometer.watchStepCount(result => {
          if (!isMountedRef.current) return;
          
          if (Platform.OS === 'android') {
            if (initialSteps === null) initialSteps = result.steps;
            setCurrentStepCount(result.steps - initialSteps);
          } else {
            setCurrentStepCount(result.steps);
          }
        });
        subscriptionRef.current = sub;
      } else {
        console.log('⚠️ Usando Acelerómetro');
        await startAccelerometer();
      }

      // Location tracking con configuración optimizada
      const locSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced, // Cambiado de High
          timeInterval: 10000, // Aumentado de 5000 a 10000ms
          distanceInterval: 10, // Aumentado de 5 a 10 metros
        },
        (location) => {
          if (!isMountedRef.current) return;

          const { latitude, longitude } = location.coords;

          setRouteCoordinates(prev => {
            const newCoords = [...prev, { latitude, longitude, timestamp: new Date() }];

            if (!usingPedometerRef.current && prev.length > 0) {
              const lastPoint = prev[prev.length - 1];
              const dist = getDistanceFromLatLonInMeters(
                lastPoint.latitude, lastPoint.longitude,
                latitude, longitude
              );
              const stepsToAdd = Math.round(dist / 0.762);
              if (stepsToAdd > 0) {
                setCurrentStepCount(c => c + stepsToAdd);
              }
            }

            return newCoords;
          });

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
      locationSubscriptionRef.current = locSub;

    } catch (error) {
      console.error('Error starting tracking:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'No se pudo iniciar el recorrido.');
        setIsTracking(false);
      }
    }
  }, [startAccelerometer, getDistanceFromLatLonInMeters]);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    cleanupSensors();

    if (!isTracking) return;

    const wasTracking = isTracking;
    const coords = [...routeCoordinates];
    const steps = currentStepCount;
    const pet = selectedPet;

    setIsTracking(false);
    setRouteCoordinates([]);
    setCurrentStepCount(0);
    setSelectedPet(null);

    if (coords.length > 0 && pet && wasTracking) {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const puntos = coords.map(coord => ({
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
            mascotaId: pet.mascota_id,
            pasos: steps,
            puntos
          })
        });

        if (response.ok && isMountedRef.current) {
          Alert.alert('¡Recorrido finalizado!', `Has dado ${steps} pasos con ${pet.nombre}.`);
        } else if (isMountedRef.current) {
          Alert.alert('Error', 'No se pudo guardar el recorrido.');
        }
      } catch (error) {
        console.error('Error saving route:', error);
        if (isMountedRef.current) {
          Alert.alert('Error', 'Error al guardar el recorrido.');
        }
      }
    }
  }, [isTracking, routeCoordinates, currentStepCount, selectedPet, cleanupSensors]);

  // Handle start press
  const handleStartPress = useCallback(() => {
    if (myPets.length === 0) {
      Alert.alert('Sin mascotas', 'Necesitas registrar una mascota para iniciar un recorrido.');
      return;
    }
    if (myPets.length === 1) {
      startTracking(myPets[0]);
    } else {
      setShowPetSelectionModal(true);
    }
  }, [myPets, startTracking]);

  // Handle callout press
  const handleCalloutPress = useCallback((point) => {
    console.log('Abriendo detalles de:', point.title);
    setSelectedPoint(point);
    setShowDetailModal(true);
  }, []);

  // Handle submit point
  const handleSubmitPoint = useCallback(async (pointData) => {
    try {
      await createInterestPoint(pointData);
      if (!isMountedRef.current) return;
      
      setShowCreateModal(false);
      Alert.alert(
        '¡Éxito!',
        'El punto de interés ha sido creado',
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
      if (isMountedRef.current) {
        setShowCreateModal(false);
        Alert.alert('Error', error.message || 'No se pudo crear el punto de interés');
      }
    }
  }, [loadInterestPoints]);

  // Update center coordinate
  useEffect(() => {
    if (createMode && region) {
      setCenterCoordinate({
        latitude: region.latitude,
        longitude: region.longitude,
      });
    }
  }, [region, createMode]);

  // Focus effect
  useEffect(() => {
    if (!isFocused && !isTracking) {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    } else if (isFocused && !isTracking && !locationSubscriptionRef.current) {
      getUserLocation();
    }
  }, [isFocused, isTracking, getUserLocation]);

  // Mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    getUserLocation();
    loadInterestPoints();
    fetchMyPets();

    return () => {
      console.log('🧹 Desmontando componente...');
      isMountedRef.current = false;
      cleanupSensors();
    };
  }, [getUserLocation, loadInterestPoints, fetchMyPets, cleanupSensors]);

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
          if (createMode) {
            setRegion(newRegion);
          }
        }}
        showsMyLocationButton={!createMode}
        followsUserLocation={false}
        pitchEnabled={true}
        maxZoomLevel={18}
        minZoomLevel={10}
      >
        {!createMode && interestPoints.map((point) => (
          <CustomMarker
            key={point.id}
            point={point}
            onCalloutPress={handleCalloutPress}
          />
        ))}

        {isTracking && routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#3b82f6"
            strokeWidth={4}
          />
        )}
      </MapView>

      {isTracking && (
        <View style={twrnc`absolute bottom-12 left-4 right-4 bg-white rounded-xl p-4 shadow-lg flex-row justify-between items-center`}>
          <View>
            <Text style={twrnc`text-gray-500 text-xs font-bold uppercase`}>Paseando a</Text>
            <Text style={twrnc`text-lg font-bold text-gray-800`}>{selectedPet?.nombre}</Text>
          </View>
          <View style={twrnc`items-center`}>
            <View style={twrnc`flex-row items-center`}>
              <Footprints size={20} color="#3b82f6" />
              <Text style={twrnc`text-2xl font-bold ml-2 text-blue-600`}>{currentStepCount}</Text>
            </View>
            <Text style={twrnc`text-xs text-gray-500`}>{usingPedometer ? 'pasos' : 'pasos (est.)'}</Text>
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

      {!createMode && !isTracking && (
        <TouchableOpacity
          style={twrnc`absolute bottom-40 right-3 bg-green-500 w-14 h-14 rounded-full items-center justify-center shadow-lg`}
          onPress={handleStartPress}
        >
          <Play size={24} color="white" fill="white" />
        </TouchableOpacity>
      )}

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
              keyExtractor={(item, index) => item.mascota_id?.toString() || index.toString()}
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

      {createMode && (
        <View style={styles.centerMarker}>
          <MapPin size={40} color="#ef4444" fill="#ef4444" />
        </View>
      )}

      {!createMode && (
        <TouchableOpacity
          style={styles.createButtonFAB}
          onPress={() => {
            setCreateMode(true);
            setCenterCoordinate({
              latitude: region.latitude,
              longitude: region.longitude,
            });
          }}
        >
          <MapPin size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {createMode && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => {
              setCreateMode(false);
              setCenterCoordinate(null);
            }}
          >
            <X size={20} color="#374151" />
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={() => {
              Alert.alert(
                'Confirmar ubicación',
                '¿Deseas crear un punto de interés en esta ubicación?',
                [
                  { text: 'No', style: 'cancel' },
                  { text: 'Sí', onPress: () => setShowCreateModal(true) },
                ]
              );
            }}
          >
            <Check size={20} color="#fff" />
            <Text style={styles.confirmButtonText}>Crear punto de interés</Text>
          </TouchableOpacity>
        </View>
      )}

      {loadingPoints && (
        <View style={styles.loadingPointsContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingPointsText}>Cargando puntos...</Text>
        </View>
      )}

      <CreatePointModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmitPoint}
        coordinate={centerCoordinate || { latitude: 0, longitude: 0 }}
      />

      <PointDetailModal
        visible={showDetailModal}
        point={selectedPoint}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPoint(null);
        }}
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
    backgroundColor: '#5bbbe8',
    borderRadius: 50,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#5bbbe8',
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