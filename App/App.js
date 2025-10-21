import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeComponent from './components/HomeComponent';
import Login from './components/Login';
import Register from './components/Register';
import Header from './components/Header';
import MapComponent from './components/MapComponent';
import "./global.css";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from './config/api';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useRef(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const resp = await fetch(API_ENDPOINTS.ME, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resp.ok) {
            // Navega a Home si token válido
            navigationRef.current?.navigate('Home');
          } else {
            // token inválido -> limpiar
            await AsyncStorage.removeItem('token');
          }
        }
      } catch (err) {
        console.warn('Auth check failed', err);
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        {checkingAuth && (
          <View style={{ position: 'absolute', left:0,right:0,top:0,bottom:0,justifyContent:'center',alignItems:'center',zIndex:999 }}>
            <ActivityIndicator size="large" color="#007bff" />
          </View>
        )}
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={Register} options={{ title: 'Registro' }} />
          <Stack.Screen name="Map" component={MapComponent} options={{ title: 'Mapa' }} />
          <Stack.Screen name="Home" component={HomeComponent} options={{  headerRight: () => <Header /> }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
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
