import React from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostCard } from './PostCard';
import { useCachedPosts } from '../hooks/useCachedPosts';


const HomeComponent = () => {
  const { posts, loading, error, refreshing, refresh } = useCachedPosts();

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
          onPress={refresh}
        >
          <Text className="text-white">Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="max-w-md self-center w-full flex-1">
      {/* Feed */}
      <FlatList 
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="pb-3">
            <PostCard post={item} />
          </View>
        )}
        className="bg-white mt-2" 
        contentContainerStyle={{ paddingBottom: 88 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={['#5bbbe8']} // Android
            tintColor="#5bbbe8" // iOS
          />
        }
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
};

export default HomeComponent;