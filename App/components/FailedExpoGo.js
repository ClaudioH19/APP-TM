
import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import tw from 'twrnc';

const FailedExpoGo = ({ visible, title = "Error", message = "Algo salió mal.", onClose }) => {
  if (!visible) return null;
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={tw`flex-1 justify-center items-center bg-black/50`}>
        <View style={tw`bg-white rounded-2xl p-7 items-center min-w-[260px]`}>
          <View style={tw`w-20 h-20 bg-red-200 rounded-full items-center justify-center mb-4`}>
            <View style={tw`w-16 h-16 bg-red-500 rounded-full items-center justify-center`}>
              <X size={36} color="#fff" strokeWidth={3} />
            </View>
          </View>
          <Text style={tw`text-[20px] font-bold text-gray-900 mb-1.5 text-center`}>{title}</Text>
          <Text style={tw`text-base text-gray-600 text-center mb-3`}>{message}</Text>
          {onClose && (
            <Pressable onPress={onClose} style={tw`bg-red-500 rounded-lg py-2.5 px-6`}>
              <Text style={tw`text-white font-bold text-base`}>Cerrar</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default FailedExpoGo;
