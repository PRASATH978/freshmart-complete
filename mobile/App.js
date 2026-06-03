import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { registerForPushNotifications } from './src/utils/notifications';
import AppNavigator from './src/navigation';

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Register for notifications
    registerForPushNotifications();

    // Listen for notifications when app is open
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      // You can navigate to order screen here
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <StatusBar style="auto" />
            <AppNavigator />
            <Toast />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}