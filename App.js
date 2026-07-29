import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import CommuteScreen from './screens/CommuteScreen';
import SettingsScreen from './screens/SettingsScreen';
import { MapProvider } from './context/MapContext'; // <-- Import MapProvider

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <MapProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: true,
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === 'Map') iconName = 'map-outline';
              else if (route.name === 'Commute') iconName = 'navigate-outline';
              else if (route.name === 'Settings') iconName = 'settings-outline';

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen name="Map" component={HomeScreen} options={{ title: 'Live Traffic' }} />
          <Tab.Screen name="Commute" component={CommuteScreen} options={{ title: 'Route Planner' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </MapProvider>
  );
}