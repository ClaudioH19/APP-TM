
import React from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';
import { Upload } from 'lucide-react-native';
import tw from 'twrnc';

const LoadingExpoGo = ({ visible, title = "Procesando...", message = "Por favor espera mientras procesamos tu solicitud" }) => {
  if (!visible) return null;
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={tw`flex-1 justify-center items-center bg-black/50`}>
        <View style={tw`bg-white rounded-2xl p-7 items-center min-w-[260px]`}>
          <View style={tw`w-20 h-20 bg-sky-200 rounded-full items-center justify-center mb-4`}>
            <View style={tw`w-16 h-16 bg-sky-500 rounded-full items-center justify-center`}>
              <Upload size={32} color="#fff" strokeWidth={2.5} />
            </View>
          </View>
          <ActivityIndicator size="large" color="#38bdf8" style={tw`mb-3`} />
          <Text style={tw`text-[20px] font-bold text-gray-900 mb-1.5 text-center`}>{title}</Text>
          <Text style={tw`text-base text-gray-600 text-center`}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

export default LoadingExpoGo;
