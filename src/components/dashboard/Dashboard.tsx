'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { 
  Plus, 
  FileText, 
  DollarSign, 
  Users, 
  Settings,
  LogOut,
  Bell,
  Search,
  TrendingUp,
  Calendar,
  Eye
} from 'lucide-react';

interface DashboardStats {
  totalInvoices: number;
  totalRevenue: string;
  pendingPayments: number;
  paidInvoices: number;
}

interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: string;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  currency: string;
}

export default function Dashboard() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { hasUsername, username, paymentUrl, isLoading: userDataLoading } = useUserData();
  const router = useRouter();
  const [stats] = useState<DashboardStats>({
    totalInvoices: 12,
    totalRevenue: '€15,240',
    pendingPayments: 3,
    paidInvoices: 9
  });

  const [recentInvoices] = useState<Invoice[]>([
    {
      id: '1',
      number: 'INV-001',
      client: 'Acme Corp',
      amount: '2,500',
      status: 'paid',
      dueDate: '2024-01-15',
      currency: 'USDC'
    },
    {
      id: '2',
      number: 'INV-002',
      client: 'Tech Solutions',
      amount: '1,800',
      status: 'pending',
      dueDate: '2024-01-20',
      currency: 'ETH'
    },
    {
      id: '3',
      number: 'INV-003',
      client: 'Design Studio',
      amount: '950',
      status: 'overdue',
      dueDate: '2024-01-10',
      currency: 'USDC'
    }
  ]);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    } else if (ready && authenticated && !userDataLoading) {
      // Check if user has completed username setup
      if (!hasUsername) {
        router.push('/setup-username');
      }
    }
  }, [ready, authenticated, userDataLoading, hasUsername, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getDisplayName = () => {
    if (username) return username;
    
    const email = user?.email?.address;
    if (email) return email.split('@')[0];
    
    return 'User';
  };

  const getUserInitial = () => {
    if (username) return username.charAt(0).toUpperCase();
    
    const email = user?.email?.address;
    if (email) return email.charAt(0).toUpperCase();
    
    return 'U';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">AutoMint</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Search className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getUserInitial()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-gray-900 text-sm font-medium flex items-center space-x-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {getDisplayName()}!
          </h2>
          <p className="text-gray-600">
            Here's an overview of your invoicing activity.
          </p>
          
          {/* Payment URL display */}
          {username && paymentUrl && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Your Payment URL</p>
                  <p className="font-mono text-lg font-semibold text-blue-600">
                    {paymentUrl}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(paymentUrl);
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalInvoices}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalRevenue}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingPayments}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
                <p className="text-3xl font-bold text-gray-900">{stats.paidInvoices}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions and recent invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Create Invoice</span>
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Manage Clients</span>
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent invoices */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View all
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-semibold text-gray-900">{invoice.number}</p>
                          <p className="text-sm text-gray-600">{invoice.client}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {invoice.amount} {invoice.currency}
                          </p>
                          <p className="text-sm text-gray-600">
                            Due {formatDate(invoice.dueDate)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
