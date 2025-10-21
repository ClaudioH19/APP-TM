import React, { useState, useEffect } from 'react';
import { View, Text, Alert, SafeAreaView, Pressable } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';

const Demo = () => {
  const [hasCamera, setHasCamera] = useState(false);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => setHasCamera(status === 'granted'));
  }, []);

  const handleCamera = () => {
    Alert.alert('Cámara', hasCamera ? 'Permiso concedido' : 'Permiso denegado');
  };

  const handleLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('GPS', 'Permiso denegado');
      return;
    }
    let location = await Location.getCurrentPositionAsync();
    const { latitude, longitude } = location.coords;
    setCoords({ latitude, longitude });
    Alert.alert('GPS', `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`);
  };

  const Button = ({ title, onPress, variant = 'primary' }) => (
    <Pressable
      onPress={onPress}
      className={`py-3 px-6 rounded ${
        variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'
      } mb-2`}
    >
      <Text className="text-white text-center">{title}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-gray-100 p-4">
        <Text className="text-2xl font-bold text-blue-600 mb-4">Demo Inicial</Text>
        <Button title="Probar Tailwind" onPress={() => Alert.alert('Tailwind', '¡Funciona!')} />
        <Button title="Test Cámara" onPress={handleCamera} variant="secondary" />
        <Button title="Obtener GPS" onPress={handleLocation} />
        {coords && (
          <Text className="mt-4 text-gray-700">
            Ubicación: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </Text>
        )}
      </SafeAreaView>
  );
};

export default Demo;