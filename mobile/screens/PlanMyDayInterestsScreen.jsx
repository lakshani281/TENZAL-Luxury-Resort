import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PlanMyDayInterestsScreen({ navigation, onNext, onBack }) {
  
  const [selectedInterests, setSelectedInterests] = useState(['Nature', 'Food']);

  const interestOptions = [
    { id: 'Nature', label: 'Nature', icon: 'compass-outline' },
    { id: 'Adventure', label: 'Adventure', icon: 'map-outline' },
    { id: 'Culture', label: 'Culture', icon: 'image-outline' },
    { id: 'Food', label: 'Food', icon: 'restaurant-outline' },
    { id: 'Relaxation', label: 'Relaxation', icon: 'heart-outline' },
  ];

  const toggleInterest = (id) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
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
      onNext(selectedInterests);
    } else if (navigation && navigation.navigate) {
      navigation.navigate('PlanMyDaySummary');
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
            <Text style={styles.headerSubtitle}>Personalise your escape · 3 of 5</Text>
          </View>
        </View>

        {/* Progress Bar (60% Progress for Step 3 of 5) */}
        <View style={styles.progressBarBackground}>
          <View style={styles.progressBarFill} />
        </View>

        {/* Banner Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=800',
            }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* Titles */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionCategory}>YOUR INTERESTS</Text>
          <Text style={styles.sectionTitle}>What feels good today?</Text>
          <Text style={styles.sectionSubtitle}>Choose as many as you like.</Text>
        </View>

        {/* Interests Grid */}
        <View style={styles.gridContainer}>
          {interestOptions.map((item) => {
            const isSelected = selectedInterests.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.selectedOptionCard,
                ]}
                activeOpacity={0.8}
                onPress={() => toggleInterest(item.id)}
              >
                <Ionicons 
                  name={item.icon} 
                  size={20} 
                  color={isSelected ? '#319795' : '#2D3748'} 
                  style={styles.optionIcon}
                />
                <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                  {item.label}
                </Text>
                {isSelected && (
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark" size={14} color="#319795" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Button */}
        <TouchableOpacity 
          style={styles.continueButton} 
          activeOpacity={0.85}
          onPress={handleNext}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
    width: '60%',
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    position: 'relative',
  },
  selectedOptionCard: {
    backgroundColor: '#E6FFFA',
    borderColor: '#319795',
    borderWidth: 1.5,
  },
  optionIcon: {
    marginRight: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  selectedOptionText: {
    color: '#234E52',
    fontWeight: '700',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 10,
  },
  continueButton: {
    backgroundColor: '#319795',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});