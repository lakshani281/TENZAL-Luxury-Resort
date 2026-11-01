
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import DestinationListScreen from './screens/DestinationListScreen';
import DestinationDetailsScreen from './screens/DestinationDetailsScreen';

export default function App() {
  const [selectedDestination, setSelectedDestination] = useState(null);

  const openDestination = (destination) => {
    setSelectedDestination(destination);
  };

  const goBackToDestinations = () => {
    setSelectedDestination(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {selectedDestination ? (
        <DestinationDetailsScreen
          destination={selectedDestination}
          onBack={goBackToDestinations}
        />
      ) : (
        <DestinationListScreen
          onDestinationPress={openDestination}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F4',
  },
});
