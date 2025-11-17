import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, Pressable, ActivityIndicator, Dimensions, ScrollView, RefreshControl, Alert, TextInput, Modal } from 'react-native';
import { Settings, Grid, Bookmark, Plus, Edit2, Trash2, X } from 'lucide-react-native';
import { PostCard } from './PostCard';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import twrnc from 'twrnc';

const { width } = Dimensions.get('window');
const imageSize = width / 3;

const Perfil = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pets, setPets] = useState([]); // Nuevo estado para mascotas
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid', 'list' o 'pets'
  const [showPetModal, setShowPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [petForm, setPetForm] = useState({ nombre: '', especie: '', descripcion: '', fecha_nacimiento: '' });
  const [savingPet, setSavingPet] = useState(false); // Nuevo estado para prevenir múltiples clicks
  const [stats, setStats] = useState({
    posts: 0,
    pets: 0,
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

      // Obtener publicaciones del usuario usando endpoint específico
      const postsResponse = await fetch(API_ENDPOINTS.PROFILE_POSTS, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        
        // Enriquecer con nombre de ubicación
        const enrichedPosts = await Promise.all(postsData.publicaciones.map(async post => {
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
      }

      // Obtener mascotas del usuario
      const petsResponse = await fetch(API_ENDPOINTS.PROFILE_PETS, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (petsResponse.ok) {
        const petsData = await petsResponse.json();
        setPets(petsData.mascotas || []);
      }
      
      // Actualizar estadísticas (se hará después de obtener los datos)
      setTimeout(() => {
        setStats({
          posts: posts.length,
          pets: pets.length,
          followers: 0, // Por ahora estático
          following: 0  // Por ahora estático
        });
      }, 100);

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

  // Funciones para manejar mascotas
  const handleAddPet = () => {
    setPetForm({ nombre: '', especie: '', descripcion: '', fecha_nacimiento: '' });
    setEditingPet(null);
    setShowPetModal(true);
  };

  const handleEditPet = (pet) => {
    setPetForm({
      nombre: pet.nombre || '',
      especie: pet.especie || '',
      descripcion: pet.descripcion || '',
      fecha_nacimiento: pet.fecha_nacimiento ? new Date(pet.fecha_nacimiento).toISOString().split('T')[0] : ''
    });
    setEditingPet(pet);
    setShowPetModal(true);
  };

  const handleSavePet = async () => {
    if (savingPet) return; // Prevenir múltiples clicks
    
    try {
      setSavingPet(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const url = editingPet 
        ? `${API_ENDPOINTS.PROFILE_PETS}/${editingPet.mascota_id}`
        : API_ENDPOINTS.PROFILE_PETS;
      
      const method = editingPet ? 'PUT' : 'POST';
      
      // Preparar el body según si es creación o actualización
      let requestBody;
      
      if (editingPet) {
        // Para actualización, solo enviar campos que han cambiado
        requestBody = {};
        
        // Comparar cada campo con el valor original
        if (petForm.nombre !== (editingPet.nombre || '')) {
          requestBody.nombre = petForm.nombre;
        }
        if (petForm.especie !== (editingPet.especie || '')) {
          requestBody.especie = petForm.especie;
        }
        if (petForm.descripcion !== (editingPet.descripcion || '')) {
          requestBody.descripcion = petForm.descripcion;
        }
        if (petForm.fecha_nacimiento !== (editingPet.fecha_nacimiento ? new Date(editingPet.fecha_nacimiento).toISOString().split('T')[0] : '')) {
          requestBody.fecha_nacimiento = petForm.fecha_nacimiento ? new Date(petForm.fecha_nacimiento).toISOString() : null;
        }
        
        // Si no hay cambios, mostrar mensaje y cerrar modal
        if (Object.keys(requestBody).length === 0) {
          Alert.alert('Sin cambios', 'No se detectaron cambios en la información de la mascota.');
          setShowPetModal(false);
          setSavingPet(false);
          return;
        }
      } else {
        // Para creación, enviar todos los campos requeridos
        requestBody = {
          nombre: petForm.nombre,
          especie: petForm.especie,
          descripcion: petForm.descripcion || null,
          fecha_nacimiento: petForm.fecha_nacimiento ? new Date(petForm.fecha_nacimiento).toISOString() : null
        };
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        setShowPetModal(false);
        
        // Actualizar mascotas localmente en lugar de recargar todo
        if (editingPet) {
          // Actualizar mascota existente
          setPets(prevPets => 
            prevPets.map(pet => 
              pet.mascota_id === editingPet.mascota_id ? result.mascota : pet
            )
          );
        } else {
          // Agregar nueva mascota
          setPets(prevPets => [...prevPets, result.mascota]);
        }
        
        // Resetear formulario
        setPetForm({ nombre: '', especie: '', descripcion: '', fecha_nacimiento: '' });
        setEditingPet(null);
        
        // Mostrar mensaje de éxito
        if (editingPet && Object.keys(requestBody).length > 0) {
          const updatedFields = Object.keys(requestBody).join(', ');
          console.log(`Campos actualizados: ${updatedFields}`);
        }
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'No se pudo guardar la mascota');
      }
    } catch (error) {
      console.error('Error saving pet:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setSavingPet(false);
    }
  };

  const handleDeletePet = async (petId) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar esta mascota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) return;

              const response = await fetch(`${API_ENDPOINTS.PROFILE_PETS}/${petId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });

              if (response.ok) {
                // Actualizar mascotas localmente en lugar de recargar todo
                setPets(prevPets => prevPets.filter(pet => pet.mascota_id !== petId));
              } else {
                Alert.alert('Error', 'No se pudo eliminar la mascota');
              }
            } catch (error) {
              console.error('Error deleting pet:', error);
              Alert.alert('Error', 'Error de conexión');
            }
          }
        }
      ]
    );
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

  const renderPetItem = ({ item }) => (
    <View style={twrnc`bg-white p-4 m-2 rounded-lg shadow-sm border border-gray-200`}>
      <View style={twrnc`flex-row justify-between items-start`}>
        <View style={twrnc`flex-1`}>
          <Text style={twrnc`font-bold text-lg text-gray-800`}>{item.nombre}</Text>
          <Text style={twrnc`text-gray-600 text-sm`}>Especie: {item.especie}</Text>
          {item.descripcion && <Text style={twrnc`text-gray-600 text-sm`}>Descripción: {item.descripcion}</Text>}
          {item.fecha_nacimiento && <Text style={twrnc`text-gray-600 text-sm`}>Nacimiento: {new Date(item.fecha_nacimiento).toLocaleDateString()}</Text>}
        </View>
        <View style={twrnc`flex-row gap-2`}>
          <Pressable
            style={twrnc`p-2 bg-blue-50 rounded-full`}
            onPress={() => handleEditPet(item)}
          >
            <Edit2 size={16} color="#3b82f6" />
          </Pressable>
          <Pressable
            style={twrnc`p-2 bg-red-50 rounded-full`}
            onPress={() => handleDeletePet(item.mascota_id)}
          >
            <Trash2 size={16} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    </View>
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
        data={activeTab === 'pets' ? pets : posts}
        keyExtractor={(item) => activeTab === 'pets' ? item.mascota_id.toString() : item.id.toString()}
        numColumns={activeTab === 'grid' ? 3 : 1}
        key={activeTab} // Importante para forzar re-render al cambiar de tab
        renderItem={
          activeTab === 'pets' ? renderPetItem :
          activeTab === 'grid' ? renderGridItem : renderListItem
        }
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
                  <Text style={twrnc`text-xl font-bold`}>{posts.length}</Text>
                  <Text style={twrnc`text-gray-600 text-sm`}>Posts</Text>
                </View>
                <View style={twrnc`items-center`}>
                  <Text style={twrnc`text-xl font-bold`}>{pets.length}</Text>
                  <Text style={twrnc`text-gray-600 text-sm`}>Mascotas</Text>
                </View>
                <View style={twrnc`items-center`}>
                  <Text style={twrnc`text-xl font-bold`}>{stats.followers}</Text>
                  <Text style={twrnc`text-gray-600 text-sm`}>Seguidores</Text>
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
              <Pressable 
                style={twrnc`flex-1 py-3 items-center border-t-2 ${activeTab === 'pets' ? 'border-black' : 'border-transparent'}`}
                onPress={() => setActiveTab('pets')}
              >
                <Text style={twrnc`font-bold ${activeTab === 'pets' ? 'text-black' : 'text-gray-400'}`}>🐾</Text>
              </Pressable>
            </View>
            
            {/* Header para mascotas con botón agregar */}
            {activeTab === 'pets' && (
              <View style={twrnc`px-4 py-3 bg-gray-50 border-b border-gray-200 flex-row justify-between items-center`}>
                <Text style={twrnc`text-lg font-semibold text-gray-800`}>Mis Mascotas</Text>
                <Pressable
                  style={twrnc`bg-blue-500 px-4 py-2 rounded-full flex-row items-center`}
                  onPress={handleAddPet}
                >
                  <Plus size={16} color="white" />
                  <Text style={twrnc`text-white font-semibold ml-1`}>Agregar</Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={twrnc`py-12 items-center`}>
            {activeTab === 'pets' ? (
              <View style={twrnc`items-center`}>
                <Text style={twrnc`text-gray-500 text-lg mb-4`}>Aún no tienes mascotas registradas</Text>
                <Pressable
                  style={twrnc`bg-blue-500 px-6 py-3 rounded-full flex-row items-center`}
                  onPress={handleAddPet}
                >
                  <Plus size={20} color="white" />
                  <Text style={twrnc`text-white font-semibold ml-2`}>Agregar mascota</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={twrnc`text-gray-500 text-lg`}>Aún no tienes publicaciones</Text>
            )}
          </View>
        }
        contentContainerStyle={[
          (activeTab === 'pets' ? pets.length === 0 : posts.length === 0) && twrnc`flex-1`,
          activeTab === 'pets' && twrnc`pb-6` // Padding bottom para mascotas
        ]}
      />
      
      {/* Botón flotante eliminado - ahora está en el header */}

      {/* Modal para agregar/editar mascota */}
      <Modal
        visible={showPetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPetModal(false)}
      >
        <View style={twrnc`flex-1 bg-black bg-opacity-50 justify-center`}>
          <View style={twrnc`bg-white m-4 p-6 rounded-lg`}>
            <View style={twrnc`flex-row justify-between items-center mb-4`}>
              <Text style={twrnc`text-xl font-bold`}>
                {editingPet ? 'Editar mascota' : 'Agregar mascota'}
              </Text>
              <Pressable onPress={() => setShowPetModal(false)}>
                <X size={24} color="#9ca3af" />
              </Pressable>
            </View>

            <View style={twrnc`gap-4`}>
              <View>
                <Text style={twrnc`text-gray-700 font-medium mb-2`}>Nombre *</Text>
                <TextInput
                  style={twrnc`border border-gray-300 rounded-lg px-3 py-2`}
                  value={petForm.nombre}
                  onChangeText={(text) => setPetForm({ ...petForm, nombre: text })}
                  placeholder="Nombre de la mascota"
                />
              </View>

              <View>
                <Text style={twrnc`text-gray-700 font-medium mb-2`}>Especie *</Text>
                <TextInput
                  style={twrnc`border border-gray-300 rounded-lg px-3 py-2`}
                  value={petForm.especie}
                  onChangeText={(text) => setPetForm({ ...petForm, especie: text })}
                  placeholder="Ej: Perro, Gato, Ave, etc."
                />
              </View>

              <View>
                <Text style={twrnc`text-gray-700 font-medium mb-2`}>Descripción</Text>
                <TextInput
                  style={twrnc`border border-gray-300 rounded-lg px-3 py-2`}
                  value={petForm.descripcion}
                  onChangeText={(text) => setPetForm({ ...petForm, descripcion: text })}
                  placeholder="Descripción de la mascota"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View>
                <Text style={twrnc`text-gray-700 font-medium mb-2`}>Fecha de Nacimiento</Text>
                <TextInput
                  style={twrnc`border border-gray-300 rounded-lg px-3 py-2`}
                  value={petForm.fecha_nacimiento}
                  onChangeText={(text) => setPetForm({ ...petForm, fecha_nacimiento: text })}
                  placeholder="AAAA-MM-DD"
                />
              </View>
            </View>

            <View style={twrnc`flex-row gap-3 mt-6`}>
              <Pressable
                style={twrnc`flex-1 bg-gray-200 py-3 rounded-lg items-center`}
                onPress={() => setShowPetModal(false)}
              >
                <Text style={twrnc`font-semibold text-gray-700`}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={twrnc`flex-1 ${savingPet ? 'bg-blue-300' : 'bg-blue-500'} py-3 rounded-lg items-center`}
                onPress={handleSavePet}
                disabled={!petForm.nombre || !petForm.especie || savingPet}
              >
                <Text style={twrnc`font-semibold text-white`}>
                  {savingPet ? 'Guardando...' : editingPet ? 'Actualizar' : 'Guardar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Perfil;
