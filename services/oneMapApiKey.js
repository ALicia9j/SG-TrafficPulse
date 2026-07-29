import AsyncStorage from '@react-native-async-storage/async-storage';

const ONEMAP_EMAIL = "jagoh002@mymail.sim.edu.sg";
const ONEMAP_PASSWORD = "9vKBCHh62jz@AGm";

export const getOneMapToken = async () => {
  try {
    const cachedToken = await AsyncStorage.getItem('ONEMAP_TOKEN');
    const expiryTime = await AsyncStorage.getItem('ONEMAP_TOKEN_EXPIRY');

    const nowInSeconds = Math.floor(Date.now() / 1000);

    // Use cached token if valid (5 min buffer)
    if (cachedToken && expiryTime) {
      const parsedExpiry = parseInt(expiryTime, 10);
      if (!isNaN(parsedExpiry) && nowInSeconds < (parsedExpiry - 300)) {
        return cachedToken;
      }
    }

    console.log('Fetching fresh OneMap access token...');

    const response = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ONEMAP_EMAIL,
        password: ONEMAP_PASSWORD,
      }),
    });

    const data = await response.json();

    if (response.ok && data.access_token) {
      await AsyncStorage.setItem('ONEMAP_TOKEN', data.access_token);
      await AsyncStorage.setItem('ONEMAP_TOKEN_EXPIRY', data.expiry_timestamp.toString());
      return data.access_token;
    } else {
      console.error('OneMap Auth Failed:', data);
      throw new Error(data.error || 'Invalid credentials or token generation failed');
    }
  } catch (error) {
    console.error('Error in getOneMapToken:', error);
    throw error; // Re-throw error so calling service catches it instead of passing 'null' header
  }
};