import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Header = () => {
    const navigation = useNavigation();

    const handleLogout = () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que quieres salir?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('token');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            console.error('Error al cerrar sesión:', error);
                        }
                    }
                }
            ]
        );
    };

    return (
        // El SafeAreaView maneja el padding superior (barra de estado)
        <SafeAreaView className="bg-white" edges={['top', 'left', 'right']}>
            <View className="bg-white px-4 py-3 flex-row items-center justify-between">
                {/* Espacio izquierdo para balance */}
                <View style={{ width: 40 }} />
                
                {/* Centro: Logo y Título */}
                <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                        <Text className="text-white font-bold text-sm">P</Text>
                    </View>
                    <Text className="font-bold text-lg">PetConnect</Text>
                </View>

                {/* Derecha: Botón de logout */}
                <Pressable onPress={handleLogout} style={{ padding: 8 }}>
                    <LogOut size={22} color="#6b7280" />
                </Pressable>
            </View>
        </SafeAreaView>
    );
};

export default Header;