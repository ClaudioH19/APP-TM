import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeComponent from './components/HomeComponent';
import Login from './components/Login';
import Register from './components/Register';
import Header from './components/Header';
import CreatePost from './components/CreatePost';
import MapComponent from './components/MapComponent';
import ScreenWrapper from './components/ScreenWrapper';
import "./global.css";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from './config/api';

const Stack = createNativeStackNavigator();

const HomeScreen = () => (
  <ScreenWrapper showHeader={true}>
    <HomeComponent />
  </ScreenWrapper>
);

const MapScreen = () => (
  <ScreenWrapper showHeader={true}>
    <MapComponent />
  </ScreenWrapper>
);

export default function App() {
  const navigationRef = useRef(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    // verificar si existe token guardado al iniciar la app
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const resp = await fetch(API_ENDPOINTS.ME, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resp.ok) {
            setInitialRoute('Home');
          } else {
            await AsyncStorage.removeItem('token');
          }
        }
      } catch (err) {
        // silenciar error de verificación
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, []);

  if (checkingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#5bbbe8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={Register} options={{ title: 'Registro' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreatePost" component={CreatePost} options={{ title: 'Crear Publicación' }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});