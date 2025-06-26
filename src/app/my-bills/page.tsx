'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { useInvoiceContext } from '@/providers/InvoiceProvider';
import { MyBillsInvoiceCard } from '@/components/MyBillsInvoiceCard';
import { ethers } from 'ethers';
import { getAutoMintContract, isContractDeployed } from '@/lib/contract';
import { 
  Plus, 
  FileText, 
  CreditCard, 
  Search, 
  ChevronDown,
  RefreshCw,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Wallet
} from 'lucide-react';

type TabType = 'created' | 'paid';
type SortOption = 'newest' | 'oldest' | 'amount-high' | 'amount-low';

export default function MyBillsPage() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { hasUsername, username, isLoading: userDataLoading } = useUserData();
  const { 
    createdInvoices, 
    paidInvoices, 
    totalCreated, 
    totalPaid, 
    isLoading: invoicesLoading, 
    error: invoicesError,
    refreshInvoices
  } = useInvoiceContext();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

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

  // Get the current tab's invoices
  const currentTabInvoices = useMemo(() => {
    return activeTab === 'created' ? createdInvoices : paidInvoices;
  }, [activeTab, createdInvoices, paidInvoices]);

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let filtered = [...currentTabInvoices];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.title.toLowerCase().includes(query) ||
        invoice.billedTo.toLowerCase().includes(query) ||
        invoice.description.toLowerCase().includes(query) ||
        invoice.id.toString().includes(query)
      );
    }

    // Sort invoices
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount-high':
          return parseFloat(b.amount) - parseFloat(a.amount);
        case 'amount-low':
          return parseFloat(a.amount) - parseFloat(b.amount);
        default:
          return 0;
      }
    });

    return filtered;
  }, [currentTabInvoices, searchQuery, sortBy]);

  // Calculate earnings summary
  const earningsSummary = useMemo(() => {
    const totalEarned = paidInvoices.reduce((sum: number, invoice) => 
      sum + parseFloat(invoice.amount), 0);
    const withdrawnAmount = paidInvoices
      .filter(invoice => invoice.withdrawn)
      .reduce((sum: number, invoice) => sum + parseFloat(invoice.amount), 0);
    const availableToWithdraw = paidInvoices
      .filter(invoice => !invoice.withdrawn)
      .reduce((sum: number, invoice) => sum + parseFloat(invoice.amount), 0);
    
    const totalPlatformFees = totalEarned * 0.01; // 1% platform fee
    const withdrawnPlatformFees = withdrawnAmount * 0.01;
    const availablePlatformFees = availableToWithdraw * 0.01;
    
    const totalNetEarnings = totalEarned - totalPlatformFees;
    const withdrawnNetEarnings = withdrawnAmount - withdrawnPlatformFees;
    const availableNetEarnings = availableToWithdraw - availablePlatformFees;
    
    return {
      totalEarned: totalEarned.toFixed(4),
      withdrawnAmount: withdrawnAmount.toFixed(4),
      availableToWithdraw: availableToWithdraw.toFixed(4),
      platformFees: totalPlatformFees.toFixed(4),
      netEarnings: totalNetEarnings.toFixed(4),
      withdrawnNetEarnings: withdrawnNetEarnings.toFixed(4),
      availableNetEarnings: availableNetEarnings.toFixed(4)
    };
  }, [paidInvoices]);

  const handleWithdraw = async (invoiceId: number) => {
    if (!isContractDeployed()) {
      throw new Error('Smart contract not deployed');
    }

    if (!user?.wallet?.address) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get wallet provider and signer
      const wallet = wallets.find(w => w.address === user.wallet!.address);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const walletProvider = await wallet.getEthereumProvider();
      const provider = new ethers.BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      
      // Get contract instance
      const contract = getAutoMintContract(signer);

      // Call withdrawInvoiceFunds function
      const tx = await contract.withdrawInvoiceFunds(invoiceId);
      
      // Wait for transaction confirmation
      await tx.wait();

      // Refresh invoices to update the UI
      await refreshInvoices();
      
      return tx;
    } catch (err) {
      console.error('Withdrawal error:', err);
      throw err;
    }
  };

  if (!ready || !authenticated || userDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bills</h1>
              <p className="text-gray-600 text-sm">
                Manage your created and paid invoices
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshInvoices}
                disabled={invoicesLoading}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="Refresh invoices"
              >
                <RefreshCw className={`w-4 h-4 ${invoicesLoading ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={() => router.push('/create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Summary - Show only on Created Bills tab */}
      {activeTab === 'created' && totalCreated > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available to Withdraw</p>
                    <p className="text-lg font-bold text-gray-900">{earningsSummary.availableNetEarnings} ETH</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Already Withdrawn</p>
                    <p className="text-lg font-bold text-gray-900">{earningsSummary.withdrawnNetEarnings} ETH</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-lg font-bold text-gray-900">{earningsSummary.netEarnings} ETH</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {invoicesError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="max-w-4xl mx-auto flex">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{invoicesError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('created')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                activeTab === 'created'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className='text-lg'>Created Bills</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {totalCreated}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                activeTab === 'paid'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className='text-lg'>Paid Bills</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {totalPaid}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-black border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none text-black bg-gray-100 border-2 border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Amount: High to Low</option>
              <option value="amount-low">Amount: Low to High</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {invoicesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              {activeTab === 'created' ? (
                <FileText className="w-8 h-8 text-gray-400" />
              ) : (
                <CreditCard className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery.trim() ? 'No matching invoices found' : 
                activeTab === 'created' ? 'No created bills yet' : 'No paid bills yet'
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery.trim() ? 'Try adjusting your search terms' :
                activeTab === 'created' 
                  ? 'Create your first invoice to get started'
                  : 'Paid invoices will appear here'
              }
            </p>
            {!searchQuery.trim() && activeTab === 'created' && (
              <button
                onClick={() => router.push('/create')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Invoice</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredInvoices.map((invoice) => (
              <MyBillsInvoiceCard
                key={invoice.id}
                invoice={invoice}
                viewType={activeTab}
                onWithdraw={handleWithdraw}
                onCopyLink={() => {
                  // Optional: Add analytics or toast notification here
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
