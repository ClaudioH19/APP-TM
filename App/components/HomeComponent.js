import React from 'react';
import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { Home, MapPin, PlusCircle, User, Heart } from 'lucide-react-native';
import { PostCard } from './PostCard';
import Footer from './Footer';
import Header from './Header';



const HomeComponent = () => {
  const posts = [
    {
      id: 1,
      user: {
        name: 'Joshua J',
        avatar: 'https://i.pravatar.cc/150?img=12',
        time: '9h'
      },
      content:
        'Mis perritos y mi gato conviviendo felizmente en el jardín. ¡Estos días han sido increíbles para las mascotas durante estos días calurosos. Siempre debe tener agua fresca disponible. #TiempoEnElParque #CuidadoDeMascotas',
      image:
        'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600&fit=crop',
      likes: 45,
      comments: 10,
      shares: 13
    }
  ];

  return (
    <SafeAreaView className="bg-gray-50 flex-1">
      <View className="max-w-md self-center w-full flex-1">
        {/* Header */}

        {/* Feed */}
        <ScrollView className="bg-white mt-2" contentContainerStyle={{ paddingBottom: 88 }}>
          {posts.map((p) => (
            <View key={p.id} className="pb-3">
              <PostCard post={p} />
            </View>
          ))}
        </ScrollView>

        {/* Bottom Navigation */}
        <Footer />
      </View>
    </SafeAreaView>
  );
};

export default HomeComponent;
