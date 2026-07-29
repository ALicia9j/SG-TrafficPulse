import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { planTrip } from '../services/tripPlannerService';
import { fetchLocationSuggestions } from '../services/locationUtils';
import RouteCard from '../components/RouteCard';

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

  // Dynamic search handler for Starting Point
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

  // Dynamic search handler for Destination
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.headerTitle}>Route Planner</Text>

        <View style={styles.card}>
          {/* Starting Point */}
          <Text style={styles.label}>Starting Point</Text>
          <TextInput
            style={styles.input}
            value={startQuery}
            onChangeText={handleStartChange}
            placeholder="e.g. Bidadari Park"
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

          {/* Destination Point */}
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

          {/* Error Message */}
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handlePlanRoute}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Plan Route</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Dynamic Route Card Component */}
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
});