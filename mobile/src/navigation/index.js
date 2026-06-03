import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

import HomeScreen from '../screens/customer/HomeScreen';
import ShopScreen from '../screens/customer/ShopScreen';
import ProductDetailScreen from '../screens/customer/ProductDetailScreen';
import CartScreen from '../screens/customer/CartScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import OrdersScreen from '../screens/customer/OrdersScreen';
import OffersScreen from '../screens/customer/OffersScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminPaymentsScreen from '../screens/admin/AdminPaymentsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminOffersScreen from '../screens/admin/AdminOffersScreen';

import DeliveryDashboardScreen from '../screens/delivery/DeliveryDashboardScreen';
import ActiveDeliveriesScreen from '../screens/delivery/ActiveDeliveriesScreen';
import DeliveryHistoryScreen from '../screens/delivery/DeliveryHistoryScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function CustomerTabs() {
  const { cart } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1B4332',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarBadge:
          route.name === 'Cart' && cart?.item_count > 0
            ? cart.item_count
            : undefined,
        tabBarBadgeStyle: {
          backgroundColor: '#EF4444',
          fontSize: 9,
          fontWeight: '800',
          minWidth: 16,
          height: 16,
          borderRadius: 8,
        },
        tabBarIcon: ({ color, focused, size }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Shop: focused ? 'storefront' : 'storefront-outline',
            Cart: focused ? 'bag' : 'bag-outline',
            Offers: focused ? 'gift' : 'gift-outline',
            Orders: focused ? 'receipt' : 'receipt-outline',
            Profile: focused ? 'person-circle' : 'person-circle-outline',
          };

          return (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 32,
                borderRadius: 10,
                backgroundColor: focused ? '#D1FAE5' : 'transparent',
              }}
            >
              <Ionicons
                name={icons[route.name]}
                size={22}
                color={focused ? '#1B4332' : '#9CA3AF'}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Offers" component={OffersScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#5B21B6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused }) => {
          const icons = {
            Dashboard: focused ? 'grid' : 'grid-outline',
            Products: focused ? 'basket' : 'basket-outline',
            Orders: focused ? 'receipt' : 'receipt-outline',
            Payments: focused ? 'card' : 'card-outline',
            Users: focused ? 'people' : 'people-outline',
          };

          return (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 32,
                borderRadius: 10,
                backgroundColor: focused ? '#EDE9FE' : 'transparent',
              }}
            >
              <Ionicons
                name={icons[route.name]}
                size={22}
                color={focused ? '#5B21B6' : '#9CA3AF'}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Products" component={AdminProductsScreen} />
      <Tab.Screen name="Orders" component={AdminOrdersScreen} />
      <Tab.Screen name="Payments" component={AdminPaymentsScreen} />
      <Tab.Screen name="Users" component={AdminUsersScreen} />
    </Tab.Navigator>
  );
}

function DeliveryTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#EA580C',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused }) => {
          const icons = {
            Dashboard: focused ? 'speedometer' : 'speedometer-outline',
            Active: focused ? 'bicycle' : 'bicycle-outline',
            History: focused ? 'time' : 'time-outline',
          };

          return (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 32,
                borderRadius: 10,
                backgroundColor: focused ? '#FFEDD5' : 'transparent',
              }}
            >
              <Ionicons
                name={icons[route.name]}
                size={22}
                color={focused ? '#EA580C' : '#9CA3AF'}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DeliveryDashboardScreen} />
      <Tab.Screen name="Active" component={ActiveDeliveriesScreen} />
      <Tab.Screen name="History" component={DeliveryHistoryScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FDF4' }}>
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.role === 'admin' ? (
          <>
            <Stack.Screen name="AdminTabs" component={AdminTabs} />
            <Stack.Screen name="AdminOffers" component={AdminOffersScreen} />
          </>
        ) : user.role === 'delivery' ? (
          <Stack.Screen name="DeliveryTabs" component={DeliveryTabs} />
        ) : (
          <>
            <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}