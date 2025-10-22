import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostCard } from './PostCard';
import { usePosts } from '../hooks/usePosts';
import { API_ENDPOINTS } from '../config/api';


const HomeComponent = () => {
  const { posts, loading, error, refreshPosts } = usePosts(API_ENDPOINTS.POSTS);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#5bbbe8" />
        <Text className="text-center mt-4 text-gray-600 text-base">Cargando publicaciones...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-center text-red-500 text-base">{error}</Text>
        <Pressable 
          className="mt-4 bg-[#5bbbe8] px-4 py-2 rounded-lg"
          onPress={refreshPosts}
        >
          <Text className="text-white">Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="max-w-md self-center w-full flex-1">
      {/* Feed */}
      <ScrollView 
        className="bg-white mt-2" 
        contentContainerStyle={{ paddingBottom: 88 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshPosts}
            colors={['#5bbbe8']} // Android
            tintColor="#5bbbe8" // iOS
          />
        }
      >
        {posts.map((p) => (
          <View key={p.id} className="pb-3">
            <PostCard post={p} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default HomeComponent;