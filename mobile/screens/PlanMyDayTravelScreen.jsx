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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PlanMyDayTravelScreen({ navigation, onNext, onBack }) {
  // Select වී ඇති travel option එක (Default: Tuk-Tuk)
  const [selectedOption, setSelectedOption] = useState('Tuk-Tuk');

  const travelOptions = [
    { id: 'Walking', label: 'Walking' },
    { id: 'Tuk-Tuk', label: 'Tuk-Tuk' },
    { id: 'Car', label: 'Car' },
    { id: 'Public Transport', label: 'Public Transport' },
  ];

  const handleSelect = (id) => {
    setSelectedOption(id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBack || (() => navigation?.goBack())}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Your day, your way</Text>
            <Text style={styles.subtitle}>Personalise your escape · 4 of 5</Text>
          </View>
        </View>

        {/* Progress Bar (Step 4 of 5 -> 80%) */}
        <View style={styles.progressBarBackground}>
          <View style={styles.progressBarFill} />
        </View>

        {/* Banner Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1000&auto=format&fit=crop',
            }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.badgeText}>GETTING AROUND</Text>
          <Text style={styles.questionText}>How would you like to travel?</Text>
          <Text style={styles.descriptionText}>We'll shape the plan around you.</Text>
        </View>

        {/* Options Grid */}
        <View style={styles.optionsGrid}>
          {travelOptions.map((option) => {
            const isSelected = selectedOption === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => handleSelect(option.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#3B7A8C" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onNext || (() => navigation?.navigate('Summary'))}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.arrowIcon} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: 'serif',
    fontWeight: 'bold',
    color: '#1A3636',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '80%', // Step 4 of 5 -> 80%
    height: '100%',
    backgroundColor: '#3B7A8C',
    borderRadius: 2,
  },
  imageContainer: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  sectionHeader: {
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B7A8C',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 28,
    fontFamily: 'serif',
    fontWeight: '600',
    color: '#1A3636',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#64748B',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  optionCard: {
    width: '48%',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    paddingHorizontal: 8,
  },
  optionCardSelected: {
    backgroundColor: '#E2F1F5',
    borderColor: '#3B7A8C',
    borderWidth: 1.5,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  optionTextSelected: {
    color: '#3B7A8C',
    fontWeight: '700',
  },
  checkIcon: {
    position: 'absolute',
    top: 10,
    right: 12,
  },
  continueButton: {
    backgroundColor: '#3B7A8C',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  arrowIcon: {
    marginLeft: 8,
  },
});