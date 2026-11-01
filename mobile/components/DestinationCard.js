
import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function DestinationCard({ destination, onPress }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <ImageBackground
        source={{ uri: destination.image }}
        style={styles.image}
        imageStyle={styles.imageRadius}
      >
        <View style={styles.overlay} />

        <View style={styles.content}>
          <Text style={styles.category}>
            {destination.category} · {destination.distance}
          </Text>

          <Text style={styles.name}>
            {destination.name}
          </Text>

          <Text style={styles.explore}>
            Explore →
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 190,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: '#E4E7E1',
    marginBottom: 14,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageRadius: {
    borderRadius: 17,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  content: {
    padding: 14,
  },
  category: {
    color: '#FFFFFF',
    fontSize: 10,
    marginBottom: 6,
    fontWeight: '600',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 9,
  },
  explore: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
