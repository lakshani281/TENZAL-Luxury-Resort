import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PlanSavedScreen({
  navigation,
  onViewItinerary,
  onBackToHome,
}) {
  const handleViewItinerary = () => {
    if (onViewItinerary) {
      onViewItinerary();
    } else if (navigation && navigation.navigate) {
      navigation.navigate('Summary');
    }
  };

  const handleBackToHome = () => {
    if (onBackToHome) {
      onBackToHome();
    } else if (navigation && navigation.navigate) {
      navigation.navigate('Home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      <View style={styles.contentWrapper}>
        {/* Checkmark Circle Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={30} color="#357285" />
        </View>

        {/* Status Tag */}
        <Text style={styles.statusTag}>PLAN SAVED</Text>

        {/* Main Heading */}
        <Text style={styles.title}>{'Your perfect day\nis ready'}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Find it anytime in Saved Plans from your profile.
        </Text>

        {/* Primary Button: View itinerary */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={handleViewItinerary}
        >
          <Text style={styles.primaryButtonText}>View itinerary</Text>
        </TouchableOpacity>

        {/* Secondary Text Link: Back to home */}
        <TouchableOpacity
          style={styles.secondaryLinkButton}
          activeOpacity={0.7}
          onPress={handleBackToHome}
        >
          <Text style={styles.secondaryLinkText}>Back to home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCEEF3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: '#357285',
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#183642',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#357285',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryLinkButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  secondaryLinkText: {
    color: '#357285',
    fontSize: 13.5,
    fontWeight: '600',
  },
});