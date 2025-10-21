import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, MapPin, PlusCircle, User, Heart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const FOOTER_HEIGHT = 56;

const Footer = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={['left','right','bottom']} style={styles.safeArea}>
      <View style={styles.outer}>
        <View style={styles.row}>
          <Pressable style={styles.item} onPress={() => navigation.navigate('Home')}>
            <Home size={24} color="#3b82f6" />
            <Text style={styles.primaryText}>Inicio</Text>
          </Pressable>

          <Pressable style={styles.item} onPress={() => navigation.navigate('Map')}>
            <MapPin size={24} color="#9ca3af" />
            <Text style={styles.secondaryText}>Mapa</Text>
          </Pressable>

          <Pressable style={[styles.fabWrap]}>
            <View style={styles.fab}>
              <PlusCircle size={33} color="#ffffff" />
            </View>
          </Pressable>

          <Pressable style={styles.item}>
            <Heart size={24} color="#9ca3af" />
            <Text style={styles.secondaryText}>Salud</Text>
          </Pressable>

          <Pressable style={styles.item} onPress={() => navigation.navigate('Home', { screen: 'Profile' })}>
            <User size={24} color="#9ca3af" />
            <Text style={styles.secondaryText}>Perfil</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f8fafc'
  },
  outer: {
    alignSelf: 'center',
    maxWidth: 640,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    height: FOOTER_HEIGHT,
    justifyContent: 'center',
    width: '100%',

  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  primaryText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 2
  },
  secondaryText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2
  },
  fabWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10 // ajusta la elevación visual del FAB
  },
  fab: {
    backgroundColor: '#0ea5e9',
    borderRadius: 999,
    padding: 12,
    elevation: 6
  }
});

export default Footer;