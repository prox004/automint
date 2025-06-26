'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuthFlow() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();

  const hasUsername = ready && authenticated && user?.customMetadata?.username;
  const isLoading = !ready;

  useEffect(() => {
    if (!ready) return;

    if (!authenticated) {
      // Not authenticated, redirect to home/login
      router.push('/');
    } else if (authenticated && user) {
      // Authenticated but check username setup
      const username = user.customMetadata?.username;
      const currentPath = window.location.pathname;
      
      if (!username && currentPath !== '/setup-username') {
        // No username, redirect to setup
        router.push('/setup-username');
      } else if (username && currentPath === '/setup-username') {
        // Has username but on setup page, redirect to dashboard
        router.push('/dashboard');
      }
    }
  }, [ready, authenticated, user, router]);

  return {
    ready,
    authenticated,
    user,
    hasUsername,
    isLoading,
    username: user?.customMetadata?.username as string,
    paymentUrl: user?.customMetadata?.usernamePayUrl as string || (user?.customMetadata?.username ? `${user.customMetadata.username}.pay` : ''),
  };
}
