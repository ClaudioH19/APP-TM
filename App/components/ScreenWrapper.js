import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from './Header';
import Footer from './Footer';

const ScreenWrapper = ({ children, showHeader = true }) => {
  return (
    <SafeAreaView className="bg-gray-50 flex-1" edges={['left', 'right']}>
      {showHeader && <Header />}
      <View className="flex-1">
        {children}
      </View>
      <Footer />
    </SafeAreaView>
  );
};

export default ScreenWrapper;