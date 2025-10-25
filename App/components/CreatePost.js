import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { API_ENDPOINTS } from '../config/api';
import usePets from '../hooks/usePets';
import { usePosts } from '../hooks/usePosts';
import Success from './SuccessExpoGo';
import Failed from './FailedExpoGo';
import Loading from './LoadingExpoGo';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');


export default function CreatePost({onSubmit }) {
  const navigation = useNavigation();
  const { pets, loading: loadingPets, error: errorPets } = usePets(API_ENDPOINTS.PETS);
  const { createPost, creating } = usePosts();
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video'
  const [mediaExt, setMediaExt] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);
  const [petModalVisible, setPetModalVisible] = useState(false);
  const [region, setRegion] = useState(null);
  const [marker, setMarker] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Estados para los componentes de feedback
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      // ask for media permissions
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  useEffect(() => {
    if (!loadingPets && !errorPets && pets.length > 0) {
      setSelectedPet(pets[0].mascota_id || pets[0].id);
    }
  }, [loadingPets, errorPets, pets]);

  const detectTypeFromUri = (uri) => {
    if (!uri) return { type: 'unknown', ext: '' };
    const u = uri.split('?')[0];
    const extMatch = u.match(/\.([0-9a-zA-Z]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : '';
    if (['mp4', 'mov', 'm4v', '3gp'].includes(ext)) return { type: 'video', ext };
    if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext)) return { type: 'image', ext };
    // fallback: try matching mime-like segments
    return { type: 'image', ext: 'jpg' };
  };

  const pickMedia = async (wantType = 'all') => {
    try {
      const mediaOption = wantType === 'video' ? ImagePicker.MediaTypeOptions.Videos : wantType === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.All;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaOption,
        quality: 0.8,
        allowsEditing: false,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        setMediaUri(asset.uri);
        const detected = detectTypeFromUri(asset.uri);
        setMediaType(asset.type || detected.type);
        setMediaExt(detected.ext || '');
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage('No se pudo seleccionar el archivo');
      setShowFailed(true);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setFeedbackMessage('Activa permisos de cámara para tomar fotos');
        setShowFailed(true);
        return;
      }
      // default to photo capture unless mediaType 'video' passed via param
      // we'll interpret targetType from an outer param by binding or wrapper
      setFeedbackMessage('Usa los botones específicos para Foto o Vídeo');
      setShowFailed(true);
    } catch (err) {
      console.error(err);
      setFeedbackMessage('No se pudo abrir la cámara');
      setShowFailed(true);
    }
  };

  // new: capture with explicit type
  const captureWithCamera = async (targetType = 'image') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setFeedbackMessage('Activa permisos de cámara para tomar fotos o vídeos');
        setShowFailed(true);
        return;
      }
      const options = {
        mediaTypes: targetType === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      };
      if (targetType === 'video') {
        options.videoMaxDuration = 30;
      }
      const result = await ImagePicker.launchCameraAsync(options);
      if (!result.canceled) {
        const asset = result.assets[0];
        const inferred = detectTypeFromUri(asset.uri);
        setMediaUri(asset.uri);
        setMediaType(asset.type || inferred.type);
        setMediaExt(inferred.ext);
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage('No se pudo abrir la cámara');
      setShowFailed(true);
    }
  };

  const goToMap = async () => {
    setStep(2);
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setFeedbackMessage('Activa permisos de ubicación para seleccionar la ubicación en el mapa');
        setShowFailed(true);
        setLoadingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const r = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(r);
      setMarker({ latitude: r.latitude, longitude: r.longitude });
      setLoadingLocation(false);
      // animate map
      setTimeout(() => {
        if (mapRef.current && r) mapRef.current.animateToRegion(r, 500);
      }, 500);
    } catch (err) {
      console.error(err);
      setLoadingLocation(false);
    }
  };

  const onMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
  };

  const submit = async () => {
    // Validaciones
    if (!description.trim()) {
      setFeedbackMessage('Agrega una descripción');
      setShowFailed(true);
      return;
    }
    if (!mediaUri) {
      setFeedbackMessage('Sube una foto o video');
      setShowFailed(true);
      return;
    }
    if (!selectedPet) {
      setFeedbackMessage('Selecciona una mascota');
      setShowFailed(true);
      return;
    }
    if (!marker) {
      setFeedbackMessage('Selecciona una ubicación en el mapa');
      setShowFailed(true);
      return;
    }

    const payload = {
      description: description.trim(),
      media: { uri: mediaUri, type: mediaType },
      petId: selectedPet,
      location: marker,
    };

    try {
      // Mostrar loading mientras se crea el post
      setShowLoading(true);
      
      const result = await createPost(payload);
      
      // Ocultar loading y mostrar éxito
      setShowLoading(false);
      setShowSuccess(true);
      
      // Reset form después de un delay
      setTimeout(() => {
        setDescription('');
        setMediaUri(null);
        setMediaType(null);
        setMediaExt('');
        setSelectedPet(pets.length > 0 ? pets[0].mascota_id || pets[0].id : null);
        setMarker(null);
        setStep(1);
        setShowSuccess(false);
        if (onSubmit) onSubmit(result);
        navigation.navigate('Home');
      }, 2000);
      
    } catch (error) {
      setShowLoading(false);
      setFeedbackMessage(error.message || 'No se pudo crear la publicación');
      setShowFailed(true);
      setTimeout(() => {
        setShowFailed(false);
        navigation.navigate('Home');
      }, 2000);
    }
  };

  // Step 1 UI
  const StepOne = (
    <View className="px-4">
      <Text className="text-lg font-semibold mb-2">Archivo (foto o video)</Text>
      <View className="mb-4">
        <View className="flex-row items-center justify-center">
          <TouchableOpacity
            className="bg-[#5bbbe8] w-20 h-24 mx-2 rounded-xl shadow-lg items-center justify-center"
            onPress={() => pickMedia('all')}
            accessibilityLabel="Seleccionar archivo"
            style={{ elevation: 4 }}
          >
            <MaterialIcons name="photo-library" size={36} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-white w-20 h-24 mx-2 rounded-xl shadow-lg border border-gray-300 items-center justify-center"
            onPress={() => captureWithCamera('image')}
            accessibilityLabel="Tomar foto"
            style={{ elevation: 4 }}
          >
            <Ionicons name="camera" size={36} color="#5bbbe8" />
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-white w-20 h-24 mx-2 rounded-xl shadow-lg border border-gray-300 items-center justify-center"
            onPress={() => captureWithCamera('video')}
            accessibilityLabel="Grabar vídeo"
            style={{ elevation: 4 }}
          >
            <MaterialIcons name="videocam" size={36} color="#5bbbe8" />
          </TouchableOpacity>
        </View>
      </View>

      {mediaUri ? (
        <View className="mb-4">
          {mediaType === 'video' ? (
            <View className="w-full h-48 rounded-lg bg-black items-center justify-center">
              <Text className="text-white">Vídeo seleccionado (. {mediaExt || 'mp4'})</Text>
            </View>
          ) : (
            <Image source={{ uri: mediaUri }} className="w-full h-48 rounded-lg" resizeMode="cover" />
          )}
          <Text className="text-sm text-gray-600 mt-1">Tipo: {mediaType || 'image'}{mediaExt ? ` (.${mediaExt})` : ''}</Text>
        </View>
      ) : null}

      <Text className="text-lg font-semibold mb-2">Descripción</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Describe tu publicación"
        multiline
        className="h-24 border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
      />

      <Text className="text-lg font-semibold mb-2">Seleccionar mascota</Text>
      <TouchableOpacity className="border border-gray-300 rounded-lg p-3 mb-4" onPress={() => setPetModalVisible(true)}>
        <Text>{(pets.find((p) => (p.mascota_id || p.id) === selectedPet) || {}).nombre || (pets.find((p) => (p.mascota_id || p.id) === selectedPet) || {}).name || 'Selecciona una mascota'}</Text>
      </TouchableOpacity>

      <View className="flex-row justify-between">
        <TouchableOpacity className="bg-gray-200 px-4 py-2 rounded-lg" onPress={() => setStep(1)} disabled>
          <Text>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-[#5bbbe8] px-4 py-2 rounded-lg" onPress={goToMap}>
          <Text className="text-white">Siguiente (Mapa)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Step 2 UI (map)
  const StepTwo = (
    <View className="flex-1 px-2">
      <Text className="text-lg font-semibold mb-2">Selecciona la ubicación</Text>
      {loadingLocation || !region ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2">Obteniendo ubicación...</Text>
        </View>
      ) : (
        <View className="rounded-lg overflow-hidden max-h-96 h-96">
          <MapView
            ref={mapRef}
            style={{ width: width - 16, height: 384 }}
            initialRegion={region}
            onPress={onMapPress}
            showsUserLocation
          >
            {/* OpenStreetMap tiles via UrlTile */}
            <UrlTile
              urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
              tileSize={256}
              subdomains={["a", "b", "c"]}
            />
            {marker ? <Marker coordinate={marker} /> : null}
          </MapView>
        </View>
      )}

      <View className="flex-row justify-between mt-4 px-2">
        <TouchableOpacity className="bg-gray-200 px-4 py-2 rounded-lg" onPress={() => setStep(1)}>
          <Text>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="bg-[#5bbbe8] px-4 py-2 rounded-lg" 
          onPress={submit}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-white">Publicar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="p-4 flex-1">
          {step === 1 ? StepOne : StepTwo}
        </View>

        {/* Pet selector modal */}
        <Modal visible={petModalVisible} animationType="fade" transparent>
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white p-4 rounded-xl max-w-xs w-full max-h-96">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-semibold">Selecciona mascota</Text>
                <Pressable
                  onPress={() => setPetModalVisible(false)}
                  className="bg-[#5bbbe8] px-3 py-1 rounded-lg"
                >
                  <Text className="text-white">Cerrar</Text>
                </Pressable>
              </View>
              <FlatList
                data={pets}
                keyExtractor={(item, index) => item.mascota_id?.toString() || item.id?.toString() || index.toString()}
                renderItem={({ item }) => (
                  <Pressable
                    className="p-3 border-b border-gray-200"
                    onPress={() => {
                      setSelectedPet(item.mascota_id || item.id);
                      setPetModalVisible(false);
                    }}
                  >
                    <Text className="text-gray-800">{item.nombre || item.name}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={<Text className="text-gray-500">No hay mascotas disponibles</Text>} // Handle empty pets array
                style={{ maxHeight: '100%' }}
              />
            </View>
          </View>
        </Modal>

        {/* Feedback modals */}
        <Success 
          visible={showSuccess}
          title="¡Éxito!"
          message="Publicación creada correctamente"
          onClose={() => setShowSuccess(false)}
        />
        <Failed 
          visible={showFailed}
          title="Error"
          message={feedbackMessage}
          onClose={() => setShowFailed(false)}
        />
        <Loading 
          visible={showLoading}
          title="Subiendo publicación..."
          message="Por favor espera mientras procesamos tu publicación"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}