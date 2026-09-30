import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasTasks, setHasTasks] = useState(false); // To handle flow

  const login = async (token, hasProfileSetup, hasTasksSetup = false) => {
    setIsLoading(true);
    setUserToken(token);
    setHasProfile(hasProfileSetup);
    setHasTasks(hasTasksSetup);
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('hasProfile', hasProfileSetup ? 'true' : 'false');
    await AsyncStorage.setItem('hasTasks', hasTasksSetup ? 'true' : 'false');
    setIsLoading(false);
  };

  const completeProfile = async () => {
    setHasProfile(true);
    await AsyncStorage.setItem('hasProfile', 'true');
  };

  const completeTasks = async () => {
    setHasTasks(true);
    await AsyncStorage.setItem('hasTasks', 'true');
  };

  const logout = async () => {
    setIsLoading(true);
    setUserToken(null);
    setHasProfile(false);
    setHasTasks(false);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('hasProfile');
    await AsyncStorage.removeItem('hasTasks');
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const profile = await AsyncStorage.getItem('hasProfile');
      const tasks = await AsyncStorage.getItem('hasTasks');
      
      setUserToken(token);
      setHasProfile(profile === 'true');
      setHasTasks(tasks === 'true');
      setIsLoading(false);
    } catch (e) {
      console.log(`isLogged in error ${e}`);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, hasProfile, completeProfile, hasTasks, completeTasks }}>
      {children}
    </AuthContext.Provider>
  );
};
