'use client';

import { 
  Wallet, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { useMultiNetworkBalances, type NetworkBalance } from '@/hooks/useMultiNetworkBalances';

interface NetworkBalancesProps {
  walletAddress?: string;
}

function NetworkBalanceCard({ balance }: { balance: NetworkBalance }) {
  const hasBalance = parseFloat(balance.balanceFormatted) > 0;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {balance.tokenSymbol.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">{balance.chainName}</h3>
            <p className="text-xs text-gray-500">Chain ID: {balance.chainId}</p>
          </div>
        </div>
        
        {balance.isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        ) : balance.error ? (
          <AlertCircle className="w-4 h-4 text-red-500" />
        ) : hasBalance ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : null}
      </div>

      <div className="space-y-1">
        {balance.isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        ) : balance.error ? (
          <div className="text-red-500 text-xs">{balance.error}</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">
                {balance.balanceFormatted}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {balance.tokenSymbol}
              </span>
            </div>
            
            {balance.usdValue !== undefined && (
              <div className="text-sm text-gray-500">
                ≈ ${balance.usdValue.toFixed(2)} USD
              </div>
            )}
            
            {hasBalance && (
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <span>●</span>
                <span>Has balance</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function NetworkBalances({ walletAddress }: NetworkBalancesProps) {
  const { balances, isLoading, refetch } = useMultiNetworkBalances(walletAddress);

  if (!walletAddress) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>Connect wallet to view balances</p>
        </div>
      </div>
    );
  }

  const totalBalancesWithFunds = balances.filter(
    b => !b.isLoading && !b.error && parseFloat(b.balanceFormatted) > 0
  ).length;

  const totalUsdValue = balances.reduce((sum, balance) => {
    return sum + (balance.usdValue || 0);
  }, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Network Balances</h2>
          </div>
          <button
            onClick={refetch}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh balances"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-600 font-medium">Networks with Funds</p>
            <p className="text-xl font-bold text-blue-900">{totalBalancesWithFunds}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-600 font-medium">Total USD Value</p>
            <p className="text-xl font-bold text-green-900">
              {isLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : totalUsdValue > 0 ? (
                `$${totalUsdValue.toFixed(2)}`
              ) : (
                '$0.00'
              )}
            </p>
          </div>
        </div>

        {/* Wallet Address */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
          <div className="flex items-center justify-between">
            <code className="text-sm font-mono text-gray-700">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(walletAddress)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Balances Grid */}
      <div className="p-6">
        {balances.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading network balances...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {balances.map((balance) => (
              <NetworkBalanceCard key={balance.chainId} balance={balance} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <div className="text-xs text-gray-500 text-center">
          <p>Balances are fetched from public RPC endpoints.</p>
          <p>USD prices from CoinGecko API (free tier).</p>
        </div>
      </div>
    </div>
  );
}
