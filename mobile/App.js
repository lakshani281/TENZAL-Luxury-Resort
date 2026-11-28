import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import RoomsScreen from './screens/RoomsScreen';
import RoomDetailsScreen from './screens/RoomDetailsScreen';
import RoomBookingScreen from './screens/RoomBookingScreen';
import BookingConfirmationScreen from './screens/BookingConfirmationScreen';
import ProfileScreen from './screens/ProfileScreen';
import DestinationListScreen from './screens/DestinationListScreen';
import DestinationDetailsScreen from './screens/DestinationDetailsScreen';
import FoodMenuScreen from './screens/FoodMenuScreen';
import PlanMyDayHomeScreen from './screens/PlanMyDayHomeScreen';
import PlanMyDayFormScreen from './screens/PlanMyDayFormScreen';
import PlanMyDayBudgetScreen from './screens/PlanMyDayBudgetScreen';
import PlanMyDayInterestsScreen from './screens/PlanMyDayInterestsScreen';
import PlanMyDayTravelScreen from './screens/PlanMyDayTravelScreen';
import PlanMyDayTravellersScreen from './screens/PlanMyDayTravellersScreen';
import PlanMyDaySummaryScreen from './screens/PlanMyDaySummaryScreen';
import LoginScreen from './screens/LoginScreen';
import CreateAccountScreen from './screens/CreateAccountScreen';
import PlanSavedScreen from './screens/PlanSavedScreen';
import SavedPlansScreen from './screens/SavedPlansScreen';

import {
  getAuthToken,
  getAuthUser,
  clearAuthSession,
  isTokenExpired,
  login as loginGuest,
  register as registerGuest,
  logout as logoutGuest,
} from './services/authStorage';

