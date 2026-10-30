import React, { useState } from 'react';
import PlanMyDayHomeScreen from './screens/PlanMyDayHomeScreen';
import PlanMyDayFormScreen from './screens/PlanMyDayFormScreen';

export default function App() {
  
  const [currentScreen, setCurrentScreen] = useState('Home');

  if (currentScreen === 'Form') {
    return (
      <PlanMyDayFormScreen 
        navigation={{ 
          goBack: () => setCurrentScreen('Home') 
        }} 
      />
    );
  }

  return (
    <PlanMyDayHomeScreen 
      onNavigateToForm={() => setCurrentScreen('Form')} 
    />
  );
}