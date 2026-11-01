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
          navigate: (screenName) => {
            if (screenName === 'PlanMyDayBudget' || screenName === 'Budget') {
              setCurrentScreen('Budget');
            } else if (screenName === 'PlanMyDayHome' || screenName === 'Home') {
              setCurrentScreen('Home');
            }
          }
        }} 
        onNext={() => setCurrentScreen('Budget')}
        onBack={() => setCurrentScreen('Home')}
        onNavigateToBudget={() => setCurrentScreen('Budget')}
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