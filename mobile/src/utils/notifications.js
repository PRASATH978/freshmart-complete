import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { authAPI } from '../api';

// How notifications appear when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Must use physical device for notifications');
    return;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission denied');
    return;
  }

  // Get Expo push token
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: 'your-expo-project-id', // ← get from app.json or expo.dev
  })).data;

  // Save token to backend
  try {
    await authAPI.savePushToken(token);
  } catch (e) {
    console.log('Failed to save push token', e);
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1B4332',
    });
  }

  return token;
}