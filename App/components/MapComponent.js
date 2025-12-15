import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, Modal, FlatList, Platform, Linking } from 'react-native';
import MapView, { UrlTile, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Pedometer, Accelerometer } from 'expo-sensors';
import { MapPin, X, Check, Play, Square, Footprints } from 'lucide-react-native';
import CustomMarker from './CustomMarker';
import CreatePointModal from './CreatePointModal';
import PointDetailModal from './PointDetailModal';
import { getInterestPoints, formatPointsForMap, createInterestPoint } from '../services/interestPointsService';
import { useIsFocused } from '@react-navigation/native';
import { API_ENDPOINTS, API_URL } from '../config/api';
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
  const lastStepTime = useRef(0); // Para el acelerómetro
  const usingPedometerRef = useRef(false); // Ref para evitar problemas de clausura en callbacks
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

  // Refs para suscripciones (para limpieza segura al desmontar)
  const subscriptionRef = useRef(null);
  const locationSubscriptionRef = useRef(null);

  const [showPetSelectionModal, setShowPetSelectionModal] = useState(false);
  const [myPets, setMyPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [usingPedometer, setUsingPedometer] = useState(false);

  // Función auxiliar para calcular distancia entre dos coordenadas (Haversine formula)
  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radio de la tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  };

  useEffect(() => {
    getUserLocation();
    loadInterestPoints();
    fetchMyPets();

    // Limpieza robusta al desmontar
    return () => {
      console.log('🧹 Limpiando recursos del mapa...');

      // 1. Limpiar suscripción de podómetro/acelerómetro
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.remove();
        } catch (e) { console.log('Error limpiando sub:', e); }
        subscriptionRef.current = null;
      }

      // 2. Limpiar suscripción de ubicación
      if (locationSubscriptionRef.current) {
        try {
          locationSubscriptionRef.current.remove();
        } catch (e) { console.log('Error limpiando loc:', e); }
        locationSubscriptionRef.current = null;
      }

      // 3. Detener TODOS los listeners globales de sensores por si acaso
      try {
        Accelerometer.removeAllListeners();
        Pedometer.removeAllListeners?.(); // Pedometer a veces no tiene este método en todas las versiones
      } catch (e) { }
    };
  }, []);

  // Efecto adicional para limpiar cuando la pantalla pierde el foco (Tab Navigation)
  useEffect(() => {
    if (!isFocused) {
      console.log('💤 Mapa perdió foco -> Pausando sensores no esenciales');
      // Opcional: Podríamos pausar el rastreo aquí si quisiéramos ahorrar batería
      // Pero si queremos rastreo en background, NO debemos limpiar aquí.
      // Solo limpiamos si el usuario NO está rastreando activamente.
      if (!isTracking) {
        if (locationSubscriptionRef.current) {
          locationSubscriptionRef.current.remove();
          locationSubscriptionRef.current = null;
        }
      }
    } else {
      // Al volver al foco, si no estamos rastreando, podríamos querer actualizar ubicación una vez
      if (!isTracking && !locationSubscriptionRef.current) {
        getUserLocation();
      }
    }
  }, [isFocused, isTracking]);

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

  // Función de respaldo usando el acelerómetro
  const startAccelerometer = async () => {
    try {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable) {
        console.log('❌ Acelerómetro no disponible en hardware');
        return;
      }

      console.log('🚀 Iniciando acelerómetro como fallback...');
      setUsingPedometer(true);
      usingPedometerRef.current = true;

      Accelerometer.setUpdateInterval(100); // 10Hz

      // Variables para suavizado (filtro paso bajo)
      let lastMag = 0;
      const alpha = 0.8; // Factor de suavizado

      const sub = Accelerometer.addListener(({ x, y, z }) => {
        const rawMag = Math.sqrt(x * x + y * y + z * z);
        // Filtro simple: Mag_suave = alpha * Mag_suave_prev + (1 - alpha) * Mag_raw
        const magnitude = alpha * lastMag + (1 - alpha) * rawMag;
        lastMag = magnitude;

        const now = Date.now();

        // Umbral restaurado: 1.2G y debounce de 350ms
        if (magnitude > 1.2 && now - lastStepTime.current > 350) {
          setCurrentStepCount(prev => prev + 1);
          lastStepTime.current = now;
        }
      });
      subscriptionRef.current = sub;
    } catch (error) {
      console.error('Error iniciando acelerómetro:', error);
      Alert.alert('Error', 'No se pudo iniciar el sensor de movimiento.');
    }
  };

  const startTracking = async (pet) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere permiso de ubicación para rastrear la ruta.');
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
        // Si falla la verificación, asumimos que no se puede usar y seguimos con acelerómetro
      }

      setIsTracking(true);
      setRouteCoordinates([]);
      setCurrentStepCount(0);
      setSelectedPet(pet);
      setShowPetSelectionModal(false);
      setUsingPedometer(false);
      usingPedometerRef.current = false;

      if (usePedometer) {
        console.log('✅ Usando Pedometer nativo');
        setUsingPedometer(true);
        usingPedometerRef.current = true;
        let initialSteps = null;
        const sub = Pedometer.watchStepCount(result => {
          if (Platform.OS === 'android') {
            if (initialSteps === null) initialSteps = result.steps;
            setCurrentStepCount(result.steps - initialSteps);
          } else {
            setCurrentStepCount(result.steps);
          }
        });
        subscriptionRef.current = sub;
      } else {
        // Si no hay podómetro o permiso, usamos acelerómetro
        console.log('⚠️ Pedometer no disponible/denegado -> Usando Acelerómetro');
        await startAccelerometer();
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

          setRouteCoordinates(prev => {
            const newCoords = [...prev, { latitude, longitude, timestamp: new Date() }];

            // Si no usamos podómetro (ni nativo ni acelerómetro), estimar pasos basados en distancia
            // Usamos usingPedometerRef para asegurar el valor actual dentro del callback
            if (!usingPedometerRef.current && prev.length > 0) {
              const lastPoint = prev[prev.length - 1];
              const dist = getDistanceFromLatLonInMeters(
                lastPoint.latitude, lastPoint.longitude,
                latitude, longitude
              );
              // Acumular pasos estimados (distancia / 0.762)
              const stepsToAdd = Math.round(dist / 0.762);
              if (stepsToAdd > 0) {
                setCurrentStepCount(c => c + stepsToAdd);
              }
            }

            return newCoords;
          });

          // Centrar mapa en la nueva ubicación (defensivo)
          try {
            if (mapRef.current?.animateToRegion) {
              mapRef.current.animateToRegion({
                latitude,
                longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }, 500);
            }
          } catch (e) {
            console.warn('Error animating map region:', e);
          }
        }
      );
      locationSubscriptionRef.current = locSub;

    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Error', 'No se pudo iniciar el recorrido.');
      setIsTracking(false);
    }
  };

  const stopTracking = async () => {
    // Detener suscripciones siempre, independientemente del estado isTracking
    if (subscriptionRef.current) {
      try { subscriptionRef.current.remove(); } catch (e) { console.warn('Error removing subscriptionRef:', e); }
      subscriptionRef.current = null;
    }
    if (locationSubscriptionRef.current) {
      try { locationSubscriptionRef.current.remove(); } catch (e) { console.warn('Error removing locationSubscriptionRef:', e); }
      locationSubscriptionRef.current = null;
    }

    // Detener acelerómetro explícitamente
    try { Accelerometer.removeAllListeners(); } catch (e) { /* ignore */ }

    if (!isTracking) return;

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
      if (isTracking) Alert.alert('Aviso', 'No se registraron datos suficientes para guardar el recorrido.');
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
        {/* OpenStreetMap tiles (no API key required) */}
        <UrlTile
          // Use backend tile proxy to avoid direct provider blocks
          urlTemplate={`${API_URL}/api/tiles/{z}/{x}/{y}.png`}
          zIndex={0}
          maximumZ={19}
          tileSize={256}
        />
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

      {/* OpenStreetMap credit (required by tile usage policy) */}
      <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 }}>
        <Text style={{ fontSize: 10, color: '#333' }}>© OpenStreetMap contributors</Text>
      </View>

      {/* Panel de control de recorrido */}
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