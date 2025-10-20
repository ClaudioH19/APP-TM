import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeComponent from './components/HomeComponent';
import Login from './components/Login';
import Register from './components/Register';
import Header from './components/Header';
import CreatePost from './components/CreatePost';
import "./global.css";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={Register} options={{ title: 'Registro' }} />
        <Stack.Screen name="Home" component={HomeComponent} options={{  headerRight: () => <Header /> }} />
        <Stack.Screen name="CreatePost" component={CreatePost} options={{ title: 'Crear Publicación' }} />
      </Stack.Navigator>
    </NavigationContainer>
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
