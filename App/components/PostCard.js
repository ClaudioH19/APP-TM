import React, { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';

const Dot = ({ color = 'bg-gray-600' }) => (
  <View className={`w-1 h-1 ${color} rounded-full`} />
);

export const PostCard = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes ?? 0);

  const toggleLike = () => {
    setLiked(prev => !prev);
    setLikeCount(c => (liked ? c - 1 : c + 1));
  };

  return (
    <View className="bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: post.user?.avatar }}
            alt={post.user?.name}
            className="w-10 h-10 rounded-full"
          />
          <View>
            <Text className="font-semibold text-sm">{post.user?.name}</Text>
            <Text className="text-gray-500 text-xs">{post.user?.time}</Text>
          </View>
        </View>

        <Pressable className="flex-row gap-1">
          <Dot />
          <Dot />
          <Dot />
        </Pressable>
      </View>

      {/* Content */}
      {post?.content ? (
        <View className="px-4 mb-3">
          <Text className="text-sm text-gray-800 leading-5">
            {post.content}
          </Text>
        </View>
      ) : null}

      {/* Image */}
      {post?.image ? (
        <View className="w-full bg-gray-200 relative">
          <Image
            source={{ uri: post.image }}
            alt="Post"
            style={{ width: '100%', height: undefined, aspectRatio: 4 / 3 }}
            className="object-cover"
          />
          <View className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded">
            <Text className="text-white text-xs">1/3</Text>
          </View>
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
          <Text className="text-sm text-gray-700">{post.comments ?? 0}</Text>
        </Pressable>

        <Pressable className="flex-row items-center gap-1.5">
          <Share2 size={20} color="#374151" />
          <Text className="text-sm text-gray-700">{post.shares ?? 0}</Text>
        </Pressable>
      </View>
    </View>
  );
};
