import React, { useState } from 'react';
import { Image, Dimensions, Platform, SafeAreaView, KeyboardAvoidingView, TouchableOpacity, ActivityIndicator, Alert, TextInput, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

export default function Login({ onLoginSuccess, onCreateAccount }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const validate = () => {
      if (!email || !password) {
        Alert.alert('Error', 'Por favor completa email y contraseña');
        return false;
      }
      const re = /^\S+@\S+\.\S+$/;
      if (!re.test(email)) {
        Alert.alert('Error', 'Ingresa un email válido');
        return false;
      }
      return true;
    };

    const handleSubmit = async () => {
      if (!validate()) return;
      setLoading(true);
      try {
        const resp = await fetch('http://192.168.1.36:3000/api/auth/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email, password}),
        });

        const data = await resp.json();
        if (!resp.ok) {
          Alert.alert('Login fallido', data.message || 'Credenciales inválidas');
          setLoading(false);
          return;
        }

        if (data.token) {
          await AsyncStorage.setItem('token', data.token);
        }

        setLoading(false);
        if (onLoginSuccess) onLoginSuccess(data);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'No se pudo conectar al servidor');
        setLoading(false);
      }
    };

    return (
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 justify-center items-center px-5">
            <View className="w-full max-w-md p-5 rounded-xl bg-white shadow-md">
              <Image source={require('../assets/Imagen1.png')} className="w-36 h-36 self-center mb-2" resizeMode="contain" />
              <Text className="text-2xl font-semibold text-center text-gray-800 mb-3">Bienvenido/a a PetConnect</Text>


              <TextInput
                className="h-12 border border-gray-300 rounded-lg px-3 mb-3 bg-white text-gray-800"
                placeholder="Email"
                placeholderTextColor="#444"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                className="h-12 border border-gray-300 rounded-lg px-3 mb-3 bg-white text-gray-800"
                placeholder="Contraseña"
                placeholderTextColor="#444"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <View className="flex-row">
                <TouchableOpacity style={{ marginRight: 8 }} className="flex-1 bg-[#5bbbe8] h-12 rounded-lg items-center justify-center" onPress={handleSubmit} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Entrar</Text>}
                </TouchableOpacity>

                <TouchableOpacity className="flex-1 bg-white h-12 rounded-lg items-center justify-center border border-[#5bbbe8]" onPress={() => (onCreateAccount ? onCreateAccount() : Alert.alert('Crear cuenta', 'Implementa la pantalla de registro'))}>
                  <Text className="text-[#5bbbe8] font-semibold">Crear cuenta</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

    <Image source={require('../assets/Imagen2.png')} className="w-full" style={{ height: Math.round(height * 0.20) }} resizeMode="cover" />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
 
