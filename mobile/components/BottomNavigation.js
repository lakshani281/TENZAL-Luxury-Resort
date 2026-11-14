
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const navigationItems = [
  { label: 'Home', icon: '⌂' },
  { label: 'Rooms', icon: '▢' },
  { label: 'Explore', icon: '◎' },
  { label: 'Plan', icon: '◇' },
  { label: 'Profile', icon: '♙' },
];

export default function BottomNavigation({
  activeTab = 'Explore',
  onTabPress,
}) {
  return (
    <View style={styles.container}>
      {navigationItems.map((item) => {
        const isActive = activeTab === item.label;

        return (
          <TouchableOpacity
            key={item.label}
            style={styles.navItem}
            onPress={() => onTabPress?.(item.label)}
            activeOpacity={0.7}
          >
            {isActive && <View style={styles.indicator} />}

            <Text
              style={[
                styles.icon,
                isActive && styles.activeIcon,
              ]}
            >
              {item.icon}
            </Text>

            <Text
              style={[
                styles.label,
                isActive && styles.activeLabel,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 67,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAE8E0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    backgroundColor: '#347F8C',
    borderRadius: 5,
  },
  icon: {
    fontSize: 21,
    color: '#A1A5A1',
  },
  activeIcon: {
    color: '#347F8C',
  },
  label: {
    fontSize: 9,
    color: '#999999',
    marginTop: 3,
  },
  activeLabel: {
    color: '#347F8C',
    fontWeight: 'bold',
  },
});
