import React, { useState } from 'react';
import PlanMyDayHomeScreen from './screens/PlanMyDayHomeScreen';
import PlanMyDayFormScreen from './screens/PlanMyDayFormScreen';
import PlanMyDayBudgetScreen from './screens/PlanMyDayBudgetScreen';
import PlanMyDayInterestsScreen from './screens/PlanMyDayInterestsScreen';
import PlanMyDayTravelScreen from './screens/PlanMyDayTravelScreen';
import PlanMyDayTravellersScreen from './screens/PlanMyDayTravellersScreen';
import PlanMyDaySummaryScreen from './screens/PlanMyDaySummaryScreen';
import LoginScreen from './screens/LoginScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Home');

  // Login Screen
  if (currentScreen === 'Login') {
    return (
      <LoginScreen
        navigation={{
          goBack: () => setCurrentScreen('Summary'),
          navigate: (screenName) => setCurrentScreen(screenName || 'Summary'),
        }}
        onBack={() => setCurrentScreen('Summary')}
        onSignIn={(credentials) => {
          console.log('Signed in:', credentials);
          setCurrentScreen('Summary');
        }}
        onForgotPassword={() => {
          console.log('Forgot Password clicked');
        }}
        onCreateAccount={() => {
          console.log('Create Account clicked');
        }}
      />
    );
  }

  // Screen 7: Summary Screen (Generated Itinerary & Login Modal Prompt)
  if (currentScreen === 'Summary') {
    return (
      <PlanMyDaySummaryScreen
        navigation={{
          goBack: () => setCurrentScreen('Travellers'),
          navigate: (screenName) => setCurrentScreen(screenName || 'Home'),
        }}
        onBack={() => setCurrentScreen('Travellers')}
        onEdit={() => setCurrentScreen('Form')}
        onRegenerate={() => setCurrentScreen('Form')}
        onLogin={() => setCurrentScreen('Login')}
        onCreateAccount={() => {
          console.log('Redirecting to Create Account Screen');
        }}
      />
    );
  }

  // Screen 6: Travellers Screen (Step 5 of 5)
  if (currentScreen === 'Travellers') {
    return (
      <PlanMyDayTravellersScreen
        navigation={{
          goBack: () => setCurrentScreen('Travel'),
          navigate: (screenName) => setCurrentScreen(screenName || 'Summary'),
        }}
        onBack={() => setCurrentScreen('Travel')}
        onNext={() => setCurrentScreen('Summary')}
      />
    );
  }

  // Screen 5: Travel Mode Screen (Step 4 of 5)
  if (currentScreen === 'Travel') {
    return (
      <PlanMyDayTravelScreen
        navigation={{
          goBack: () => setCurrentScreen('Interests'),
          navigate: (screenName) => setCurrentScreen(screenName || 'Travellers'),
        }}
        onBack={() => setCurrentScreen('Interests')}
        onNext={() => setCurrentScreen('Travellers')}
      />
    );
  }

  // Screen 4: Interests Screen (Step 3 of 5)
  if (currentScreen === 'Interests') {
    return (
      <PlanMyDayInterestsScreen
        navigation={{
          goBack: () => setCurrentScreen('Budget'),
          navigate: (screenName) => setCurrentScreen(screenName || 'Travel'),
        }}
        onBack={() => setCurrentScreen('Budget')}
        onNext={() => setCurrentScreen('Travel')}
      />
    );
  }

  // Screen 3: Budget Screen (Step 2 of 5)
  if (currentScreen === 'Budget') {
    return (
      <PlanMyDayBudgetScreen
        navigation={{
          goBack: () => setCurrentScreen('Form'),
          navigate: (screenName) => setCurrentScreen(screenName || 'Interests'),
        }}
        onBack={() => setCurrentScreen('Form')}
        onNext={() => setCurrentScreen('Interests')}
      />
    );
  }

  // Screen 2: Form Screen (Step 1 of 5)
  if (currentScreen === 'Form') {
    return (
      <PlanMyDayFormScreen
        navigation={{
          goBack: () => setCurrentScreen('Home'),
          navigate: (screenName) => setCurrentScreen(screenName || 'Budget'),
        }}
        onNext={() => setCurrentScreen('Budget')}
        onBack={() => setCurrentScreen('Home')}
      />
    );
  }

  // Screen 1: Home Screen (Default)
  return (
    <PlanMyDayHomeScreen
      onNavigateToForm={() => setCurrentScreen('Form')}
    />
  );
}