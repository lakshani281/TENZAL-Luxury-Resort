
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';

import destinations from '../data/destinations';
import DestinationCard from '../components/DestinationCard';
import CategoryFilter from '../components/CategoryFilter';
import BottomNavigation from '../components/BottomNavigation';

export default function DestinationListScreen({ onDestinationPress }) {
  const [selectedCategory, setSelectedCategory] = useState('For you');
  const [searchText, setSearchText] = useState('');

  const filteredDestinations = destinations.filter((place) => {
    const matchesCategory =
      selectedCategory === 'For you' ||
      place.category === selectedCategory;

    const matchesSearch =
      place.name.toLowerCase().includes(searchText.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const featuredDestination = filteredDestinations.find(
    (place) => place.id === '1'
  );

  const otherDestinations = filteredDestinations.filter(
    (place) => place.id !== '1'
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>TENZAL</Text>

          <View style={styles.headerContent}>
            <Text style={styles.heading}>Around Haputale</Text>
            <Text style={styles.subtitle}>
              Authentic highland experiences, close by.
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations"
            placeholderTextColor="#99958E"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Category Filter */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Featured Destination */}
        {featuredDestination && (
          <View style={styles.featuredContainer}>
            <DestinationCard
              destination={featuredDestination}
              onPress={() => onDestinationPress?.(featuredDestination)}
            />
          </View>
        )}

        {/* Other Destinations */}
        <View style={styles.destinationGrid}>
          {otherDestinations.map((place) => (
            <View key={place.id} style={styles.gridItem}>
              <DestinationCard
                destination={place}
                onPress={() => onDestinationPress?.(place)}
              />
            </View>
          ))}
        </View>

        {/* Empty Search Result */}
        {filteredDestinations.length === 0 && (
          <Text style={styles.emptyText}>
            No destinations found.
          </Text>
        )}

        <Text style={styles.footerNote}>
          Discover the beauty of Sri Lanka's highlands.
        </Text>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="Explore" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F4',
  },

  scrollContent: {
    paddingTop: 57,
    paddingBottom: 15,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 23,
  },

  brand: {
    color: '#347F8C',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginRight: 14,
  },

  headerContent: {
    flex: 1,
  },

  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#263B39',
    fontFamily: 'serif',
  },

  subtitle: {
    color: '#898780',
    fontSize: 11,
    marginTop: 3,
  },

  searchContainer: {
    height: 47,
    marginHorizontal: 19,
    marginBottom: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE8E0',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  searchIcon: {
    fontSize: 25,
    color: '#454D4A',
    marginRight: 9,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333333',
  },

  featuredContainer: {
    marginTop: 8,
  },

  destinationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 19,
  },

  gridItem: {
    width: '48%',
  },

  emptyText: {
    textAlign: 'center',
    color: '#777777',
    marginTop: 35,
    fontSize: 14,
  },

  footerNote: {
    fontSize: 10,
    color: '#99958E',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
});
