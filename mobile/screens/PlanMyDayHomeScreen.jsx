import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PlanMyDayHomeScreen({ navigation, onNavigateToForm }) {
  const handlePressCreatePlan = () => {
    if (onNavigateToForm) {
      onNavigateToForm();
    } else if (navigation && navigation.navigate) {
      navigation.navigate('PlanMyDayForm');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=1000&auto=format&fit=crop',
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            {/* Top Back Button */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={18} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Bottom Content Area - Pushed to Bottom */}
            <View style={styles.contentContainer}>
              <Text style={styles.subtitle}>PERSONALISED BY YOU</Text>
              <Text style={styles.title}>Your day,{"\n"}your way</Text>
              <Text style={styles.description}>
                Plan your perfect getaway.
              </Text>

              <TouchableOpacity
                style={styles.createButton}
                activeOpacity={0.85}
                onPress={handlePressCreatePlan}
              >
                <Text style={styles.buttonText}>Create my plan</Text>
                <Ionicons name="arrow-forward" size={16} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Bottom Navigation Bar */}
            <View style={styles.bottomTab}>
              <TouchableOpacity style={styles.tabItem}>
                <Ionicons name="home-outline" size={20} color="#718096" />
                <Text style={styles.tabLabel}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tabItem}>
                <Ionicons name="bed-outline" size={20} color="#718096" />
                <Text style={styles.tabLabel}>Rooms</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tabItem}>
                <Ionicons name="compass-outline" size={20} color="#718096" />
                <Text style={styles.tabLabel}>Explore</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tabItem}>
                <Ionicons name="compass" size={20} color="#1A365D" />
                <Text style={[styles.tabLabel, styles.activeTabLabel]}>Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tabItem}>
                <Ionicons name="person-outline" size={20} color="#718096" />
                <Text style={styles.tabLabel}>Profile</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    ...(Platform.OS === 'web' && {
      height: '100vh',
      overflow: 'hidden',
    }),
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 35 : 15,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  subtitle: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 8,
  },
  description: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  bottomTab: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
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
    fontSize: 10,
    color: '#718096',
    marginTop: 3,
  },
  activeTabLabel: {
    color: '#1A365D',
    fontWeight: 'bold',
  },
});