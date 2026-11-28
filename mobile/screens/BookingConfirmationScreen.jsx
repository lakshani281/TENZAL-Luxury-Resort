import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBookingById } from '../services/bookingApi';
import { getAuthToken } from '../services/authStorage';

function formatDateDisplay(value) {
  if (!value) return '—';
  return String(value).slice(0, 10);
}

export default function BookingConfirmationScreen({
  booking: initialBooking,
  onReturnHome,
  onBrowseRooms,
}) {
  const [booking, setBooking] = useState(initialBooking);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');

  const handleRefreshDetails = async () => {
    if (!booking?.id || refreshing) return;
    setRefreshing(true);
    setRefreshError('');
    try {
      const token = await getAuthToken();
      const fresh = await getBookingById(booking.id, token);
      setBooking(fresh);
    } catch (err) {
      setRefreshError(err?.message || 'Unable to refresh booking status.');
    } finally {
      setRefreshing(false);
    }
  };

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.title}>No booking details found</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={onReturnHome}>
            <Text style={styles.primaryBtnText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F4" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={34} color="#347F8C" />
        </View>

        <Text style={styles.tag}>BOOKING REQUEST RECEIVED</Text>
        <Text style={styles.title}>Your stay is reserved</Text>
        <Text style={styles.subtitle}>
          Reference {booking.reference || `#${booking.id}`} · Status:{' '}
          {String(booking.status || 'pending').toUpperCase()}
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Reference</Text>
            <Text style={styles.value}>{booking.reference || `#${booking.id}`}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Room</Text>
            <Text style={styles.value}>
              {booking.room_name || `Room ${booking.room_number || booking.room_id}`}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Guest Name</Text>
            <Text style={styles.value}>{booking.guest_name}</Text>
          </View>
          {booking.guest_email ? (
            <View style={styles.row}>
              <Text style={styles.label}>Guest Email</Text>
              <Text style={styles.value}>{booking.guest_email}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Check-in</Text>
            <Text style={styles.value}>{formatDateDisplay(booking.check_in)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Check-out</Text>
            <Text style={styles.value}>{formatDateDisplay(booking.check_out)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Guests</Text>
            <Text style={styles.value}>{booking.guest_count || 1}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              ${Number(booking.total_amount || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {refreshError ? (
          <Text style={styles.errorText}>{refreshError}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.outlineBtn}
          activeOpacity={0.8}
          onPress={handleRefreshDetails}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#347F8C" />
          ) : (
            <Text style={styles.outlineBtnText}>Refresh Booking Status</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={onReturnHome}
        >
          <Text style={styles.primaryBtnText}>Return to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryLink}
          activeOpacity={0.7}
          onPress={onBrowseRooms}
        >
          <Text style={styles.secondaryLinkText}>Browse More Rooms</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F4',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 36,
    paddingBottom: 36,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCEEF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: '#347F8C',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#263B39',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#5E7480',
    textAlign: 'center',
    marginBottom: 22,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE8E0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: '#77766F',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#263B39',
  },
  divider: {
    height: 1,
    backgroundColor: '#EAE8E0',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#263B39',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#347F8C',
  },
  errorText: {
    color: '#C53030',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  outlineBtn: {
    width: '100%',
    backgroundColor: '#EDF2ED',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  outlineBtnText: {
    color: '#347F8C',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#347F8C',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryLink: {
    paddingVertical: 8,
  },
  secondaryLinkText: {
    color: '#5E7480',
    fontSize: 13,
    fontWeight: '600',
  },
});
