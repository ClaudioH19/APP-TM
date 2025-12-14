import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Header = () => {
    return (
        // El SafeAreaView maneja el padding superior (barra de estado)
        <SafeAreaView className="bg-white" edges={['top', 'left', 'right']}>
            <View className="bg-white px-4 py-3 flex-row items-center justify-center">
                {/* Centro: Logo y Título */}
                <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                        <Text className="text-white font-bold text-sm">P</Text>
                    </View>
                    <Text className="font-bold text-lg">PetConnect</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Header;