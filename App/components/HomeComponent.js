import React from 'react';
import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { Home, MapPin, PlusCircle, User, Heart } from 'lucide-react-native';
import { PostCard } from './PostCard';
import Footer from './Footer';
import Header from './Header';
import { usePosts } from '../hooks/usePosts';
import { API_ENDPOINTS } from '../config/api';


const HomeComponent = () => {
  const { posts, loading, error } = usePosts(API_ENDPOINTS.POSTS);

  if (loading) return <Text className="text-center mt-10">Cargando publicaciones...</Text>;
  if (error) return <Text className="text-center mt-10 text-red-500">{error}</Text>;

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