const MAIN_TABS = new Set(['Home', 'Rooms', 'Explore', 'Plan', 'Profile']);

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReturnScreen, setAuthReturnScreen] = useState('Profile');

  // Restore authenticated session on startup if a valid, non-expired token exists
  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      try {
        const token = await getAuthToken();
        const user = await getAuthUser();
        if (token && !isTokenExpired(token)) {
          if (mounted) {
            setAuthUser(user);
            setIsLoggedIn(true);
          }
        } else if (token) {
          await clearAuthSession();
        }
      } catch {
        // Ignore storage read failures on startup
      }
    }
    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const navigateTo = (screenName) => {
    if (screenName !== 'DestinationDetails') {
      setSelectedDestination(null);
    }
    setCurrentScreen(screenName || 'Home');
  };

  const handleTabPress = (tabName) => {
    if (MAIN_TABS.has(tabName)) {
      navigateTo(tabName);
    }
  };

  const openAuthScreen = (targetScreen, returnTo) => {
    setAuthReturnScreen(returnTo || currentScreen || 'Profile');
    navigateTo(targetScreen);
  };

  const handleSignIn = async ({ email, password }) => {
    const result = await loginGuest({ email, password });
    setAuthUser(result.user);
    setIsLoggedIn(true);
    navigateTo(authReturnScreen === 'Summary' ? 'PlanSaved' : authReturnScreen || 'Profile');
  };

  const handleSignUp = async ({ fullName, email, phoneNumber, password }) => {
    const result = await registerGuest({
      name: fullName,
      email,
      phone: phoneNumber,
      password,
    });
    setAuthUser(result.user);
    setIsLoggedIn(true);
    navigateTo(authReturnScreen === 'Summary' ? 'PlanSaved' : authReturnScreen || 'Profile');
  };

  const handleSignOut = async () => {
    await logoutGuest();
    setAuthUser(null);
    setIsLoggedIn(false);
    navigateTo('Profile');
  };

  const navigationProp = {
    navigate: (screenName) => navigateTo(screenName),
    goBack: () => navigateTo('Home'),
  };

  const renderScreen = () => {
    // Food Ordering Flow
    if (currentScreen === 'FoodMenu') {
      return (
        <FoodMenuScreen
          navigation={navigationProp}
          onBack={() => navigateTo('Home')}
        />
      );
    }

    // Explore / Destinations Flow
    if (currentScreen === 'Explore') {
      if (selectedDestination) {
        return (
          <DestinationDetailsScreen
            destination={selectedDestination}
            onBack={() => setSelectedDestination(null)}
          />
        );
      }
      return (
        <DestinationListScreen
          onDestinationPress={(destination) => setSelectedDestination(destination)}
          onTabPress={handleTabPress}
        />
      );
    }

    // Room Booking Flow
    if (currentScreen === 'BookingConfirmation') {
      return (
        <BookingConfirmationScreen
          booking={confirmedBooking}
          onReturnHome={() => navigateTo('Home')}
          onBrowseRooms={() => navigateTo('Rooms')}
        />
      );
    }

    if (currentScreen === 'RoomBooking') {
      return (
        <RoomBookingScreen
          room={selectedRoom}
          authUser={authUser}
          onBack={() => navigateTo('RoomDetails')}
          onRequireLogin={() => openAuthScreen('Login', 'RoomBooking')}
          onBookingConfirmed={(booking) => {
            setConfirmedBooking(booking);
            navigateTo('BookingConfirmation');
          }}
        />
      );
    }

    if (currentScreen === 'RoomDetails') {
      return (
        <RoomDetailsScreen
          room={selectedRoom}
          isLoggedIn={isLoggedIn}
          onBack={() => navigateTo('Rooms')}
          onBookRoom={(room) => {
            setSelectedRoom(room);
            navigateTo('RoomBooking');
          }}
          onRequireLogin={(room) => {
            if (room) setSelectedRoom(room);
            openAuthScreen('Login', 'RoomBooking');
          }}
        />
      );
    }

    if (currentScreen === 'Rooms') {
      return (
        <RoomsScreen
          isLoggedIn={isLoggedIn}
          onTabPress={handleTabPress}
          onSelectRoom={(room) => {
            setSelectedRoom(room);
            navigateTo('RoomDetails');
          }}
          onRequireLogin={() => openAuthScreen('Login', 'Rooms')}
        />
      );
    }

    // Profile Flow
    if (currentScreen === 'Profile') {
      return (
        <ProfileScreen
          isLoggedIn={isLoggedIn}
          authUser={authUser}
          onTabPress={handleTabPress}
          onSignIn={() => openAuthScreen('Login', 'Profile')}
          onCreateAccount={() => openAuthScreen('CreateAccount', 'Profile')}
          onSignOut={handleSignOut}
          onOpenSavedPlans={() => {
            if (isLoggedIn) {
              navigateTo('SavedPlans');
            } else {
              openAuthScreen('Login', 'SavedPlans');
            }
          }}
          onOpenFoodMenu={() => navigateTo('FoodMenu')}
        />
      );
    }

    // Authentication Flow
    if (currentScreen === 'CreateAccount') {
      return (
        <CreateAccountScreen
          navigation={navigationProp}
          onBack={() => navigateTo(authReturnScreen || 'Home')}
          onSignUp={handleSignUp}
          onSignInLink={() => navigateTo('Login')}
        />
      );
    }

    if (currentScreen === 'Login') {
      return (
        <LoginScreen
          navigation={navigationProp}
          onBack={() => navigateTo(authReturnScreen || 'Home')}
          onSignIn={handleSignIn}
          onForgotPassword={() => {}}
          onCreateAccount={() => navigateTo('CreateAccount')}
        />
      );
    }

    // Plan My Day Flow
    if (currentScreen === 'SavedPlans') {
      return (
        <SavedPlansScreen
          navigation={{
            goBack: () => navigateTo(isLoggedIn ? 'Profile' : 'Summary'),
            navigate: (screenName) => navigateTo(screenName || 'Summary'),
          }}
          onBack={() => navigateTo(isLoggedIn ? 'Profile' : 'Summary')}
          onSelectPlan={() => navigateTo('Summary')}
        />
      );
    }

    if (currentScreen === 'PlanSaved') {
      return (
        <PlanSavedScreen
          navigation={navigationProp}
          onViewItinerary={() => navigateTo('SavedPlans')}
          onBackToHome={() => navigateTo('Home')}
        />
      );
    }

    if (currentScreen === 'Summary') {
      return (
        <PlanMyDaySummaryScreen
          isLoggedIn={isLoggedIn}
          navigation={{
            goBack: () => navigateTo('Travellers'),
            navigate: (screenName) => navigateTo(screenName || 'Home'),
          }}
          onBack={() => navigateTo('Travellers')}
          onEdit={() => navigateTo('Form')}
          onRegenerate={() => navigateTo('Form')}
          onLogin={() => openAuthScreen('Login', 'Summary')}
          onCreateAccount={() => openAuthScreen('CreateAccount', 'Summary')}
          onSavePlanDirect={() => navigateTo('PlanSaved')}
          onViewSavedPlansDirect={() => navigateTo('SavedPlans')}
        />
      );
    }

    if (currentScreen === 'Travellers') {
      return (
        <PlanMyDayTravellersScreen
          navigation={{
            goBack: () => navigateTo('Travel'),
            navigate: (screenName) => navigateTo(screenName || 'Summary'),
          }}
          onBack={() => navigateTo('Travel')}
          onNext={() => navigateTo('Summary')}
        />
      );
    }

    if (currentScreen === 'Travel') {
      return (
        <PlanMyDayTravelScreen
          navigation={{
            goBack: () => navigateTo('Interests'),
            navigate: (screenName) => navigateTo(screenName || 'Travellers'),
          }}
          onBack={() => navigateTo('Interests')}
          onNext={() => navigateTo('Travellers')}
        />
      );
    }

    if (currentScreen === 'Interests') {
      return (
        <PlanMyDayInterestsScreen
          navigation={{
            goBack: () => navigateTo('Budget'),
            navigate: (screenName) => navigateTo(screenName || 'Travel'),
          }}
          onBack={() => navigateTo('Budget')}
          onNext={() => navigateTo('Travel')}
        />
      );
    }

    if (currentScreen === 'Budget') {
      return (
        <PlanMyDayBudgetScreen
          navigation={{
            goBack: () => navigateTo('Form'),
            navigate: (screenName) => navigateTo(screenName || 'Interests'),
          }}
          onBack={() => navigateTo('Form')}
          onNext={() => navigateTo('Interests')}
        />
      );
    }

    if (currentScreen === 'Form') {
      return (
        <PlanMyDayFormScreen
          navigation={{
            goBack: () => navigateTo('Plan'),
            navigate: (screenName) => navigateTo(screenName || 'Budget'),
          }}
          onNext={() => navigateTo('Budget')}
          onBack={() => navigateTo('Plan')}
        />
      );
    }

    if (currentScreen === 'Plan') {
      return (
        <PlanMyDayHomeScreen
          navigation={navigationProp}
          onNavigateToForm={() => navigateTo('Form')}
          onBack={() => navigateTo('Home')}
          onTabPress={handleTabPress}
        />
      );
    }

    // Default: Home Tab
    return (
      <HomeScreen
        isLoggedIn={isLoggedIn}
        authUser={authUser}
        onTabPress={handleTabPress}
        onOpenFoodMenu={() => navigateTo('FoodMenu')}
        onOpenExplore={() => navigateTo('Explore')}
        onOpenPlan={() => navigateTo('Plan')}
        onOpenRooms={() => navigateTo('Rooms')}
        onOpenLogin={() => openAuthScreen('Login', 'Home')}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F4',
  },
});
