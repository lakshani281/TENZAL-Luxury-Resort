import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SavedPlansScreen({
  navigation,
  onBack,
  onSelectPlan,
  savedPlans,
}) {
  // Default saved plan matching the Figma design
  const plansList = savedPlans && savedPlans.length > 0
    ? savedPlans
    : [
        {
          id: '1',
          status: 'Saved',
          duration: 'Full day',
          title: 'Haputale discovery',
          details: 'Nature + Food · Tuk-Tuk',
        },
      ];

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={18} color="#2D3748" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Saved plans</Text>
            <Text style={styles.headerSubtitle}>Your Haputale itineraries</Text>
          </View>
        </View>

        {/* Saved Plans List */}
        {plansList.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={styles.planCard}
            activeOpacity={0.85}
            onPress={() => {
              if (onSelectPlan) {
                onSelectPlan(plan);
              } else if (navigation && navigation.navigate) {
                navigation.navigate('Summary');
              }
            }}
          >
            {/* Card Top Row: Badge + Duration */}
            <View style={styles.cardTopRow}>
              <View style={styles.savedBadge}>
                <Text style={styles.savedBadgeText}>{plan.status}</Text>
              </View>
              <Text style={styles.durationText}>{plan.duration}</Text>
            </View>

            {/* Plan Title */}
            <Text style={styles.planTitle}>{plan.title}</Text>

            {/* Plan Subtitle / Tags */}
            <Text style={styles.planDetails}>{plan.details}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 14,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#183642',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  savedBadge: {
    backgroundColor: '#DCEEF3',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  savedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#357285',
  },
  durationText: {
    fontSize: 12,
    color: '#718096',
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#183642',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 6,
  },
  planDetails: {
    fontSize: 12.5,
    color: '#718096',
  },
});