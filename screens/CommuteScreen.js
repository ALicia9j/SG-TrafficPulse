import React, { useState, useEffect, useRef } from 'react';
import {StyleSheet,Text,View,TextInput,TouchableOpacity,FlatList,ActivityIndicator,Keyboard,ScrollView,Alert} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { planTrip } from '../services/tripPlannerService';
import { fetchLocationSuggestions } from '../services/locationUtils';
import RouteCard from '../components/RouteCard';

const FAV_ROUTES_KEY = '@favourite_routes_list';
const REFRESH_INTERVAL_MS = 10000; // Refreshes active route every 10 seconds

export default function CommuteScreen() {
  const [startQuery, setStartQuery] = useState('BIDADARI PARK DRIVE');
  const [startCoords, setStartCoords] = useState(null);
  const [startSuggestions, setStartSuggestions] = useState([]);

  const [destQuery, setDestQuery] = useState('CHANGI AIRPORT BUS TERMINAL 1');
  const [destCoords, setDestCoords] = useState(null);
  const [destSuggestions, setDestSuggestions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);

  // Saved favorite routes list
  const [savedRoutes, setSavedRoutes] = useState([]);
  // Currently active favorite route ID being monitored
  const [activeRouteId, setActiveRouteId] = useState(null);

  const timerRef = useRef(null);

  // Load saved routes list from AsyncStorage on mount
  useEffect(() => {
    loadSavedRoutes();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Refresh interval loop for active route
  useEffect(() => {
    const activeRoute = savedRoutes.find((r) => r.id === activeRouteId);

    if (activeRoute) {
      if (timerRef.current) clearInterval(timerRef.current);

      // Refresh route periodically in background
      timerRef.current = setInterval(() => {
        refreshActiveRouteSilently(activeRoute);
      }, REFRESH_INTERVAL_MS);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [activeRouteId, savedRoutes]);

  // Read saved routes list from local storage
  const loadSavedRoutes = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAV_ROUTES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedRoutes(parsed);
      }
    } catch (err) {
      console.error('Failed to load saved routes:', err);
    }
  };

  // Background silent refresh helper (doesn't trigger big full-screen loading spinner)
  const refreshActiveRouteSilently = async (favData) => {
    try {
      const startLoc = favData.startCoords || favData.startName;
      const destLoc = favData.destCoords || favData.destName;
      const result = await planTrip(startLoc, destLoc, 'drive');
      setRouteInfo(result);
    } catch (err) {
      console.error('Error auto-refreshing active route segment status:', err);
    }
  };

  const handleStartChange = async (text) => {
    setStartQuery(text);
    setStartCoords(null);
    if (text.trim().length > 2) {
      const suggestions = await fetchLocationSuggestions(text);
      setStartSuggestions(suggestions);
    } else {
      setStartSuggestions([]);
    }
  };

  const handleDestChange = async (text) => {
    setDestQuery(text);
    setDestCoords(null);
    if (text.trim().length > 2) {
      const suggestions = await fetchLocationSuggestions(text);
      setDestSuggestions(suggestions);
    } else {
      setDestSuggestions([]);
    }
  };

  // Manual route planning trigger from input forms
  const handlePlanRoute = async () => {
    Keyboard.dismiss();
    setErrorMsg('');
    setRouteInfo(null);

    if (!startQuery.trim() || !destQuery.trim()) {
      setErrorMsg('Please enter both a starting point and destination.');
      return;
    }

    setLoading(true);
    try {
      const startLoc = startCoords || startQuery;
      const destLoc = destCoords || destQuery;
      const result = await planTrip(startLoc, destLoc, 'drive');
      setRouteInfo(result);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to find route. Please check location names.');
    } finally {
      setLoading(false);
    }
  };

  // Save current query/coords as new item in favorite array
  const handleSaveFavourite = async () => {
    if (!startQuery.trim() || !destQuery.trim()) {
      Alert.alert('Save Failed', 'Please enter valid locations before saving.');
      return;
    }

    const newRoute = {
      id: Date.now().toString(),
      startName: startQuery,
      startCoords: startCoords,
      destName: destQuery,
      destCoords: destCoords,
    };

    const updatedRoutes = [...savedRoutes, newRoute];

    try {
      await AsyncStorage.setItem(FAV_ROUTES_KEY, JSON.stringify(updatedRoutes));
      setSavedRoutes(updatedRoutes);
      // Automatically make newly saved route active and fetch segments
      handleSelectRoute(newRoute);
      Alert.alert('Saved!', 'Route added to favorites.');
    } catch (err) {
      console.error('Error saving favorite route:', err);
      Alert.alert('Error', 'Failed to save favorite route.');
    }
  };

  // Selective route deletion
  const handleDeleteRoute = async (idToDelete) => {
    const updatedRoutes = savedRoutes.filter((route) => route.id !== idToDelete);

    try {
      await AsyncStorage.setItem(FAV_ROUTES_KEY, JSON.stringify(updatedRoutes));
      setSavedRoutes(updatedRoutes);

      // Reset routeInfo if active route was deleted
      if (activeRouteId === idToDelete) {
        setActiveRouteId(null);
        setRouteInfo(null);
      }
      Alert.alert('Deleted', 'Selected route removed from favorites.');
    } catch (err) {
      console.error('Error deleting favorite route:', err);
      Alert.alert('Error', 'Failed to delete selected route.');
    }
  };

  // Handles selecting a favorite card, immediately updating state AND segment route statuses
  const handleSelectRoute = async (route) => {
    Keyboard.dismiss();
    setErrorMsg('');
    setLoading(true);

    // Update input fields
    setStartQuery(route.startName);
    setStartCoords(route.startCoords);
    setDestQuery(route.destName);
    setDestCoords(route.destCoords);
    
    // Set active ID to trigger background interval loop
    setActiveRouteId(route.id);

    // Explicitly recalculate trip to refresh Segment Route Statuses immediately
    try {
      const startLoc = route.startCoords || route.startName;
      const destLoc = route.destCoords || route.destName;
      const result = await planTrip(startLoc, destLoc, 'drive');
      setRouteInfo(result);
    } catch (err) {
      setErrorMsg('Failed to update segment statuses for selected route.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.headerTitle}>Route Planner</Text>

        <View style={styles.card}>
          {/* Start Point Input */}
          <Text style={styles.label}>Starting Point</Text>
          <TextInput
            style={styles.input}
            value={startQuery}
            onChangeText={handleStartChange}
            placeholder="e.g. Bidadari Park Drive"
          />
          {startSuggestions.length > 0 && (
            <View style={styles.suggestionBox}>
              <FlatList
                data={startSuggestions}
                keyExtractor={(item, idx) => item.id || String(idx)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => {
                      setStartQuery(item.title);
                      setStartCoords({ lat: item.lat, lng: item.lng, name: item.title });
                      setStartSuggestions([]);
                    }}
                  >
                    <Text style={styles.suggestionTitle}>{item.title}</Text>
                    <Text style={styles.suggestionSub}>{item.address}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Destination Input */}
          <Text style={[styles.label, { marginTop: 12 }]}>Destination</Text>
          <TextInput
            style={styles.input}
            value={destQuery}
            onChangeText={handleDestChange}
            placeholder="e.g. Changi Airport"
          />
          {destSuggestions.length > 0 && (
            <View style={styles.suggestionBox}>
              <FlatList
                data={destSuggestions}
                keyExtractor={(item, idx) => item.id || String(idx)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => {
                      setDestQuery(item.title);
                      setDestCoords({ lat: item.lat, lng: item.lng, name: item.title });
                      setDestSuggestions([]);
                    }}
                  >
                    <Text style={styles.suggestionTitle}>{item.title}</Text>
                    <Text style={styles.suggestionSub}>{item.address}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          {/* Action Buttons */}
          <TouchableOpacity style={styles.button} onPress={handlePlanRoute} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Plan Route</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveFavButton} onPress={handleSaveFavourite}>
            <Text style={styles.saveFavText}>+ Save as Favorite Route</Text>
          </TouchableOpacity>
        </View>

        {/* Saved Favorites Section */}
        {savedRoutes.length > 0 && (
          <View style={styles.favoritesSection}>
            <Text style={styles.sectionHeader}>Saved Favorite Routes</Text>
            {savedRoutes.map((route) => {
              const isActive = route.id === activeRouteId;
              return (
                <View
                  key={route.id}
                  style={[styles.favCard, isActive && styles.activeFavCard]}
                >
                  <TouchableOpacity
                    style={styles.favInfo}
                    onPress={() => handleSelectRoute(route)}
                  >
                    <Text style={styles.favTitle}>
                      {route.startName} ➔ {route.destName}
                    </Text>
                    <Text style={styles.favSubText}>
                      {isActive ? '● Active (Auto-refreshing live)' : 'Tap to view route'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteRoute(route.id)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Dynamic Route & Segment Status Card */}
        {routeInfo && <RouteCard data={routeInfo} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  headerTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginVertical: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { backgroundColor: '#f0f2f5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  suggestionBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e4e8', borderRadius: 8, maxHeight: 140, marginTop: 4 },
  suggestionItem: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestionTitle: { fontSize: 13, fontWeight: '600', color: '#222' },
  suggestionSub: { fontSize: 11, color: '#666' },
  errorText: { color: '#d93025', fontSize: 13, marginTop: 10 },
  button: { backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 12, marginTop: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  saveFavButton: { marginTop: 10, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#007AFF', alignItems: 'center', backgroundColor: '#f0f4ff' },
  saveFavText: { color: '#007AFF', fontWeight: '600', fontSize: 13 },
  favoritesSection: { marginHorizontal: 16, marginTop: 20 },
  sectionHeader: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10 },
  favCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#ccc' },
  activeFavCard: { borderLeftColor: '#34c759', backgroundColor: '#f6fff8' },
  favInfo: { flex: 1, marginRight: 10 },
  favTitle: { fontSize: 13, fontWeight: '600', color: '#222' },
  favSubText: { fontSize: 11, color: '#666', marginTop: 2 },
  deleteButton: { backgroundColor: '#fff0f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#d93025' },
  deleteText: { color: '#d93025', fontSize: 12, fontWeight: '600' },
});
