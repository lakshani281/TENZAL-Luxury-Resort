import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PlanMyDayHomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Waterfall Image */}
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=1000&auto=format&fit=crop',
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.overlayContainer}>
          {/* Top Back Button */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation?.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Main Overlay Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.subtitle}>PERSONALISED BY YOU</Text>
            <Text style={styles.title}>Your day,{"\n"}your way</Text>
            <Text style={styles.description}>Plan your perfect getaway.</Text>

            {/* Create My Plan Button */}
            <TouchableOpacity
              style={styles.createButton}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('PlanForm')}
            >
              <Text style={styles.buttonText}>Create my plan</Text>
              <Ionicons name="arrow-forward" size={18} color="#0F172A" style={styles.buttonIcon} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home-outline" size={22} color="#64748B" />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="bed-outline" size={22} color="#64748B" />
          <Text style={styles.tabLabel}>Rooms</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="compass-outline" size={22} color="#64748B" />
          <Text style={styles.tabLabel}>Explore</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home" size={22} color="#1E3A8A" />
          <View style={styles.activeIndicator} />
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="person-outline" size={22} color="#64748B" />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    marginBottom: 20,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
    lineHeight: 46,
    marginBottom: 8,
  },
  description: {
    color: '#E2E8F0',
    fontSize: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  bottomTab: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#1E3A8A',
    fontWeight: '600',
  },
  activeIndicator: {
    width: 20,
    height: 2,
    backgroundColor: '#1E3A8A',
    marginTop: 2,
  },
});

export default PlanMyDayHomeScreen;