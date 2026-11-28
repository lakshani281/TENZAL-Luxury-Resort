import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkRoomAvailability, createBooking } from '../services/bookingApi';
import { getAuthToken, isTokenExpired } from '../services/authStorage';

function toLocalISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysISO(isoDate, days) {
  const parts = String(isoDate).split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const dt = new Date(parts[0], parts[1] - 1, parts[2] + days);
  return toLocalISODate(dt);
}

function parseStrictISODate(isoStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoStr || '').trim())) return null;
  const [y, m, d] = isoStr.trim().split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

function calculateNights(checkInStr, checkOutStr) {
  const start = parseStrictISODate(checkInStr);
  const end = parseStrictISODate(checkOutStr);
  if (!start || !end) return 0;
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export default function RoomBookingScreen({
  room,
  authUser = null,
  onBack,
  onBookingConfirmed,
  onRequireLogin,
}) {
  const todayISO = toLocalISODate(new Date());
  const tomorrowISO = addDaysISO(todayISO, 1);

  const [checkIn, setCheckIn] = useState(todayISO);
  const [checkOut, setCheckOut] = useState(tomorrowISO);
  const [guestCount, setGuestCount] = useState(1);
  const [guestName, setGuestName] = useState(authUser?.name || '');
  const [guestPhone, setGuestPhone] = useState(authUser?.phone || '');
  const [notes, setNotes] = useState('');

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [availabilityError, setAvailabilityError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (authUser?.name && !guestName) setGuestName(authUser.name);
    if (authUser?.phone && !guestPhone) setGuestPhone(authUser.phone);
  }, [authUser]);

  const maxCapacity = Math.max(1, Number(room?.capacity || 2));
  const pricePerNight = Number(room?.price_per_night || 0);
  const nights = calculateNights(checkIn, checkOut);
  const totalAmount = nights > 0 ? (nights * pricePerNight).toFixed(2) : '0.00';

  const validateDates = useCallback(
    (inStr, outStr) => {
      const start = parseStrictISODate(inStr);
      const end = parseStrictISODate(outStr);
      const today = parseStrictISODate(todayISO);

      if (!start) return 'Check-in date must be in YYYY-MM-DD format.';
      if (!end) return 'Check-out date must be in YYYY-MM-DD format.';
      if (start < today) return 'Check-in date cannot be in the past.';
      if (end <= start) return 'Check-out date must be after check-in date.';
      return '';
    },
    [todayISO]
  );

  const dateValidationError = validateDates(checkIn, checkOut);

  const runAvailabilityCheck = useCallback(async () => {
    if (!room?.id) return;
    const errMsg = validateDates(checkIn, checkOut);
    if (errMsg) {
      setAvailabilityResult(null);
      setAvailabilityError(errMsg);
      return;
    }

    setCheckingAvailability(true);
    setAvailabilityError('');
    try {
      const data = await checkRoomAvailability(room.id, checkIn.trim(), checkOut.trim());
      setAvailabilityResult(data);
    } catch (err) {
      setAvailabilityResult(null);
      setAvailabilityError(err?.message || 'Unable to check room availability.');
    } finally {
      setCheckingAvailability(false);
    }
  }, [room?.id, checkIn, checkOut, validateDates]);

  useEffect(() => {
    if (!dateValidationError && room?.id) {
      runAvailabilityCheck();
    } else {
      setAvailabilityResult(null);
    }
  }, [checkIn, checkOut, room?.id, dateValidationError, runAvailabilityCheck]);

  const adjustCheckIn = (delta) => {
    const nextIn = addDaysISO(checkIn, delta);
    if (nextIn < todayISO) return;
    setCheckIn(nextIn);
    if (nextIn >= checkOut) {
      setCheckOut(addDaysISO(nextIn, 1));
    }
    setSubmitError('');
  };

  const adjustCheckOut = (delta) => {
    const nextOut = addDaysISO(checkOut, delta);
    if (nextOut <= checkIn) return;
    setCheckOut(nextOut);
    setSubmitError('');
  };

  const handleConfirmBooking = async () => {
    if (isSubmittingRef.current || submitting) return;
    setSubmitError('');

    if (dateValidationError) {
      setSubmitError(dateValidationError);
      return;
    }

    if (availabilityResult && availabilityResult.is_available === false) {
      setSubmitError(
        availabilityResult.reason ||
          'This room is not available for the selected dates. Please choose different dates.'
      );
      return;
    }

    if (!guestName.trim()) {
      setSubmitError('Please enter the primary guest name.');
      return;
    }

    if (guestCount < 1 || guestCount > maxCapacity) {
      setSubmitError(`Guest count must be between 1 and ${maxCapacity}.`);
      return;
    }

    const token = await getAuthToken();
    if (!token || isTokenExpired(token)) {
      onRequireLogin?.();
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      const booking = await createBooking(
        {
          room_id: room.id,
          guest_name: guestName.trim(),
          guest_phone: guestPhone.trim(),
          guest_count: guestCount,
          check_in: checkIn.trim(),
          check_out: checkOut.trim(),
          notes: notes.trim(),
        },
        token
      );
      onBookingConfirmed?.(booking);
    } catch (err) {
      if (err?.status === 401) {
        onRequireLogin?.();
        return;
      }
      setSubmitError(err?.message || 'Unable to complete booking. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFallback}>
          <Text style={styles.errorText}>No room selected for booking.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={onBack}>
            <Text style={styles.primaryBtnText}>Back to Rooms</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F4" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack} disabled={submitting}>
              <Ionicons name="arrow-back" size={18} color="#263B39" />
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.brand}>RESERVE YOUR STAY</Text>
              <Text style={styles.heading}>{room.name}</Text>
            </View>
          </View>

          {/* Dates Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. Select Dates</Text>

            <Text style={styles.fieldLabel}>Check-in Date (YYYY-MM-DD)</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.stepBtn, checkIn <= todayISO && styles.stepBtnDisabled]}
                onPress={() => adjustCheckIn(-1)}
                disabled={checkIn <= todayISO || submitting}
              >
                <Ionicons name="remove" size={16} color="#263B39" />
              </TouchableOpacity>
              <TextInput
                style={styles.dateInput}
                value={checkIn}
                onChangeText={(text) => {
                  setCheckIn(text);
                  setSubmitError('');
                }}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustCheckIn(1)}
                disabled={submitting}
              >
                <Ionicons name="add" size={16} color="#263B39" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Check-out Date (YYYY-MM-DD)</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[
                  styles.stepBtn,
                  addDaysISO(checkOut, -1) <= checkIn && styles.stepBtnDisabled,
                ]}
                onPress={() => adjustCheckOut(-1)}
                disabled={addDaysISO(checkOut, -1) <= checkIn || submitting}
              >
                <Ionicons name="remove" size={16} color="#263B39" />
              </TouchableOpacity>
              <TextInput
                style={styles.dateInput}
                value={checkOut}
                onChangeText={(text) => {
                  setCheckOut(text);
                  setSubmitError('');
                }}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustCheckOut(1)}
                disabled={submitting}
              >
                <Ionicons name="add" size={16} color="#263B39" />
              </TouchableOpacity>
            </View>

            {dateValidationError ? (
              <View style={styles.inlineError}>
                <Ionicons name="alert-circle-outline" size={15} color="#C53030" />
                <Text style={styles.inlineErrorText}>{dateValidationError}</Text>
              </View>
            ) : checkingAvailability ? (
              <View style={styles.availRow}>
                <ActivityIndicator size="small" color="#347F8C" />
                <Text style={styles.availCheckingText}>Checking availability...</Text>
              </View>
            ) : availabilityError ? (
              <View style={styles.inlineError}>
                <Ionicons name="warning-outline" size={15} color="#B45309" />
                <Text style={styles.inlineWarnText}>{availabilityError}</Text>
              </View>
            ) : availabilityResult ? (
              <View
                style={[
                  styles.availBadge,
                  availabilityResult.is_available ? styles.availOk : styles.availNo,
                ]}
              >
                <Ionicons
                  name={availabilityResult.is_available ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={availabilityResult.is_available ? '#15803D' : '#991B1B'}
                />
                <Text
                  style={[
                    styles.availBadgeText,
                    { color: availabilityResult.is_available ? '#15803D' : '#991B1B' },
                  ]}
                >
                  {availabilityResult.is_available
                    ? `Available for ${nights} ${nights === 1 ? 'night' : 'nights'}`
                    : availabilityResult.reason || 'Unavailable for selected dates'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Guest Details Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Guest Details</Text>

            <View style={styles.guestCountRow}>
              <View>
                <Text style={styles.fieldLabel}>Number of Guests</Text>
                <Text style={styles.capacityHint}>Max capacity: {maxCapacity}</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={[styles.stepBtn, guestCount <= 1 && styles.stepBtnDisabled]}
                  onPress={() => setGuestCount((c) => Math.max(1, c - 1))}
                  disabled={guestCount <= 1 || submitting}
                >
                  <Ionicons name="remove" size={16} color="#263B39" />
                </TouchableOpacity>
                <Text style={styles.guestCountText}>{guestCount}</Text>
                <TouchableOpacity
                  style={[styles.stepBtn, guestCount >= maxCapacity && styles.stepBtnDisabled]}
                  onPress={() => setGuestCount((c) => Math.min(maxCapacity, c + 1))}
                  disabled={guestCount >= maxCapacity || submitting}
                >
                  <Ionicons name="add" size={16} color="#263B39" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Primary Guest Name</Text>
            <TextInput
              style={styles.textInput}
              value={guestName}
              onChangeText={(text) => {
                setGuestName(text);
                setSubmitError('');
              }}
              placeholder="Full name"
              editable={!submitting}
            />

            {authUser?.email ? (
              <View style={styles.accountEmailBox}>
                <Text style={styles.accountEmailLabel}>Booking Account Email</Text>
                <Text style={styles.accountEmailValue}>{authUser.email}</Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>Phone Number (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={guestPhone}
              onChangeText={setGuestPhone}
              placeholder="+94 77 000 0000"
              keyboardType="phone-pad"
              editable={!submitting}
            />

            <Text style={styles.fieldLabel}>Special Requests / Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Late check-in, dietary preferences..."
              multiline
              editable={!submitting}
            />
          </View>

          {/* Booking Summary Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Booking Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Room</Text>
              <Text style={styles.summaryVal}>
                {room.name} (Room {room.room_number})
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Dates</Text>
              <Text style={styles.summaryVal}>
                {checkIn} → {checkOut}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryVal}>
                {nights > 0 ? `${nights} ${nights === 1 ? 'night' : 'nights'}` : '—'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Guests</Text>
              <Text style={styles.summaryVal}>{guestCount}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate per night</Text>
              <Text style={styles.summaryVal}>${pricePerNight.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalVal}>${totalAmount}</Text>
            </View>
          </View>

          {submitError ? (
            <View style={styles.submitErrorBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#C53030" />
              <Text style={styles.submitErrorText}>{submitError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (submitting ||
                Boolean(dateValidationError) ||
                availabilityResult?.is_available === false) &&
                styles.primaryBtnDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleConfirmBooking}
            disabled={
              submitting ||
              Boolean(dateValidationError) ||
              availabilityResult?.is_available === false
            }
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Confirm Booking</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: 16,
    paddingBottom: 36,
  },
  centerFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE8E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  brand: {
    color: '#347F8C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#263B39',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE8E0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263B39',
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#77766F',
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#FAF9F4',
    borderWidth: 1,
    borderColor: '#E5E2DC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#263B39',
    textAlign: 'center',
    fontWeight: '600',
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EDF2ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  availCheckingText: {
    fontSize: 12,
    color: '#5E7480',
  },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginTop: 4,
  },
  availOk: {
    backgroundColor: '#DCFCE7',
  },
  availNo: {
    backgroundColor: '#FEE2E2',
  },
  availBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  inlineErrorText: {
    color: '#C53030',
    fontSize: 12,
    flex: 1,
  },
  inlineWarnText: {
    color: '#B45309',
    fontSize: 12,
    flex: 1,
  },
  guestCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  capacityHint: {
    fontSize: 11,
    color: '#898780',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263B39',
    minWidth: 20,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#FAF9F4',
    borderWidth: 1,
    borderColor: '#E5E2DC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#263B39',
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 68,
    textAlignVertical: 'top',
    marginBottom: 0,
  },
  accountEmailBox: {
    backgroundColor: '#EDF2ED',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  accountEmailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#347F8C',
    textTransform: 'uppercase',
  },
  accountEmailValue: {
    fontSize: 13,
    color: '#263B39',
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#77766F',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#263B39',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#EAE8E0',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#263B39',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#347F8C',
  },
  submitErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEB2B2',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  submitErrorText: {
    color: '#C53030',
    fontSize: 13,
    flex: 1,
  },
  errorText: {
    color: '#C53030',
    fontSize: 14,
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: '#347F8C',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.55,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
