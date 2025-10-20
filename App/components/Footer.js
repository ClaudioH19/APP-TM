import React from 'react';
import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { Home, MapPin, PlusCircle, User, Heart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';


const Footer = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="bg-gray-50 flex-1 mb-12">
        {/* Bottom Navigation */}
        <View className="absolute bottom-0 left-0 right-0 self-center max-w-md bg-white border-t border-gray-200">
          <View className="flex-row items-center justify-around py-2">
            <Pressable className="items-center gap-1 py-2 px-4">
              <Home size={24} color="#3b82f6" />
              <Text className="text-xs text-blue-500 font-medium">Inicio</Text>
            </Pressable>

            <Pressable className="items-center gap-1 py-2 px-4">
              <MapPin size={24} color="#9ca3af" />
              <Text className="text-xs text-gray-400">Mapa</Text>
            </Pressable>

            <Pressable onPress={() => navigation.navigate('CreatePost')} className="items-center gap-1 -mt-6">
              <View className="bg-blue-500 rounded-full p-4">
                <PlusCircle size={28} color="#ffffff" />
              </View>
            </Pressable>

            <Pressable className="items-center gap-1 py-2 px-4">
              <Heart size={24} color="#9ca3af" />
              <Text className="text-xs text-gray-400">Salud</Text>
            </Pressable>

            <Pressable className="items-center gap-1 py-2 px-4">
              <User size={24} color="#9ca3af" />
              <Text className="text-xs text-gray-400">Perfil</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
  );
};

export default Footer;
