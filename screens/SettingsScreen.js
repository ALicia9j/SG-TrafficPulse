import React, { useState, useEffect } from 'react';
import {StyleSheet,Text,View,TouchableOpacity,Switch,ScrollView,Alert,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMapTheme } from '../context/MapContext';
import {registerForPushNotificationsAsync, sendTrafficAlert,} from '../services/notificationService';
import LegalModal from '../components/LegalModal';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '../context/legalText';

export default function SettingsScreen() {
  const { mapType, setMapType } = useMapTheme();
  const [cacheSize, setCacheSize] = useState('0.0 MB');
  const [realTimeIncident, setRealTimeIncident] = useState(true);
  const [heavyCongestion, setHeavyCongestion] = useState(true);

  // Legal Modal State
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalTitle, setLegalTitle] = useState('');
  const [legalContent, setLegalContent] = useState('');

  // Calculate stored cache size and load notification preferences on screen load
  useEffect(() => {
    calculateCacheSize();
    loadSettings();
  }, []);

  const calculateCacheSize = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      let totalBytes = 0;

      stores.forEach(([key, value]) => {
        if (value) {
          totalBytes += key.length + value.length;
        }
      });

      // Convert bytes to Megabytes (MB)
      const sizeInMB = (totalBytes / (1024 * 1024)).toFixed(1);
      setCacheSize(`${sizeInMB} MB`);
    } catch (error) {
      console.error('Error measuring cache size:', error);
      setCacheSize('0.0 MB');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Offline Cache',
      'Are you sure you want to clear cached routes and offline search data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage memory keys
              await AsyncStorage.clear();
              setCacheSize('0.0 MB');
              Alert.alert('Success', 'Cache cleared successfully.');
            } catch (error) {
              console.error('Failed to clear cache:', error);
              Alert.alert('Error', 'Failed to clear application cache.');
            }
          },
        },
      ]
    );
  };

  // Load saved toggle settings from AsyncStorage
  const loadSettings = async () => {
    try {
      const incPref = await AsyncStorage.getItem('@pref_incidents');
      const congPref = await AsyncStorage.getItem('@pref_congestion');

      if (incPref !== null) setRealTimeIncident(JSON.parse(incPref));
      if (congPref !== null) setHeavyCongestion(JSON.parse(congPref));
    } catch (e) {
      console.error('Failed to load notification settings:', e);
    }
  };

  // Toggle Real Time Incidents
  const handleToggleIncidents = async (value) => {
    if (value) {
      const granted = await registerForPushNotificationsAsync();
      if (!granted) return;
    }
    setRealTimeIncident(value);
    await AsyncStorage.setItem('@pref_incidents', JSON.stringify(value));
  };

  // Toggle Heavy Congestion
  const handleToggleCongestion = async (value) => {
    if (value) {
      const granted = await registerForPushNotificationsAsync();
      if (!granted) return;
    }
    setHeavyCongestion(value);
    await AsyncStorage.setItem('@pref_congestion', JSON.stringify(value));
  };

  // Test Notification Handler
  const handleTestNotification = async () => {
    const granted = await registerForPushNotificationsAsync();
    if (granted) {
      await sendTrafficAlert(
        '💥 Traffic Incident Ahead',
        'Accident reported on PIE (towards Changi) after Kallang Bahru exit.'
      );
    }
  };

  // Helper to trigger legal modal
  const openLegalDocument = (title, content) => {
    setLegalTitle(title);
    setLegalContent(content);
    setLegalModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>Map Preferences</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Map View:</Text>
          <View style={styles.mapSelector}>
            {['Standard', 'Satellite', 'Dark'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  mapType === type && styles.chipActive,
                ]}
                onPress={() => setMapType(type)}
              >
                <Text
                  style={[
                    styles.chipText,
                    mapType === type && styles.chipTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.listRow} onPress={handleClearCache}>
          <Text style={styles.rowTitle}>Clear Offline Cache</Text>
          <Text style={styles.rowValue}>{cacheSize}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Notifications</Text>
        <View style={styles.listRow}>
          <Text style={styles.rowTitle}>Real Time Incident Report</Text>
          <Switch
            value={realTimeIncident}
            onValueChange={handleToggleIncidents}
            trackColor={{ false: '#d0d0d0', true: '#007AFF' }}
            thumbColor="#ffffff"
          />
        </View>
        <View style={styles.listRow}>
          <Text style={styles.rowTitle}>Heavy Congestion Notifications</Text>
          <Switch
            value={heavyCongestion}
            onValueChange={handleToggleCongestion}
            trackColor={{ false: '#d0d0d0', true: '#007AFF' }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Test Notification Action */}
        <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
          <Text style={styles.testButtonText}>🔔 Test Live Notification</Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Legal & About</Text>
        <TouchableOpacity
          style={styles.listRow}
          onPress={() => openLegalDocument('Terms Of Service', TERMS_OF_SERVICE)}
        >
          <Text style={styles.rowTitle}>Terms Of Service</Text>
          <Text style={styles.arrow}>▶</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listRow}
          onPress={() => openLegalDocument('Privacy Policy', PRIVACY_POLICY)}
        >
          <Text style={styles.rowTitle}>Privacy Policy</Text>
          <Text style={styles.arrow}>▶</Text>
        </TouchableOpacity>

        <View style={styles.listRowNoBorder}>
          <Text style={styles.rowTitle}>App Version</Text>
          <Text style={styles.versionText}>v 1.5.0</Text>
        </View>
      </ScrollView>

      {/* Legal Document Viewer Modal */}
      <LegalModal
        visible={legalModalVisible}
        title={legalTitle}
        content={legalContent}
        onClose={() => setLegalModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#000000', marginTop: 24, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  label: { fontSize: 15, fontWeight: '600', color: '#000000' },
  mapSelector: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: '#e5e5e5', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16 },
  chipActive: { backgroundColor: '#007AFF' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#000000' },
  chipTextActive: { fontWeight: '700', color: '#ffffff' },
  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  listRowNoBorder: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: '#000000' },
  rowValue: { fontSize: 14, color: '#666666', fontWeight: '500' },
  arrow: { fontSize: 12, color: '#000000' },
  versionText: { fontSize: 14, color: '#888888' },
  testButton: {
    marginTop: 16,
    backgroundColor: '#f0f4ff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  testButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
