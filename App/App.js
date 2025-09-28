import { StyleSheet, Text, View } from 'react-native';
import Demo from './components/Demo';
import "./global.css"

export default function App() {
  return (
    <View style={styles.container}>
      <Demo />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
