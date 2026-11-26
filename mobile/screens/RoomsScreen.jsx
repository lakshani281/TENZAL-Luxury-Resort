import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation from '../components/BottomNavigation';
import { getBackendOrigin } from '../services/foodApi';

export default function RoomsScreen({
  isLoggedIn = false,
  onTabPress,
  onRequireLogin,
}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRoomNotice, setSelectedRoomNotice] = useState('');

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${getBackendOrigin()}/api/rooms`, {
        headers: { Accept: 'application/json' },
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.message || `Failed to load rooms (HTTP ${response.status})`);
      }
      setRooms(Array.isArray(json?.data) ? json.data : []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to the resort server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleBookRoomPress = (room) => {
    if (!isLoggedIn) {
      onRequireLogin?.();
      return;
    }
    setSelectedRoomNotice(
      `Signed-in booking verified for ${room.name || `Room ${room.room_number || ''}`}. Full mobile booking checkout is managed via the resort booking module.`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F4" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>TENZAL</Text>
          <Text style={styles.heading}>Rooms & Suites</Text>
          <Text style={styles.subtitle}>
            Sign in required to create or manage bookings.
          </Text>
        </View>

        {!isLoggedIn && (
          <View style={styles.authNotice}>
            <Ionicons name="lock-closed-outline" size={18} color="#347F8C" />
            <Text style={styles.authNoticeText}>
              Guest sign-in is required before booking a room.
            </Text>
            <TouchableOpacity onPress={onRequireLogin} activeOpacity={0.8}>
              <Text style={styles.authNoticeLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedRoomNotice ? (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>{selectedRoomNotice}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#347F8C" />
            <Text style={styles.loadingText}>Loading resort rooms...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchRooms}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : rooms.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.loadingText}>No rooms available right now.</Text>
          </View>
        ) : (
          rooms.map((room) => (
            <View key={String(room.id || room.room_number)} style={styles.roomCard}>
              <View style={styles.roomHeader}>
                <Text style={styles.roomTitle}>
                  {room.name || `Room ${room.room_number || ''}`}
                </Text>
                {room.status ? (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{room.status}</Text>
                  </View>
                ) : null}
              </View>
              {room.description ? (
                <Text style={styles.roomDesc} numberOfLines={2}>
                  {room.description}
                </Text>
              ) : null}
              <View style={styles.roomFooter}>
                <Text style={styles.priceText}>
                  {room.price_per_night ? `LKR ${Number(room.price_per_night).toLocaleString()} / night` : 'Contact for rate'}
                </Text>
                <TouchableOpacity
                  style={styles.bookBtn}
                  activeOpacity={0.85}
                  onPress={() => handleBookRoomPress(room)}
                >
                  <Text style={styles.bookBtnText}>
                    {isLoggedIn ? 'Request Stay' : 'Sign in to Book'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <BottomNavigation activeTab="Rooms" onTabPress={onTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F4',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 18,
  },
  brand: {
    color: '#347F8C',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#263B39',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: {
    color: '#898780',
    fontSize: 12,
    marginTop: 4,
  },
  authNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2ED',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  authNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#263B39',
    marginHorizontal: 8,
  },
  authNoticeLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#347F8C',
  },
  infoBanner: {
    backgroundColor: '#DCEEF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoBannerText: {
    color: '#1D6377',
    fontSize: 12,
    lineHeight: 18,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#77766F',
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEB2B2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#C53030',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#347F8C',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE8E0',
    borderRadius: 15,
    padding: 16,
    marginBottom: 14,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263B39',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#EDF2ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#347F8C',
    textTransform: 'uppercase',
  },
  roomDesc: {
    fontSize: 12,
    color: '#77766F',
    lineHeight: 18,
    marginBottom: 12,
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#263B39',
  },
  bookBtn: {
    backgroundColor: '#347F8C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
