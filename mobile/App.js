import React, { useState } from 'react';
import PlanMyDayHomeScreen from './screens/PlanMyDayHomeScreen';
import PlanMyDayFormScreen from './screens/PlanMyDayFormScreen';
import PlanMyDayBudgetScreen from './screens/PlanMyDayBudgetScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Home');

  // Screen 3: Budget Screen
  if (currentScreen === 'Budget') {
    return (
      <PlanMyDayBudgetScreen 
        navigation={{ 
          goBack: () => setCurrentScreen('Form') 
        }} 
        onBack={() => setCurrentScreen('Form')}
      />
    );
  }

  // Screen 2: Form Screen
  if (currentScreen === 'Form') {
    return (
      <PlanMyDayFormScreen 
        navigation={{ 
          goBack: () => setCurrentScreen('Home'),
          navigate: (screenName) => setCurrentScreen('Budget')
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