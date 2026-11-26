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

export default function ProfileScreen({
  isLoggedIn = false,
  authUser = null,
  onTabPress,
  onSignIn,
  onCreateAccount,
  onSignOut,
  onOpenSavedPlans,
  onOpenFoodMenu,
}) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F4" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>TENZAL</Text>
          <Text style={styles.heading}>Guest Profile</Text>
        </View>

        {isLoggedIn && authUser ? (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={26} color="#347F8C" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{authUser.name || 'Resort Guest'}</Text>
              <Text style={styles.profileEmail}>{authUser.email || ''}</Text>
              {authUser.role ? (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{String(authUser.role).toUpperCase()}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <Text style={styles.guestTitle}>Sign in to your TENZAL account</Text>
            <Text style={styles.guestDesc}>
              Access your saved itineraries, in-room dining order history, and authenticated resort features.
            </Text>
            <View style={styles.authButtonsRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.85}
                onPress={onSignIn}
              >
                <Text style={styles.primaryBtnText}>Sign in</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.85}
                onPress={onCreateAccount}
              >
                <Text style={styles.secondaryBtnText}>Create account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.75}
            onPress={onOpenFoodMenu}
          >
            <Ionicons name="restaurant-outline" size={20} color="#347F8C" />
            <Text style={styles.menuRowText}>In-Room Dining & Orders</Text>
            <Ionicons name="chevron-forward" size={18} color="#99958E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.75}
            onPress={onOpenSavedPlans}
          >
            <Ionicons name="map-outline" size={20} color="#347F8C" />
            <Text style={styles.menuRowText}>Saved Day Plans</Text>
            <Ionicons name="chevron-forward" size={18} color="#99958E" />
          </TouchableOpacity>
        </View>

        {isLoggedIn && (
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.85}
            onPress={onSignOut}
          >
            <Ionicons name="log-out-outline" size={18} color="#C53030" />
            <Text style={styles.logoutBtnText}>Sign out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <BottomNavigation activeTab="Profile" onTabPress={onTabPress} />
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
    marginBottom: 20,
  },
  brand: {
    color: '#347F8C',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#263B39',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE8E0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EDF2ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#263B39',
  },
  profileEmail: {
    fontSize: 13,
    color: '#77766F',
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDF2ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#347F8C',
  },
  guestCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE8E0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#263B39',
    marginBottom: 6,
  },
  guestDesc: {
    fontSize: 13,
    color: '#77766F',
    lineHeight: 19,
    marginBottom: 16,
  },
  authButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#347F8C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#EDF2ED',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#347F8C',
    fontWeight: '700',
    fontSize: 14,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE8E0',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F1EA',
  },
  menuRowText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#263B39',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEB2B2',
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutBtnText: {
    color: '#C53030',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
});
