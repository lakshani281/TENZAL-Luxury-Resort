import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRoomById } from '../services/bookingApi';

export default function RoomDetailsScreen({
  room: initialRoom,
  isLoggedIn = false,
  onBack,
  onBookRoom,
  onRequireLogin,
}) {
  const [room, setRoom] = useState(initialRoom);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setRoom(initialRoom);
    if (!initialRoom?.id) return;

    let mounted = true;
    setRefreshing(true);
    getRoomById(initialRoom.id)
      .then((freshRoom) => {
        if (mounted && freshRoom) setRoom(freshRoom);
      })
      .catch(() => {
        // Keep initialRoom data if background refresh fails
      })
      .finally(() => {
        if (mounted) setRefreshing(false);
      });

    return () => {
      mounted = false;
    };
  }, [initialRoom]);

  if (!room) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Room not found.</Text>
        <TouchableOpacity style={styles.fallbackBackBtn} onPress={onBack}>
          <Text style={styles.fallbackBackText}>Back to Rooms</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isActive = room.status === 'active';
  const amenities = Array.isArray(room.amenities) ? room.amenities : [];

  const handleBookPress = () => {
    if (!isActive) return;
    if (!isLoggedIn) {
      onRequireLogin?.(room);
      return;
    }
    onBookRoom?.(room);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={room.image_url ? { uri: room.image_url } : undefined}
          style={styles.coverImage}
          resizeMode="cover"
        >
          <View style={styles.imageOverlay} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#263B39" />
          </TouchableOpacity>

          <View style={styles.coverContent}>
            <View style={styles.coverBadges}>
              {room.type ? (
                <Text style={styles.typeTag}>{room.type}</Text>
              ) : null}
              {room.room_number ? (
                <Text style={styles.roomNumTag}>· Room {room.room_number}</Text>
              ) : null}
            </View>
            <Text style={styles.title}>{room.name}</Text>
          </View>
        </ImageBackground>

        <View style={styles.content}>
          {refreshing && (
            <View style={styles.syncRow}>
              <ActivityIndicator size="small" color="#347F8C" />
              <Text style={styles.syncText}>Refreshing room availability...</Text>
            </View>
          )}

          {!isActive && (
            <View style={styles.unavailableBanner}>
              <Ionicons name="alert-circle-outline" size={18} color="#991B1B" />
              <Text style={styles.unavailableText}>
                This room is currently marked as {room.status} and cannot be booked.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>About this room</Text>
          <Text style={styles.description}>
            {room.description || 'Luxury highland accommodation at TENZAL Resort.'}
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="people-outline" size={20} color="#347F8C" />
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Maximum Guest Capacity</Text>
                <Text style={styles.infoValue}>
                  Up to {room.capacity || 2} {Number(room.capacity) === 1 ? 'guest' : 'guests'}
                </Text>
              </View>
            </View>

            {room.size_sqm ? (
              <>
                <View style={styles.divider} />
                <View style={styles.infoItem}>
                  <Ionicons name="expand-outline" size={20} color="#347F8C" />
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoLabel}>Room Size</Text>
                    <Text style={styles.infoValue}>{room.size_sqm} m²</Text>
                  </View>
                </View>
              </>
            ) : null}

            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Ionicons name="pricetag-outline" size={20} color="#347F8C" />
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Rate</Text>
                <Text style={styles.infoValue}>
                  ${Number(room.price_per_night || 0).toFixed(2)} per night
                </Text>
              </View>
            </View>
          </View>

          {amenities.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Facilities & Amenities</Text>
              <View style={styles.amenitiesWrap}>
                {amenities.map((item, idx) => (
                  <View key={`${item}-${idx}`} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#347F8C" />
                    <Text style={styles.amenityText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {room.notes ? (
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>Room Note</Text>
              <Text style={styles.noticeText}>{room.notes}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <View>
          <Text style={styles.bottomPrice}>
            ${Number(room.price_per_night || 0).toFixed(2)}
          </Text>
          <Text style={styles.bottomPriceSub}>per night</Text>
        </View>

        <TouchableOpacity
          style={[styles.bookButton, !isActive && styles.bookButtonDisabled]}
          onPress={handleBookPress}
          activeOpacity={0.85}
          disabled={!isActive}
        >
          <Text style={styles.bookButtonText}>
            {!isActive
              ? 'Unavailable'
              : isLoggedIn
              ? 'Book This Room'
              : 'Sign in to Book'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F4',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#FAF9F4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#263B39',
    fontSize: 16,
    marginBottom: 14,
  },
  fallbackBackBtn: {
    backgroundColor: '#347F8C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  fallbackBackText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  coverImage: {
    height: 320,
    justifyContent: 'flex-end',
    backgroundColor: '#D9DED9',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 45 : 52,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  coverContent: {
    padding: 22,
    zIndex: 1,
  },
  coverBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeTag: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  roomNumTag: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  syncText: {
    fontSize: 12,
    color: '#5E7480',
  },
  unavailableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  unavailableText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#263B39',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 10,
    marginBottom: 10,
  },
  description: {
    color: '#5E6460',
    fontSize: 14,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#ECEAE3',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoTextWrap: {
    marginLeft: 14,
  },
  infoLabel: {
    color: '#99958E',
    fontSize: 11,
    marginBottom: 2,
  },
  infoValue: {
    color: '#263B39',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECEAE3',
    marginVertical: 8,
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2ED',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
  },
  amenityText: {
    color: '#263B39',
    fontSize: 12,
    fontWeight: '600',
  },
  notice: {
    backgroundColor: '#EDF2ED',
    borderRadius: 13,
    padding: 15,
    marginTop: 18,
  },
  noticeTitle: {
    color: '#347F8C',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 5,
  },
  noticeText: {
    color: '#5E6460',
    fontSize: 12,
    lineHeight: 18,
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAE8E0',
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#263B39',
  },
  bottomPriceSub: {
    fontSize: 11,
    color: '#898780',
  },
  bookButton: {
    backgroundColor: '#347F8C',
    borderRadius: 13,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#A1A5A1',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
