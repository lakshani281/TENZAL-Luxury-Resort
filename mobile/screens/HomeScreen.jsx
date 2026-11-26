import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation from '../components/BottomNavigation';

export default function HomeScreen({
  isLoggedIn = false,
  authUser = null,
  onTabPress,
  onOpenFoodMenu,
  onOpenExplore,
  onOpenPlan,
  onOpenRooms,
  onOpenLogin,
}) {
  const guestName = authUser?.name ? authUser.name.split(' ')[0] : 'Guest';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F4" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>TENZAL LUXURY RESORT</Text>
            <Text style={styles.heading}>
              {isLoggedIn ? `Welcome back, ${guestName}` : 'Highland Sanctuary'}
            </Text>
            <Text style={styles.subtitle}>
              Haputale, Sri Lanka · Curated stays, dining & experiences
            </Text>
          </View>
          {!isLoggedIn && (
            <TouchableOpacity
              style={styles.signInPill}
              activeOpacity={0.8}
              onPress={onOpenLogin}
            >
              <Text style={styles.signInPillText}>Sign in</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Primary Entry Point: In-Room Dining / Food Ordering */}
        <TouchableOpacity
          style={styles.featuredCard}
          activeOpacity={0.88}
          onPress={onOpenFoodMenu}
        >
          <View style={styles.featuredBadge}>
            <Ionicons name="restaurant-outline" size={14} color="#347F8C" />
            <Text style={styles.featuredBadgeText}>IN-ROOM DINING</Text>
          </View>
          <Text style={styles.featuredTitle}>Order from the TENZAL Kitchen</Text>
          <Text style={styles.featuredDesc}>
            Explore daily chef specials, highland cuisine, and beverages delivered directly to your room.
          </Text>
          <View style={styles.featuredAction}>
            <Text style={styles.featuredActionText}>Open Food Menu</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Quick Navigation Grid */}
        <Text style={styles.sectionTitle}>Explore the Resort</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.85}
            onPress={onOpenRooms}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="bed-outline" size={22} color="#347F8C" />
            </View>
            <Text style={styles.cardTitle}>Rooms & Suites</Text>
            <Text style={styles.cardDesc}>Browse highland & ocean view rooms</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.85}
            onPress={onOpenExplore}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="compass-outline" size={22} color="#347F8C" />
            </View>
            <Text style={styles.cardTitle}>Around Haputale</Text>
            <Text style={styles.cardDesc}>Waterfalls, tea estates & viewpoints</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.85}
            onPress={onOpenPlan}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={22} color="#347F8C" />
            </View>
            <Text style={styles.cardTitle}>Plan My Day</Text>
            <Text style={styles.cardDesc}>Build a personalized day itinerary</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.85}
            onPress={onOpenFoodMenu}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="cafe-outline" size={22} color="#347F8C" />
            </View>
            <Text style={styles.cardTitle}>Food & Drinks</Text>
            <Text style={styles.cardDesc}>View full menu & track orders</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavigation activeTab="Home" onTabPress={onTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F4',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  brand: {
    color: '#347F8C',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#263B39',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: {
    color: '#898780',
    fontSize: 12,
    marginTop: 4,
  },
  signInPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE8E0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  signInPillText: {
    color: '#347F8C',
    fontSize: 12,
    fontWeight: '700',
  },
  featuredCard: {
    backgroundColor: '#263B39',
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EDF2ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  featuredBadgeText: {
    color: '#347F8C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 6,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 8,
  },
  featuredDesc: {
    color: '#D4DCD9',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  featuredAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#347F8C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  featuredActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263B39',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE8E0',
    borderRadius: 15,
    padding: 15,
    marginBottom: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF2ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#263B39',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: '#77766F',
    lineHeight: 16,
  },
});
