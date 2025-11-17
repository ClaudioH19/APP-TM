import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, Pressable, ActivityIndicator, Dimensions, ScrollView, RefreshControl } from 'react-native';
import { Settings, Grid, Bookmark } from 'lucide-react-native';
import { PostCard } from './PostCard';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import twrnc from 'twrnc';

const { width } = Dimensions.get('window');
const imageSize = width / 3;

const Perfil = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' o 'list'
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Obtener información del usuario actual
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const userResponse = await fetch(API_ENDPOINTS.ME, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!userResponse.ok) {
        throw new Error('Error al obtener usuario');
      }

      const userData = await userResponse.json();
      setUser(userData.user);

      // Obtener todas las publicaciones
      const postsResponse = await fetch(API_ENDPOINTS.POSTS);
      if (!postsResponse.ok) {
        throw new Error('Error al obtener publicaciones');
      }

      const allPosts = await postsResponse.json();
      
      // Filtrar solo las publicaciones del usuario actual
      const userPosts = allPosts.filter(post => 
        post.usuario && post.usuario.usuario_id === userData.user.usuario_id
      );

      // Enriquecer con nombre de ubicación
      const enrichedPosts = await Promise.all(userPosts.map(async post => {
        if (post.ubicacion_lat && post.ubicacion_lon) {
          try {
            const locationResponse = await fetch(
              `${API_ENDPOINTS.LOCATION}?lat=${post.ubicacion_lat}&lon=${post.ubicacion_lon}`
            );
            const locationData = await locationResponse.json();
            return { ...post, ubicacion: locationData.name };
          } catch (err) {
            return post;
          }
        }
        return post;
      }));

      setPosts(enrichedPosts);
      
      // Actualizar estadísticas
      setStats({
        posts: enrichedPosts.length,
        followers: 0, // Por ahora estático
        following: 0  // Por ahora estático
      });

    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
  };

  const renderGridItem = ({ item }) => {
    const mediaUrl = item.id_video 
      ? `${API_ENDPOINTS.MEDIA}/${item.id_video}${item.mime_type === 'image/jpg' || item.mime_type === 'image/jpeg' ? '.jpg' : item.mime_type === 'image/png' ? '.png' : '.mp4'}`
      : null;

    return (
      <Pressable 
        style={{ width: imageSize, height: imageSize, padding: 1 }}
        onPress={() => {
          // Aquí podrías navegar a una vista detallada del post
          console.log('Post clicked:', item.id);
        }}
      >
        {mediaUrl ? (
          <Image 
            source={{ uri: mediaUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#9ca3af' }}>Sin imagen</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderListItem = ({ item }) => (
    <PostCard post={item} />
  );

  if (loading) {
    return (
      <View style={twrnc`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={twrnc`flex-1 justify-center items-center bg-white`}>
        <Text style={twrnc`text-gray-600`}>Error al cargar perfil</Text>
      </View>
    );
  }

  return (
    <View style={twrnc`flex-1 bg-white`}>
      <FlatList
        data={activeTab === 'grid' ? posts : posts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={activeTab === 'grid' ? 3 : 1}
        key={activeTab} // Importante para forzar re-render al cambiar de tab
        renderItem={activeTab === 'grid' ? renderGridItem : renderListItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={twrnc`pb-4`}>
            {/* Header con info del usuario */}
            <View style={twrnc`flex-row px-4 py-6 items-center`}>
              {/* Avatar */}
              <View style={twrnc`mr-6`}>
                <View style={twrnc`w-20 h-20 rounded-full bg-gray-300 items-center justify-center`}>
                  <Text style={twrnc`text-2xl text-white font-bold`}>
                    {user.nombre?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              </View>

              {/* Stats */}
              <View style={twrnc`flex-1 flex-row justify-around`}>
                <View style={twrnc`items-center`}>
                  <Text style={twrnc`text-xl font-bold`}>{stats.posts}</Text>
                  <Text style={twrnc`text-gray-600 text-sm`}>Posts</Text>
                </View>
                <View style={twrnc`items-center`}>
                  <Text style={twrnc`text-xl font-bold`}>{stats.followers}</Text>
                  <Text style={twrnc`text-gray-600 text-sm`}>Seguidores</Text>
                </View>
                <View style={twrnc`items-center`}>
                  <Text style={twrnc`text-xl font-bold`}>{stats.following}</Text>
                  <Text style={twrnc`text-gray-600 text-sm`}>Seguidos</Text>
                </View>
              </View>
            </View>

            {/* Nombre y bio */}
            <View style={twrnc`px-4 pb-4`}>
              <Text style={twrnc`font-bold text-base`}>
                {user.nombre} {user.apellido}
              </Text>
              <Text style={twrnc`text-gray-600 text-sm`}>@{user.usuario}</Text>
              {user.email && (
                <Text style={twrnc`text-gray-500 text-sm mt-1`}>{user.email}</Text>
              )}
            </View>

            {/* Botones de acción */}
            <View style={twrnc`px-4 pb-4 flex-row gap-2`}>
              <Pressable style={twrnc`flex-1 bg-gray-200 py-2 rounded-lg items-center`}>
                <Text style={twrnc`font-semibold`}>Editar perfil</Text>
              </Pressable>
              <Pressable style={twrnc`bg-gray-200 py-2 px-4 rounded-lg items-center`}>
                <Settings size={20} color="#000" />
              </Pressable>
            </View>

            {/* Tabs */}
            <View style={twrnc`flex-row border-t border-gray-300`}>
              <Pressable 
                style={twrnc`flex-1 py-3 items-center border-t-2 ${activeTab === 'grid' ? 'border-black' : 'border-transparent'}`}
                onPress={() => setActiveTab('grid')}
              >
                <Grid size={24} color={activeTab === 'grid' ? '#000' : '#9ca3af'} />
              </Pressable>
              <Pressable 
                style={twrnc`flex-1 py-3 items-center border-t-2 ${activeTab === 'list' ? 'border-black' : 'border-transparent'}`}
                onPress={() => setActiveTab('list')}
              >
                <Bookmark size={24} color={activeTab === 'list' ? '#000' : '#9ca3af'} />
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={twrnc`py-12 items-center`}>
            <Text style={twrnc`text-gray-500 text-lg`}>Aún no tienes publicaciones</Text>
          </View>
        }
        contentContainerStyle={posts.length === 0 && twrnc`flex-1`}
      />
    </View>
  );
};

export default Perfil;
