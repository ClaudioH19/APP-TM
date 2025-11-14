import AsyncStorage from '@react-native-async-storage/async-storage';

// Wrapper fetch that injects Authorization header when token exists
export async function fetchWithAuth(url, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // ignore storage errors, proceed without token
    console.warn('fetchWithAuth: error reading token from storage', err);
  }

  const finalOptions = { ...options, headers };
  return fetch(url, finalOptions);
}

export default fetchWithAuth;
