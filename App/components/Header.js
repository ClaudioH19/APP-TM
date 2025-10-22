import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native'; // Importa el ícono de "atrás"

// Acepta 'navigation' y 'route' desde las props
const Header = ({ navigation, route }) => {
    
    // Revisa si el navegador puede retroceder
    const canGoBack = navigation.canGoBack();

    return (
        // El SafeAreaView maneja el padding superior (barra de estado)
        <SafeAreaView className="bg-white" edges={['top', 'left', 'right']}>
            <View className="bg-white px-4 py-3 flex-row items-center justify-between">
                
                {/* Lado Izquierdo: Botón "Atrás" o un espacio vacío */}
                <View className="w-8">
                  {canGoBack && (
                    <Pressable onPress={() => navigation.goBack()}>
                      <ArrowLeft size={24} color="#333" />
                    </Pressable>
                  )}
                </View>

                {/* Centro: Logo y Título */}
                <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                        <Text className="text-white font-bold text-sm">P</Text>
                    </View>
                    <Text className="font-bold text-lg">PetConnect</Text>
                </View>

                {/* Lado Derecho: Un espacio vacío para centrar el título */}
                <View className="w-8" />

            </View>
        </SafeAreaView>
    );
};
export default Header;