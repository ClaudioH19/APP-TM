import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert} from 'react-native';

/**
 * Custom hook to fetch pets from a given API URL.
 * @param {string} apiUrl - The URL of the API to fetch pets from.
 * @returns {Object} - An object containing the pets data, loading state, and error state.
 */
const usePets = (apiUrl) => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    if (!apiUrl) {
      Alert.alert('usePets', 'No apiUrl encontrado, saliendo...');
      return;
    }

    const fetchPets = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await AsyncStorage.getItem('token');

        if (!token) {
          throw new Error('No se encontró el token del usuario');
        }

       const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
   
        if (!response.ok) {
          throw new Error(`Error fetching pets: ${response.statusText}`);
        }
        
        const data = await response.json();

        setPets(data);
      } catch (err) {

        setError(err.message);
      } finally {

        setLoading(false);
      }
    };

    fetchPets();
  }, [apiUrl]);

  const result = { pets, loading, error };
  return result;
};

export default usePets;