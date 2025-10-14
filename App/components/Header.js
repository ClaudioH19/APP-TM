import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';

const Header = () => {
    return (
        <SafeAreaView className="bg-white mt-auto">
            <View className="bg-white px-4 py-3 flex-row items-center">
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