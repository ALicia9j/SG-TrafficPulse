import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function RouteCard({ data }) {
  if (!data) return null;

  return (
    <View style={styles.cardContainer}>
      {/* Header Title with Pin Icon */}
      <View style={styles.headerRow}>
        <Text style={styles.pinIcon}>📍</Text>
        <Text style={styles.titleText}>{data.title}</Text>
      </View>

      <View style={styles.divider} />

      {/* Time & Traffic Status Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoBadge}>
          <Text style={styles.icon}>🕒</Text>
          <Text style={styles.infoText}>
            Est. Time: <Text style={styles.boldText}>{data.estimatedTime}</Text>
          </Text>
        </View>

        <View style={styles.infoBadge}>
          <Text style={styles.icon}>🚦</Text>
          <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
            Status: <Text style={styles.boldText}>{data.status}</Text>
          </Text>
        </View>
      </View>

      {/* Car Park Lots Row */}
      <View style={styles.row}>
        <Text style={styles.icon}>🅿️</Text>
        <Text style={styles.infoText}>
          Available Car park Lots: <Text style={styles.boldText}>{data.availableLots}</Text>
        </Text>
      </View>

      {/* Segment Route Statuses */}
      <View style={styles.sectionContainer}>
        {data.routeStatuses?.map((item, index) => {
          // Clean up double arrows if present in the string
          const formattedTo = item.to ? item.to.replace(/^(\s*→\s*)+/, ' → ') : '';

          return (
            <View key={index} style={styles.segmentRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: item.type === 'heavy' ? '#e53935' : '#4caf50' },
                ]}
              />
              <Text style={styles.segmentText}>
                {item.from}
                {formattedTo}: <Text style={styles.boldText}>{item.label}</Text>
              </Text>
            </View>
          );
        })}
      </View>

      {/* Traffic Incidents Section */}
      <View style={styles.incidentRow}>
        <Text style={styles.icon}>⚠️</Text>
        <View style={styles.flexShrink}>
          {data.incidents?.map((incident, idx) => (
            <Text key={idx} style={styles.incidentText}>
              {incident}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffff', // Clean white background for good contrast
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 12,
    // Modern elevation shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pinIcon: {
    fontSize: 18,
    marginRight: 5,
    marginTop: 2,
  },
  titleText: {
    flex: 1, // Fixes horizontal overflow by wrapping long titles
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 7,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 11,
    color: '#444444',
    flexShrink: 1,
  },
  boldText: {
    fontWeight: '700',
    color: '#111111',
  },
  sectionContainer: {
    marginVertical: 6,
    gap: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 10,
  },
  segmentText: {
    flex: 1, // Crucial to prevent route step text from clipping off-screen
    fontSize: 12,
    color: '#333333',
    lineHeight: 18,
  },
  incidentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  flexShrink: {
    flex: 1,
  },
  incidentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
    lineHeight: 18,
  },
});