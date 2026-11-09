import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PlanMyDaySummaryScreen({ navigation, onBack, onEdit, onRegenerate, onSave }) {
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
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
            <Text style={styles.headerTitle}>Your perfect day</Text>
            <Text style={styles.headerSubtitle}>Full Day · Nature + Food</Text>
          </View>
        </View>

        {/* Hero Card with Weather */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTag}>YOUR PLAN</Text>
            <View style={styles.tempContainer}>
              <Text style={styles.tempText}>24</Text>
              <Text style={styles.degreeSymbol}>°</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Haputale discovery</Text>
          <Text style={styles.heroDetails}>2 stops · Tuk-Tuk · 2 people</Text>
        </View>

        {/* Timeline Itinerary Section */}
        <View style={styles.timelineContainer}>
          
          {/* Timeline Item 1 */}
          <View style={styles.timelineRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeText}>8:30 AM</Text>
              <View style={styles.badgeNumberCircle}>
                <Text style={styles.badgeNumberText}>1</Text>
              </View>
              {/* Dotted Connecting Line */}
              <View style={styles.dashedLine} />
            </View>

            <View style={styles.stopCard}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1546843905-bf2f476ca46d?q=80&w=600&auto=format&fit=crop' }}
                style={styles.stopImage}
                resizeMode="cover"
              />
              <View style={styles.stopInfo}>
                <Text style={styles.stopCategory}>Nature · approx. 31 min</Text>
                <Text style={styles.stopTitle}>Lipton's Seat</Text>
                <View style={styles.costRow}>
                  <Ionicons name="map-outline" size={14} color="#718096" />
                  <Text style={styles.costText}>Demo estimate · LKR 1,500</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Timeline Item 2 */}
          <View style={styles.timelineRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeText}>10:30 AM</Text>
              <View style={styles.badgeNumberCircle}>
                <Text style={styles.badgeNumberText}>2</Text>
              </View>
            </View>

            <View style={styles.stopCard}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=600&auto=format&fit=crop' }}
                style={styles.stopImage}
                resizeMode="cover"
              />
              <View style={styles.stopInfo}>
                <Text style={styles.stopCategory}>Nature · approx. 37 min</Text>
                <Text style={styles.stopTitle}>Bambarakanda Falls</Text>
                <View style={styles.costRow}>
                  <Ionicons name="map-outline" size={14} color="#718096" />
                  <Text style={styles.costText}>Demo estimate · LKR 2,000</Text>
                </View>
              </View>
            </View>
          </View>

        </View>

        {/* Route Preview Box */}
        <View style={styles.routeCard}>
          <TouchableOpacity style={styles.routeButton} activeOpacity={0.8}>
            <Ionicons name="map-outline" size={18} color="#2D3748" />
            <Text style={styles.routeButtonText}>Day route preview</Text>
          </TouchableOpacity>
        </View>

        {/* Budget & Plan Info Box */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Budget target</Text>
            <Text style={styles.infoValue}>Within LKR 25,000</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 8 }]}>
            <Text style={styles.infoLabel}>Plan basis</Text>
            <Text style={styles.infoValue}>Tuk-Tuk · 2 people</Text>
          </View>
        </View>

        {/* Action Buttons Row 1 */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            activeOpacity={0.7}
            onPress={onEdit}
          >
            <Text style={styles.secondaryButtonText}>Edit Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            activeOpacity={0.7}
            onPress={onRegenerate}
          >
            <Text style={styles.secondaryButtonText}>Regenerate Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons Row 2 */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.85}
            onPress={onSave}
          >
            <Text style={styles.primaryButtonText}>Save Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.textLinkButton} activeOpacity={0.7}>
            <Text style={styles.textLinkText}>View Saved Plans</Text>
          </TouchableOpacity>
        </View>

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
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A365D',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: '#357285',
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTag: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tempText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  degreeSymbol: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 10,
  },
  heroDetails: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginTop: 6,
  },
  timelineContainer: {
    marginBottom: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeColumn: {
    width: 70,
    alignItems: 'center',
    paddingTop: 4,
    position: 'relative',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
  },
  badgeNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F7D6C8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeNumberText: {
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: 'bold',
    color: '#A05A42',
  },
  dashedLine: {
    position: 'absolute',
    top: 52,
    bottom: -20,
    width: 1,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderStyle: 'dashed',
  },
  stopCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  stopImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 14,
  },
  stopInfo: {
    flex: 1,
  },
  stopCategory: {
    fontSize: 11,
    color: '#A0AEC0',
    marginBottom: 4,
  },
  stopTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A365D',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 6,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costText: {
    fontSize: 11,
    color: '#718096',
    marginLeft: 4,
  },
  routeCard: {
    height: 110,
    backgroundColor: '#E4F0F5',
    borderRadius: 18,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  routeButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  routeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 6,
  },
  infoCard: {
    backgroundColor: '#F7EFE5',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#718096',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D3748',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  primaryButton: {
    flex: 0.48,
    backgroundColor: '#357285',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  textLinkButton: {
    flex: 0.48,
    paddingVertical: 14,
    alignItems: 'center',
  },
  textLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#357285',
  },
});