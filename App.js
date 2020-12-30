import React from 'react';
import 'react-native-gesture-handler';
import { View, StatusBar } from 'react-native';
import firebase from './src/services/firebaseConnection';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-community/async-storage'

import AuthProvider from './src/contexts/auth'

import Routes from './src/routes';

console.disableYellowBox = true;

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <StatusBar backgroundColor='#131313' barStyle='light-content' />
        <Routes />
      </AuthProvider>
    </NavigationContainer>
  );
}