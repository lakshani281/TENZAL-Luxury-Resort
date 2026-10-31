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
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

export default function PlanMyDayBudgetScreen({ navigation }) {
  const [budget, setBudget] = useState(25000);

  const formatCurrency = (val) => {
    return `LKR ${val.toLocaleString()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation?.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Your day, your way</Text>
            <Text style={styles.subtitle}>Personalise your escape · 2 of 5</Text>
          </View>
        </View>

        {/* Progress Bar */}
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

        {/* Form Title Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.badgeText}>YOUR BUDGET</Text>
          <Text style={styles.questionText}>What is your budget?</Text>
          <Text style={styles.descriptionText}>We'll shape the plan around you.</Text>
        </View>

        {/* Budget Card Box */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetValueRow}>
            <Text style={styles.budgetLabel}>Estimated budget</Text>
            <Text style={styles.currencyText}>{formatCurrency(budget)}</Text>
          </View>

          <Text style={styles.amountDisplay}>{budget}</Text>

          {/* Budget Slider */}
          <Slider
            style={styles.slider}
            minimumValue={5000}
            maximumValue={100000}
            step={1000}
            value={budget}
            onValueChange={(val) => setBudget(val)}
            minimumTrackTintColor="#3B7A8C"
            maximumTrackTintColor="#E2E8F0"
            thumbTintColor="#3B7A8C"
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            // ඊළඟ Screen එකට (Screen 4) navigate වීම මෙතැනින් සිදු කල හැක
            console.log('Selected Budget:', budget);
          }}
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
    width: '40%', // Step 2 of 5 -> 40%
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
  budgetCard: {
    backgroundColor: '#F5EFE6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  budgetValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  amountDisplay: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
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