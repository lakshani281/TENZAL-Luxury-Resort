
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

const categories = [
  'For you',
  'Nature',
  'Culture',
  'History',
  'Religious',
  'Adventure',
];

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const isSelected = selectedCategory === category;

        return (
          <TouchableOpacity
            key={category}
            onPress={() => onSelectCategory(category)}
            style={[
              styles.button,
              isSelected && styles.activeButton,
            ]}
          >
            <Text
              style={[
                styles.text,
                isSelected && styles.activeText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 19,
    paddingVertical: 5,
  },
  button: {
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E9E6DD',
    backgroundColor: '#FFFFFF',
    marginRight: 9,
  },
  activeButton: {
    backgroundColor: '#347F8C',
    borderColor: '#347F8C',
  },
  text: {
    fontSize: 12,
    color: '#555B58',
    fontWeight: '600',
  },
  activeText: {
    color: '#FFFFFF',
  },
});
