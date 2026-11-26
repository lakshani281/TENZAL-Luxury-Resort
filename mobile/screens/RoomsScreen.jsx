import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation from '../components/BottomNavigation';
import { getRooms } from '../services/bookingApi';

export default function RoomsScreen({
  isLoggedIn = false,
  onTabPress,
  onSelectRoom,
  onRequireLogin,
}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchRooms = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (err) {
      setError(err?.message || 'Unable to connect to the resort server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F4" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchRooms(true)}
            tintColor="#347F8C"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.brand}>TENZAL</Text>
          <Text style={styles.heading}>Rooms & Suites</Text>
          <Text style={styles.subtitle}>
            Select a room to view details, check dates, and reserve your stay.
          </Text>
        </View>

        {!isLoggedIn && (
          <View style={styles.authNotice}>
            <Ionicons name="lock-closed-outline" size={18} color="#347F8C" />
            <Text style={styles.authNoticeText}>
              Sign in is required to complete a room booking.
            </Text>
            <TouchableOpacity onPress={onRequireLogin} activeOpacity={0.8}>
              <Text style={styles.authNoticeLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#347F8C" />
            <Text style={styles.loadingText}>Loading resort rooms...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={24} color="#C53030" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchRooms(false)}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : rooms.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="bed-outline" size={32} color="#898780" />
            <Text style={styles.loadingText}>No rooms available right now.</Text>
          </View>
        ) : (
          rooms.map((room) => {
            const isActive = room.status === 'active';
            return (
              <TouchableOpacity
                key={String(room.id || room.room_number)}
                style={styles.roomCard}
                activeOpacity={0.88}
                onPress={() => onSelectRoom?.(room)}
              >
                {room.image_url ? (
                  <Image
                    source={{ uri: room.image_url }}
                    style={styles.roomImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.roomImage, styles.imagePlaceholder]}>
                    <Ionicons name="bed-outline" size={32} color="#898780" />
                  </View>
                )}

                <View style={styles.cardBody}>
                  <View style={styles.badgeRow}>
                    {room.type ? (
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeText}>{room.type}</Text>
                      </View>
                    ) : null}
                    <View
                      style={[
                        styles.statusBadge,
                        !isActive && styles.statusBadgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          !isActive && styles.statusTextInactive,
                        ]}
                      >
                        {isActive ? 'Available' : room.status || 'Unavailable'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.roomTitle}>
                    {room.name || `Room ${room.room_number || ''}`}
                  </Text>
                  {room.room_number ? (
                    <Text style={styles.roomNumber}>Room {room.room_number}</Text>
                  ) : null}

                  {room.description ? (
                    <Text style={styles.roomDesc} numberOfLines={2}>
                      {room.description}
                    </Text>
                  ) : null}

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="people-outline" size={14} color="#5E7480" />
                      <Text style={styles.metaText}>
                        Up to {room.capacity || 2} guests
                      </Text>
                    </View>
                    {room.size_sqm ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="expand-outline" size={14} color="#5E7480" />
                        <Text style={styles.metaText}>{room.size_sqm} m²</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.roomFooter}>
                    <View>
                      <Text style={styles.priceText}>
                        ${Number(room.price_per_night || 0).toFixed(2)}
                      </Text>
                      <Text style={styles.perNightText}>per night</Text>
                    </View>
                    <View style={styles.viewBtn}>
                      <Text style={styles.viewBtnText}>View Details</Text>
                      <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
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
  centerBox: {
    paddingVertical: 48,
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
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  errorText: {
    color: '#C53030',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 10,
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
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  roomImage: {
    width: '100%',
    height: 175,
    backgroundColor: '#E8EDE7',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: '#DCEEF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D6377',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    textTransform: 'uppercase',
  },
  statusTextInactive: {
    color: '#991B1B',
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263B39',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  roomNumber: {
    fontSize: 11,
    color: '#898780',
    marginTop: 2,
    marginBottom: 6,
  },
  roomDesc: {
    fontSize: 12,
    color: '#77766F',
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#5E7480',
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F1EA',
    paddingTop: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263B39',
  },
  perNightText: {
    fontSize: 10,
    color: '#898780',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#347F8C',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
