import React, { useState } from 'react';
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

export default function PlanMyDayTravellersScreen({ navigation, onNext, onBack }) {
  const [peopleCount, setPeopleCount] = useState(2);

  const increment = () => {
    setPeopleCount((prev) => prev + 1);
  };

  const decrement = () => {
    if (peopleCount > 1) {
      setPeopleCount((prev) => prev - 1);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext(peopleCount);
    } else if (navigation && navigation.navigate) {
      navigation.navigate('Summary');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            activeOpacity={0.7}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={18} color="#2D3748" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Your day, your way</Text>
            <Text style={styles.headerSubtitle}>Personalise your escape · 5 of 5</Text>
          </View>
        </View>

        {/* Progress Bar (100% Progress for Step 5 of 5) */}
        <View style={styles.progressBarBackground}>
          <View style={styles.progressBarFill} />
        </View>

        {/* Banner Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=1000&auto=format&fit=crop',
            }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* Section Titles */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionCategory}>TRAVELLERS</Text>
          <Text style={styles.sectionTitle}>Who is joining you?</Text>
          <Text style={styles.sectionSubtitle}>We'll shape the plan around you.</Text>
        </View>

        {/* Counter Control Section */}
        <View style={styles.counterContainer}>
          <TouchableOpacity 
            style={styles.counterButton} 
            onPress={decrement}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={20} color="#3B7A8C" />
          </TouchableOpacity>

          <View style={styles.countTextWrapper}>
            <Text style={styles.countNumber}>{peopleCount}</Text>
            <Text style={styles.countLabel}>people</Text>
          </View>

          <TouchableOpacity 
            style={styles.counterButton} 
            onPress={increment}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#3B7A8C" />
          </TouchableOpacity>
        </View>

        {/* Create My Plan Button */}
        <TouchableOpacity 
          style={styles.createPlanButton} 
          activeOpacity={0.85}
          onPress={handleNext}
        >
          <Text style={styles.createPlanButtonText}>Create My Plan</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

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
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1A365D',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#319795',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#319795',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A365D',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#718096',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 25,
  },
  counterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2F1F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countTextWrapper: {
    alignItems: 'center',
    marginHorizontal: 35,
  },
  countNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A365D',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  countLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  createPlanButton: {
    backgroundColor: '#319795',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  createPlanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});