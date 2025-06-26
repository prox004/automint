'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUserData } from '@/hooks/useUserData';
import NetworkBalances from '@/components/NetworkBalances';
import { NotificationBell } from '@/components/NotificationBell';

export default function DashboardPage() {
  const { ready, authenticated, user } = usePrivy();
  const { hasUsername, username, isLoading: userDataLoading } = useUserData();
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

  const walletAddress = user?.wallet?.address;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-left pl-5">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back{username ? `, ${username}` : ''}!
              </h1>
              <p className="text-gray-600 text-sm">
                Monitor your testnet balances across multiple networks
              </p>
            </div>
            
            {/* Notification Bell - Only show if wallet is connected */}
            {walletAddress && (
              <div className="pr-5">
                <NotificationBell walletAddress={walletAddress} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Network Balances */}
        <NetworkBalances walletAddress={walletAddress} />
      </div>
    </div>
  );
}
