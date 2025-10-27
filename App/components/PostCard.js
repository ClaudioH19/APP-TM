import React, { useState, useRef } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { Volume2, VolumeX } from 'lucide-react-native';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { API_ENDPOINTS } from '../config/api';
import { Video } from 'expo-av';
import { Svg, Circle, Text as SvgText } from 'react-native-svg';

const Dot = ({ color = 'bg-gray-600' }) => (
  <View className={`w-1 h-1 ${color} rounded-full`} />
);

const DefaultAvatar = () => (
  <Svg width="40" height="40" viewBox="0 0 40 40">
    <Circle cx="20" cy="20" r="20" fill="#ccc" />
    <SvgText
      x="20"
      y="20"
      textAnchor="middle"
      dy=".3em"
      fontSize="20"
      fill="#fff"
    >
      ?
    </SvgText>
  </Svg>
);

export const PostCard = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.contador_likes ?? 0);
  const [commentCount, setCommentCount] = useState(post.contador_comentarios ?? 0);
  const [shareCount, setShareCount] = useState(post.contador_compartidos ?? 0);
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const toggleMute = () => setMuted(m => !m);

  const toggleLike = () => {
    setLiked(prev => !prev);
    setLikeCount(c => (liked ? c - 1 : c + 1));
  };

  return (
    <View className="bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-3">
          {post.usuario?.avatar ? (
            <Image
              source={{ uri: post.usuario.avatar }}
              alt={post.usuario?.nombre}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <DefaultAvatar />
          )}
          <View>
            <Text className="font-semibold text-sm">{post.usuario?.nombre}</Text>
            <Text className="text-gray-500 text-xs">{post?.fecha ? new Date(post.fecha).toLocaleDateString() : ""}</Text>
          </View>
        </View>

        <Pressable className="flex-row gap-1">
          <Dot />
          <Dot />
          <Dot />
        </Pressable>
      </View>

      {/* Ubicación */}
      {post.ubicacion && (
        <View className="px-4 mb-1">
          <Text className="text-xs text-gray-500">{post.ubicacion}</Text>
        </View>
      )}

      {/* Content */}
      {post?.descripcion ? (
        <View className="px-4 mb-3">
          <Text className="text-sm text-gray-800 leading-5">
            {post.descripcion}
          </Text>
        </View>
      ) : null}

      {/* Media: image or video */}
      {post?.id_video ? (
        <View className="w-full bg-gray-200 relative">
          {(() => {
            // Decide if media is video by mime_type or extension
            const mime = (post.mime_type || '').toLowerCase();
            const id = post.id_video || '';

            // Map for mime -> extension
            const mimeToExt = {
              'image/jpeg': 'jpeg',
              'image/jpg': 'jpg',
              'image/png': 'png',
              'image/webp': 'webp',
              'image/heic': 'heic',
              'image/gif': 'gif',
              'video/mp4': 'mp4',
              'video/quicktime': 'mov',
              'video/x-m4v': 'm4v',
              'video/webm': 'webm',
              'video/x-msvideo': 'avi',
              'video/3gpp': '3gp',
            };

            // Determine extension prioritizing mime_type (if provided)
            let ext = '';
            if (mime) {
              // Use full mime match first, otherwise check prefix
              ext = mimeToExt[mime] || '';
              if (!ext) {
                if (mime.startsWith('video')) ext = 'mp4';
                else if (mime.startsWith('image')) ext = 'jpg';
              }
            }

            // If mime didn't give us ext, try extracting from id if it contains a dot
            if (!ext && id.includes('.')) {
              ext = id.split('.').pop().toLowerCase();
            }

            // Decide if resource is video
            const videoExts = ['mp4', 'mov', 'm4v', '3gp', 'webm', 'avi'];
            const isVideo = mime.startsWith('video') || videoExts.includes(ext);

            // Reconstruct filename: if id already contains extension, use as-is; otherwise append ext when available
            const fileName = id.includes('.') || !ext ? id : `${id}.${ext}`;
            const uri = `${API_ENDPOINTS.MEDIA}/${fileName}`;

            if (isVideo) {
              return (
                <View style={{ width: '100%' }}>
                  <Video
                    ref={videoRef}
                    source={{ uri }}
                    style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }}
                    resizeMode="cover"
                    isLooping={true}
                    shouldPlay={true}
                    isMuted={muted}
                    useNativeControls={true}
                  />
                  <Pressable
                    onPress={toggleMute}
                    style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 6 }}
                  >
                    {muted ? (
                      <VolumeX size={22} color="#fff" />
                    ) : (
                      <Volume2 size={22} color="#fff" />
                    )}
                  </Pressable>
                </View>
              );
            }

            // fallback to image
            return (
              <Image
                source={{ uri }}
                alt="Post"
                style={{ width: '100%', height: undefined, aspectRatio: 4 / 3 }}
                className="object-cover"
              />
            );
          })()}
        </View>
      ) : null}

      {/* Actions */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={toggleLike} className="flex-row items-center gap-1.5">
          <Heart
            size={20}
            color={liked ? '#ef4444' : '#374151'}
            fill={liked ? '#ef4444' : 'transparent'}
          />
          <Text className="text-sm text-gray-700">{likeCount}</Text>
        </Pressable>

        <Pressable className="flex-row items-center gap-1.5">
          <MessageCircle size={20} color="#374151" />
          <Text className="text-sm text-gray-700">{commentCount}</Text>
        </Pressable>

        <Pressable className="flex-row items-center gap-1.5">
          <Share2 size={20} color="#374151" />
          <Text className="text-sm text-gray-700">{shareCount}</Text>
        </Pressable>
      </View>
    </View>
  );
};

// --- Estructura esperada de post y post.usuario ---
//  {
//    "id": 3,
//    "fecha": "2025-10-20T02:09:18.142Z",
//    "ubicacion_lat": -34.9806,
//    "ubicacion_lon": -71.2335,
//    "descripcion": "Primera publicación de prueba",
//    "contador_likes": 0,
//    "id_video": "pruebaUP.png",
//    "provider": "local",
//    "mime_type": "image/png",
//    "size_bytes": "N/A",
//    "usuario": {
//      "usuario_id": 2,
//      "nombre": "Test",
//      "apellido": "User",
//      "contrasena": "$argon2id$v=19$m=65536,t=3,p=4$uw/jiSMP/V7jTpgQpqpeBQ$AIvaMFLmXlg2B7+1gOPSXzBI2HRbD10C7zfII1zCc9Q",
//      "usuario": "testuser",
//      "email": "test@example.com"
//    },
//    "mascota": {
//      "mascota_id": 1,
//      "descripcion": "Mascota de prueba"
//    }
//  }
// HomeComponent debe buscar todas las publicaciones y pasar cada post a este componente.
// Los contadores de comentarios y compartidos deben venir en post.comments y post.shares respectivamente.
