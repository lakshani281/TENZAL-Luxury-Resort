
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';

export default function DestinationDetailsScreen({
  destination,
  onBack,
}) {
  if (!destination) {
    return (
      <View style={styles.container}>
        <Text>Destination not found.</Text>
      </View>
    );
  }

  const openDirections = async () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Unable to open Google Maps.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <ImageBackground
          source={{ uri: destination.image }}
          style={styles.coverImage}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.imageOverlay} />

          <View style={styles.coverContent}>
            <Text style={styles.category}>
              {destination.category}
            </Text>

            <Text style={styles.title}>
              {destination.name}
            </Text>
          </View>
        </ImageBackground>

        {/* Details */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>
            About this place
          </Text>

          <Text style={styles.description}>
            {destination.description}
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📍</Text>
              <View>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>
                  {destination.location}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🚗</Text>
              <View>
                <Text style={styles.infoLabel}>Distance from TENZAL</Text>
                <Text style={styles.infoValue}>
                  {destination.distance}
                </Text>
              </View>
            </View>
          </View>

          {/* Map Preview Placeholder */}
          <Text style={styles.sectionTitle}>
            Location
          </Text>

          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapIcon}>📍</Text>
            <Text style={styles.mapText}>
              {destination.name}
            </Text>
            <Text style={styles.mapSubtext}>
              {destination.latitude}, {destination.longitude}
            </Text>
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>
              Plan before you go
            </Text>
            <Text style={styles.noticeText}>
              Check weather conditions and travel arrangements
              before visiting this destination.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Directions Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.directionsButton}
          onPress={openDirections}
        >
          <Text style={styles.directionsText}>
            Get Directions  →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F4',
  },
  coverImage: {
    height: 340,
    justifyContent: 'flex-end',
    backgroundColor: '#D9DED9',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  backButton: {
    position: 'absolute',
    top: 55,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  backText: {
    fontSize: 30,
    color: '#263B39',
    marginTop: -4,
  },
  coverContent: {
    padding: 23,
    zIndex: 1,
  },
  category: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  content: {
    padding: 21,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#263B39',
    fontFamily: 'serif',
    marginBottom: 12,
    marginTop: 12,
  },
  description: {
    color: '#77766F',
    fontSize: 14,
    lineHeight: 23,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 17,
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#ECEAE3',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  infoIcon: {
    fontSize: 23,
    marginRight: 14,
  },
  infoLabel: {
    color: '#99958E',
    fontSize: 11,
    marginBottom: 4,
  },
  infoValue: {
    color: '#263B39',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECEAE3',
    marginVertical: 8,
  },
  mapPlaceholder: {
    height: 140,
    backgroundColor: '#E8EDE7',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapIcon: {
    fontSize: 28,
  },
  mapText: {
    color: '#263B39',
    fontWeight: 'bold',
    marginTop: 5,
  },
  mapSubtext: {
    color: '#77766F',
    fontSize: 10,
    marginTop: 4,
  },
  notice: {
    backgroundColor: '#EDF2ED',
    borderRadius: 13,
    padding: 16,
    marginTop: 20,
  },
  noticeTitle: {
    color: '#347F8C',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 7,
  },
  noticeText: {
    color: '#68736D',
    fontSize: 12,
    lineHeight: 19,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAE8E0',
  },
  directionsButton: {
    backgroundColor: '#347F8C',
    borderRadius: 13,
    paddingVertical: 16,
    alignItems: 'center',
  },
  directionsText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
