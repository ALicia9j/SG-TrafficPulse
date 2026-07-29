import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
// 1. Use safe-area-context to avoid deprecation warnings
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useMapTheme } from '../context/MapContext';
import { fetchTrafficIncidents } from '../services/ltaApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendTrafficAlert } from '../services/notificationService';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
];

export default function HomeScreen() {
  const { mapType } = useMapTheme();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await fetchTrafficIncidents();
      setIncidents(data);

      // 2. Notification logic safely inside loadIncidents()
      const isIncidentNotifEnabled = await AsyncStorage.getItem('@pref_incidents');
      if (JSON.parse(isIncidentNotifEnabled) && data.length > 0) {
        const latestIncident = data[0];
        await sendTrafficAlert(
          `Alert: ${latestIncident.Type}`,
          latestIncident.Message
        );
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMapProps = () => {
    switch (mapType) {
      case 'Satellite':
        return { mapType: 'satellite', userInterfaceStyle: 'light', customMapStyle: [] };
      case 'Dark':
        return { mapType: 'standard', userInterfaceStyle: 'dark', customMapStyle: darkMapStyle };
      case 'Standard':
      default:
        return { mapType: 'standard', userInterfaceStyle: 'light', customMapStyle: [] };
    }
  };

  const getIncidentIcon = (type = '') => {
    switch (type) {
      case 'Accident': return '💥';
      case 'Roadworks': return '🚧';
      case 'Vehicle Breakdown': return '🚗';
      default: return '⚠️';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.loadingBanner}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading Live Incidents...</Text>
        </View>
      )}

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 1.3521,
          longitude: 103.8198,
          latitudeDelta: 0.25,
          longitudeDelta: 0.25,
        }}
        {...getMapProps()}
      >
        {incidents.map((inc) => (
          <Marker
            key={inc.id}
            coordinate={{ latitude: inc.Latitude, longitude: inc.Longitude }}
            onPress={() => setSelectedIncident(inc)}
            tracksViewChanges={false}
          >
            <View style={styles.pinBubble}>
              <Text style={styles.pinEmoji}>{getIncidentIcon(inc.Type)}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity style={styles.refreshButton} onPress={loadIncidents}>
        <Text style={styles.refreshIcon}>🔄</Text>
      </TouchableOpacity>

      <Modal
        visible={!!selectedIncident}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedIncident(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedIncident(null)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalEmoji}>{getIncidentIcon(selectedIncident?.Type)}</Text>
              <Text style={styles.modalTitle}>{selectedIncident?.Type || 'Traffic Incident'}</Text>
            </View>
            <Text style={styles.modalMessage}>{selectedIncident?.Message}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedIncident(null)}>
              <Text style={styles.closeButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { width: '100%', height: '100%' },
  loadingBanner: {
    position: 'absolute', top: 12, alignSelf: 'center', zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  loadingText: { fontSize: 13, fontWeight: '600', color: '#333' },
  pinBubble: {
    backgroundColor: '#ffffff', borderRadius: 18, padding: 6,
    borderWidth: 1.5, borderColor: '#e53935', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5,
  },
  pinEmoji: { fontSize: 18 },
  refreshButton: {
    position: 'absolute', bottom: 24, right: 20, backgroundColor: '#ffffff',
    width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  refreshIcon: { fontSize: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 34 },
  modalHandle: { width: 36, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  modalEmoji: { fontSize: 22 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  modalMessage: { fontSize: 14, color: '#444', lineHeight: 20, marginVertical: 10 },
  closeButton: { marginTop: 12, backgroundColor: '#f0f2f5', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  closeButtonText: { fontSize: 15, fontWeight: '600', color: '#007AFF' },
});