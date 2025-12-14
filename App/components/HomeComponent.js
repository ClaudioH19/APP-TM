import React, { useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostCard } from './PostCard';
import { useCachedPosts } from '../hooks/useCachedPosts';


const HomeComponent = () => {
  const { posts, loading, error, refreshing, refresh } = useCachedPosts();
  const [visiblePostId, setVisiblePostId] = useState(null);

  // Callback para detectar qué post está visible en pantalla
  // Debe ser estable (useRef) para evitar el error de FlatList
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      // Solo el primer post visible (el más centrado) puede reproducir video
      const firstVisible = viewableItems[0];
      setVisiblePostId(firstVisible?.item?.id || null);
    } else {
      setVisiblePostId(null);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // El item debe estar 50% visible
    minimumViewTime: 300, // Debe estar visible al menos 300ms
  }).current;

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
            <PostCard post={item} isVisible={visiblePostId === item.id} />
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
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
};

export default HomeComponent;