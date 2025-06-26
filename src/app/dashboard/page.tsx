'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUserData } from '@/hooks/useUserData';

export default function DashboardPage() {
  const { ready, authenticated } = usePrivy();
  const { hasUsername, isLoading: userDataLoading } = useUserData();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    
    if (!authenticated) {
      router.push('/');
      return;
    }
    
    if (!userDataLoading && !hasUsername) {
      router.push('/setup-username');
    }
  }, [ready, authenticated, userDataLoading, hasUsername, router]);

  if (!ready || !authenticated || userDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <p className="text-gray-600 text-lg">Coming Soon</p>
      </div>
    </div>
  );
}
