
import React from 'react';
import { View, Text, Modal } from 'react-native';
import { Check } from 'lucide-react-native';
import tw from 'twrnc';

const SuccessExpoGo = ({ visible, title = "¡Éxito!", message = "Operación completada correctamente", onClose }) => {
  if (!visible) return null;
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={tw`flex-1 justify-center items-center bg-black/50`}>
        <View style={tw`bg-white rounded-2xl p-7 items-center min-w-[260px]`}>
          <View style={tw`w-20 h-20 bg-green-200 rounded-full items-center justify-center mb-4`}>
            <View style={tw`w-16 h-16 bg-green-500 rounded-full items-center justify-center`}>
              <Check size={36} color="#fff" strokeWidth={3} />
            </View>
          </View>
          <Text style={tw`text-[20px] font-bold text-gray-900 mb-1.5 text-center`}>{title}</Text>
          <Text style={tw`text-base text-gray-600 text-center`}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

export default SuccessExpoGo;
