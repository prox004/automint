'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

interface UserData {
  username?: string;
  usernamePayUrl?: string;
  setupCompleted?: boolean;
  setupDate?: string;
}

export function useUserData() {
  const { ready, authenticated, user } = usePrivy();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

    if (!authenticated) {
      setUserData(null);
      setIsLoading(false);
      return;
    }

    // First check Privy custom metadata
    const privyUsername = user?.customMetadata?.username as string;
    if (privyUsername) {
      setUserData({
        username: privyUsername,
        usernamePayUrl: user?.customMetadata?.usernamePayUrl as string || `${privyUsername}.pay`,
        setupCompleted: true,
        setupDate: user?.customMetadata?.setupDate as string,
      });
      setIsLoading(false);
      return;
    }

    // Fall back to localStorage
    try {
      const storedData = localStorage.getItem('automint_user_data');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setUserData(parsed);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error('Error reading user data:', error);
      setUserData(null);
    }
    
    setIsLoading(false);
  }, [ready, authenticated, user]);

  const updateUserData = (data: UserData) => {
    setUserData(data);
    try {
      localStorage.setItem('automint_user_data', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const clearUserData = () => {
    setUserData(null);
    try {
      localStorage.removeItem('automint_user_data');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  return {
    userData,
    isLoading,
    updateUserData,
    clearUserData,
    hasUsername: Boolean(userData?.username),
    username: userData?.username,
    paymentUrl: userData?.usernamePayUrl,
  };
}
