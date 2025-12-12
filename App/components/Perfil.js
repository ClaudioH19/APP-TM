import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, Pressable, ActivityIndicator, Dimensions, ScrollView, RefreshControl, Alert, TextInput, Modal } from 'react-native';
import { Settings, Grid, Bookmark, Plus, Edit2, Trash2, X, Camera } from 'lucide-react-native';
import { PostCard } from './PostCard';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Video } from 'expo-av'; // comentado para evitar crasheos
import * as ImagePicker from 'expo-image-picker';
import { useCachedPosts } from '../hooks/useCachedPosts';
import { avatarCache } from '../services/avatarCache';
import twrnc from 'twrnc';

const { width } = Dimensions.get('window');
const imageSize = width / 3;

const Perfil = () => {
  const [user, setUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grid');
  const [showPetModal, setShowPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [petForm, setPetForm] = useState({ nombre: '', especie: '', descripcion: '', fecha_nacimiento: '' });
  const [savingPet, setSavingPet] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Primero cargamos el usuario
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

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

      // Obtener mascotas del usuario
      const petsResponse = await fetch(API_ENDPOINTS.PROFILE_PETS, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (petsResponse.ok) {
        const petsData = await petsResponse.json();
        setPets(petsData.mascotas || []);
      }

    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Usar hook de caché solo cuando user esté cargado
  const { posts, refreshing, refresh: refreshPosts } = useCachedPosts(user?.usuario_id);

  const [stats, setStats] = useState({
    posts: 0,
    pets: 0,
    followers: 0,
    following: 0
  });

  const onRefresh = () => {
    refreshPosts(); // Usa el refresh del hook de caché
    fetchUserProfile(); // Refresca usuario y mascotas
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

  // Funciones para manejar avatar
  const handleSelectAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a las fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting avatar:', error);
      Alert.alert('Error', 'Error al seleccionar imagen');
    }
  };

  const uploadAvatar = async (uri) => {
    try {
      setUploadingAvatar(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const formData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri,
        name: filename,
        type
      });

      const response = await fetch(API_ENDPOINTS.AVATAR, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Invalidar caché de avatar para este usuario
        avatarCache.invalidate(user.usuario_id);

        // Actualizar el usuario con el nuevo avatar
        setUser(prevUser => ({
          ...prevUser,
          avatar: data.avatar,
          avatarTimestamp: Date.now() // Agregar timestamp para cache busting
        }));
        setShowAvatarModal(false);
        Alert.alert('Éxito', 'Avatar actualizado');
      } else {
        Alert.alert('Error', 'No se pudo actualizar el avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Error al subir avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    Alert.alert(
      'Eliminar avatar',
      '¿Estás seguro de que quieres eliminar tu foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingAvatar(true);
              const token = await AsyncStorage.getItem('token');
              if (!token) return;

              const response = await fetch(API_ENDPOINTS.AVATAR, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.ok) {
                // Invalidar caché de avatar para este usuario
                avatarCache.invalidate(user.usuario_id);

                setUser(prevUser => ({
                  ...prevUser,
                  avatar: null,
                  avatarTimestamp: Date.now() // Agregar timestamp para cache busting
                }));
                setShowAvatarModal(false);
                Alert.alert('Éxito', 'Avatar eliminado');
              } else {
                Alert.alert('Error', 'No se pudo eliminar el avatar');
              }
            } catch (error) {
              console.error('Error deleting avatar:', error);
              Alert.alert('Error', 'Error al eliminar avatar');
            } finally {
              setUploadingAvatar(false);
            }
          }
        }
      ]
    );
  };

  const renderGridItem = ({ item, index }) => {
    // Usar la misma lógica que PostCard para construir la URL
    const id = item.id_video;
    const mime = item.mime_type;

    if (!id) {
      return (
        <View style={{
          width: imageSize - 2,
          height: imageSize - 2,
          margin: 1,
          backgroundColor: '#e5e7eb',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>Sin media</Text>
        </View>
      );
    }

    // Mapeos de MIME a extensión (igual que PostCard)
    const mimeToExt = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/x-m4v': 'm4v',
      'video/webm': 'webm',
      'video/x-msvideo': 'avi',
      'video/3gpp': '3gp',
    };

    // Determinar extensión
    let ext = '';
    if (mime) {
      ext = mimeToExt[mime] || '';
      if (!ext) {
        if (mime.startsWith('video')) ext = 'mp4';
        else if (mime.startsWith('image')) ext = 'jpg';
      }
    }

    // Si id ya tiene extensión, usarla
    if (!ext && id.includes('.')) {
      ext = id.split('.').pop().toLowerCase();
    }

    // Reconstruir nombre de archivo
    const fileName = id.includes('.') || !ext ? id : `${id}.${ext}`;
    const mediaUrl = `${API_ENDPOINTS.MEDIA}/${fileName}`;

    // Verificar si es video
    const videoExts = ['mp4', 'mov', 'm4v', '3gp', 'webm', 'avi'];
    const isVideo = (mime && mime.startsWith('video')) || videoExts.includes(ext);

    return (
      <Pressable
        style={{
          width: imageSize - 2,
          height: imageSize - 2,
          margin: 1,
          backgroundColor: '#000'
        }}
        onPress={() => {
          setSelectedPost(item);
          setShowPostModal(true);
        }}
      >
        <View style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* video comentado para evitar crasheos */}
          {/* {isVideo ? (
            <Video
              source={{ uri: mediaUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              shouldPlay={false}
              isMuted={true}
              isLooping={false}
              useNativeControls={false}
              onError={(error) => {
                console.log('Error cargando video:', mediaUrl, error);
              }}
            />
          ) : ( */}
          <Image
            source={{ uri: mediaUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={(error) => {
              console.log('Error cargando imagen:', mediaUrl, error.nativeEvent.error);
            }}
          />
          {/* )} */}
          {/* {isVideo && ( */}
          {/* <View style={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              backgroundColor: 'rgba(0,0,0,0.6)', 
              borderRadius: 4, 
              padding: 4 
            }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>▶</Text>
            </View> */}
          {/* )} */}
        </View>
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
        keyExtractor={(item, index) => activeTab === 'pets' ? (item.mascota_id?.toString() || index.toString()) : (item.id?.toString() || index.toString())}
        numColumns={activeTab === 'grid' ? 3 : 1}
        key={activeTab} // Importante para forzar re-render al cambiar de tab
        columnWrapperStyle={activeTab === 'grid' ? { justifyContent: 'flex-start' } : null}
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
              <Pressable style={twrnc`mr-6`} onPress={() => setShowAvatarModal(true)}>
                <View style={twrnc`w-20 h-20 rounded-full bg-gray-300 items-center justify-center overflow-hidden`}>
                  {user.avatar && user.avatar.data ? (
                    <Image
                      source={{ uri: `data:${user.avatar.mimeType};base64,${user.avatar.data}` }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={twrnc`text-2xl text-white font-bold`}>
                      {user.nombre?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  )}
                </View>
                {/* Indicador de cámara */}
                <View style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: '#3b82f6',
                  borderRadius: 12,
                  width: 24,
                  height: 24,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: 'white'
                }}>
                  <Camera size={14} color="white" />
                </View>
              </Pressable>

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

      {/* Modal para mostrar post seleccionado */}
      <Modal
        visible={showPostModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowPostModal(false);
          setSelectedPost(null);
        }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}
          onPress={() => {
            setShowPostModal(false);
            setSelectedPost(null);
          }}
        >
          <Pressable
            style={{ backgroundColor: 'white', borderRadius: 12, maxHeight: '90%', overflow: 'hidden' }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>Publicación</Text>
              <Pressable onPress={() => {
                setShowPostModal(false);
                setSelectedPost(null);
              }}>
                <X size={24} color="#000" />
              </Pressable>
            </View>

            {/* Contenido del post con ScrollView */}
            {selectedPost && (
              <ScrollView
                style={{ maxHeight: 600 }}
                showsVerticalScrollIndicator={true}
              >
                <PostCard post={selectedPost} />
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal para seleccionar/eliminar avatar */}
      <Modal
        visible={showAvatarModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowAvatarModal(false)}
        >
          <Pressable
            style={{ backgroundColor: 'white', borderRadius: 12, width: '80%', padding: 20 }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 20, textAlign: 'center' }}>
              Foto de perfil
            </Text>

            {uploadingAvatar ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <Pressable
                  style={{ backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, alignItems: 'center' }}
                  onPress={handleSelectAvatar}
                >
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                    Seleccionar foto
                  </Text>
                </Pressable>

                {user.avatar && (
                  <Pressable
                    style={{ backgroundColor: '#ef4444', padding: 16, borderRadius: 8, alignItems: 'center' }}
                    onPress={handleDeleteAvatar}
                  >
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                      Eliminar foto actual
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  style={{ backgroundColor: '#e5e7eb', padding: 16, borderRadius: 8, alignItems: 'center' }}
                  onPress={() => setShowAvatarModal(false)}
                >
                  <Text style={{ color: '#374151', fontSize: 16, fontWeight: '600' }}>
                    Cancelar
                  </Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default Perfil;
