import React, { useState } from 'react';
import PlanMyDayHomeScreen from './screens/PlanMyDayHomeScreen';
import PlanMyDayFormScreen from './screens/PlanMyDayFormScreen';
import PlanMyDayBudgetScreen from './screens/PlanMyDayBudgetScreen';
import PlanMyDayInterestsScreen from './screens/PlanMyDayInterestsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Home');

  // Screen 4: Interests Screen
  if (currentScreen === 'Interests') {
    return (
      <PlanMyDayInterestsScreen
        navigation={{
          goBack: () => setCurrentScreen('Budget'),
          navigate: (screenName) => setCurrentScreen(screenName || 'Summary')
        }}
        onBack={() => setCurrentScreen('Budget')}
        onNext={() => setCurrentScreen('Summary')}
      />
    );
  }

  // Screen 3: Budget Screen
  if (currentScreen === 'Budget') {
    return (
      <PlanMyDayBudgetScreen 
        navigation={{ 
          goBack: () => setCurrentScreen('Form'),
          navigate: (screenName) => setCurrentScreen(screenName || 'Interests')
        }} 
        onBack={() => setCurrentScreen('Form')}
        onNext={() => setCurrentScreen('Interests')}
      />
    );
  }

  // Screen 2: Form Screen
  if (currentScreen === 'Form') {
    return (
      <PlanMyDayFormScreen 
        navigation={{ 
          goBack: () => setCurrentScreen('Home'),
          navigate: (screenName) => setCurrentScreen(screenName || 'Budget')
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