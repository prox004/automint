'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { 
  User, 
  Wallet, 
  LogOut, 
  Download,
  Camera,
  Copy,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { username, isLoading: userDataLoading } = useUserData();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleCopyAddress = async () => {
    const address = user?.wallet?.address;
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const handleExportWallet = () => {
    // This would be implemented with Privy's embedded wallet export functionality
    // For now, we'll show an alert
    alert('Wallet export functionality will be available soon. This feature requires additional Privy SDK integration.');
  };

  const getWalletAddress = () => {
    const address = user?.wallet?.address;
    if (!address) return 'Not connected';
    
    // Format as shortened address
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getFullWalletAddress = () => {
    return user?.wallet?.address || '';
  };

  const getLoginMethod = () => {
    if (user?.email?.address) return 'Email';
    if (user?.wallet) return 'Embedded Wallet';
    if (user?.google) return 'Google';
    if (user?.twitter) return 'Twitter';
    return 'Unknown';
  };

  const getUserInitial = () => {
    if (username) return username.charAt(0).toUpperCase();
    
    const email = user?.email?.address;
    if (email) return email.charAt(0).toUpperCase();
    
    return 'U';
  };

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {getUserInitial()}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 bg-gray-800 rounded-full p-2 text-white shadow-lg">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {username ? `${username}.pay` : 'User'}
              </h2>
              <p className="text-gray-600 text-sm">
                Connected via {getLoginMethod()}
              </p>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Wallet Address</span>
              </div>
              <button
                onClick={handleCopyAddress}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-gray-900 font-mono text-sm">
              {getWalletAddress()}
            </p>
            {getFullWalletAddress() && (
              <p className="text-xs text-gray-500 mt-1 font-mono break-all">
                {getFullWalletAddress()}
              </p>
            )}
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
            
            <div className="space-y-3">
              {/* Export Wallet */}
              <button
                onClick={handleExportWallet}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Download className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Export Wallet</p>
                    <p className="text-sm text-gray-600">Download recovery phrase</p>
                  </div>
                </div>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <LogOut className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-red-900">Sign Out</p>
                    <p className="text-sm text-red-600">Log out of your account</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium">App Version:</span> 1.0.0</p>
            <p><span className="font-medium">Network:</span> Ethereum</p>
            <p><span className="font-medium">Build:</span> Production</p>
          </div>
        </div>
      </div>
    </div>
  );
}
