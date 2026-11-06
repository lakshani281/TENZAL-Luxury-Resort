import React, { useState } from 'react';
import PlanMyDayHomeScreen from './screens/PlanMyDayHomeScreen';
import PlanMyDayFormScreen from './screens/PlanMyDayFormScreen';
import PlanMyDayBudgetScreen from './screens/PlanMyDayBudgetScreen';
import PlanMyDayInterestsScreen from './screens/PlanMyDayInterestsScreen';
import PlanMyDayTravelScreen from './screens/PlanMyDayTravelScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Home');

  // Screen 5: Travel Mode Screen (Getting Around - Step 4 of 5)
  if (currentScreen === 'Travel') {
    return (
      <PlanMyDayTravelScreen
        navigation={{
          goBack: () => setCurrentScreen('Interests'),
          navigate: (screenName) => setCurrentScreen(screenName || 'Summary')
        }}
        onBack={() => setCurrentScreen('Interests')}
        onNext={() => setCurrentScreen('Summary')}
      />
    );
  }

  // Screen 4: Interests Screen (Step 3 of 5)
  if (currentScreen === 'Interests') {
    return (
      <PlanMyDayInterestsScreen
        navigation={{
          goBack: () => setCurrentScreen('Budget'),
          navigate: (screenName) => setCurrentScreen(screenName || 'Travel')
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
          navigate: (screenName) => setCurrentScreen(screenName || 'Interests')
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