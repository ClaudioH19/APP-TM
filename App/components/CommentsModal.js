import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import tw from 'twrnc';
import useComments from '../hooks/useComments';
import { X } from 'lucide-react-native';

const CommentItem = ({ item }) => (
  <View style={tw`px-4 py-3 border-b border-gray-100`}>
    <Text style={tw`text-sm font-semibold text-gray-800`}>{item.usuario?.nombre || item.usuario?.usuario || 'Usuario'}</Text>
    <Text style={tw`text-sm text-gray-700 mt-1`}>{item.comentario}</Text>
    <Text style={tw`text-xs text-gray-500 mt-1`}>{item.fecha ? new Date(item.fecha).toLocaleString() : ''}</Text>
  </View>
);

export default function CommentsModal({ postId, visible, onClose }) {
  const { comments, loading, error, creating, fetchComments, createComment } = useComments(postId);
  const [text, setText] = useState('');

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await createComment(text.trim());
      setText('');
    } catch (err) {
      // error handled in hook
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={tw`flex-1 justify-end bg-black/40`}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`bg-white rounded-t-2xl min-h-4/5`}>
          <View style={tw`flex-row items-center justify-between px-4 py-3 border-b border-gray-200`}>
            <Text style={tw`text-lg font-semibold`}>Comentarios</Text>
            <Pressable onPress={onClose} style={tw`p-1`}>
              <X size={20} color="#374151" />
            </Pressable>
          </View>

          {loading ? (
            <View style={tw`py-8 items-center`}>
              <ActivityIndicator size="large" color="#5bbbe8" />
              <Text style={tw`mt-3 text-gray-600`}>Cargando comentarios...</Text>
            </View>
          ) : error ? (
            <View style={tw`py-8 items-center px-4`}>
              <Text style={tw`text-red-500`}>{error}</Text>
              <Pressable onPress={fetchComments} style={tw`mt-3 bg-[#5bbbe8] px-4 py-2 rounded-lg`}>
                <Text style={tw`text-white`}>Reintentar</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => <CommentItem item={item} />}
              contentContainerStyle={{ paddingBottom: 12 }}
              style={tw`max-h-96`}
            />
          )}

          <View style={tw`px-4 py-3 border-t border-gray-200 flex-row items-center`}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Escribe un comentario..."
              style={tw`flex-1 mr-3 p-3 border border-gray-200 rounded-lg`}
              editable={!creating}
            />
            <Pressable onPress={handleSend} style={tw`bg-[#5bbbe8] px-4 py-3 rounded-lg`} disabled={creating}>
              <Text style={tw`text-white font-semibold`}>{creating ? '...' : 'Enviar'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
