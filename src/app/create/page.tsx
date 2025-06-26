'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { InvoiceCard } from '@/components/InvoiceCard';
import { ethers } from 'ethers';
import { getAutoMintContract, isContractDeployed, parseEthAmount, createInvoiceMetadata } from '@/lib/contract';
import { emitInvoiceCreated } from '@/lib/invoiceEvents';
import { sendNotification } from '@/lib/notifications';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Receipt, 
  DollarSign, 
  User, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  Calendar,
  Hash,
  Mail,
  CreditCard,
  CurrencyIcon,
  Currency,
  Copy,
  Check
} from 'lucide-react';

export default function CreatePage() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const { hasUsername, username, isLoading: userDataLoading } = useUserData();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    billedTo: '',
    clientWallet: '',
    amount: '',
    dueDate: '',
    description: '',
    referenceNumber: '',
    email: '',
    taxInfo: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Copy address utility function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Please enter an invoice title');
      return false;
    }

    if (!formData.billedTo.trim()) {
      setError('Please enter the client/company name');
      return false;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return false;
    }
    
    if (!formData.description.trim()) {
      setError('Please enter a description for your invoice');
      return false;
    }

    if (!formData.dueDate) {
      setError('Please select a due date');
      return false;
    }

    // Validate client wallet address if provided
    if (formData.clientWallet && !/^0x[a-fA-F0-9]{40}$/.test(formData.clientWallet)) {
      setError('Please enter a valid Ethereum address for the client wallet');
      return false;
    }

    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatedInvoice(null);

    if (!validateForm()) return;

    if (!isContractDeployed()) {
      setError('Contract not deployed yet. Please deploy the contract first.');
      return;
    }

    if (!user?.wallet?.address) {
      setError('Wallet not connected');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get wallet provider and signer
      if (!user?.wallet?.address) {
        throw new Error('Wallet not connected');
      }

      const wallet = wallets.find(w => w.address === user.wallet!.address);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const walletProvider = await wallet.getEthereumProvider();
      const provider = new ethers.BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      
      // Get contract instance
      const contract = getAutoMintContract(signer);

      // Convert amount to wei
      const amountWei = parseEthAmount(formData.amount);
      
      // Create metadata URI using helper function
      const metadataURI = createInvoiceMetadata({
        title: formData.title,
        description: formData.description,
        billedTo: formData.billedTo,
        dueDate: formData.dueDate,
        referenceNumber: formData.referenceNumber,
        email: formData.email,
        taxInfo: formData.taxInfo
      });
      
      // Create invoice on-chain
      const tx = await contract.createInvoice(
        amountWei,
        metadataURI,
        formData.clientWallet || ethers.ZeroAddress // Use zero address if no specific payer
      );

      const receipt = await tx.wait();
      
      // Get invoice ID from event
      const invoiceCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'InvoiceCreated';
        } catch {
          return false;
        }
      });

      if (!invoiceCreatedEvent) {
        throw new Error('Invoice creation event not found');
      }

      const parsedEvent = contract.interface.parseLog(invoiceCreatedEvent);
      if (!parsedEvent || !parsedEvent.args) {
        throw new Error('Failed to parse invoice creation event');
      }
      
      const invoiceId = Number(parsedEvent.args.invoiceId);

      // Store metadata in Firebase
      const invoiceData = {
        invoiceId,
        title: formData.title,
        billedTo: formData.billedTo,
        clientWallet: formData.clientWallet || null,
        amount: formData.amount,
        dueDate: formData.dueDate,
        description: formData.description,
        referenceNumber: formData.referenceNumber || null,
        email: formData.email || null,
        taxInfo: formData.taxInfo || null,
        merchantName: username || 'Unknown',
        merchantWallet: user.wallet.address,
        status: 'unpaid',
        createdAt: new Date().toISOString(),
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        createdBy: user.id,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'invoices'), invoiceData);

      // Send notification to client if wallet address is specified
      if (formData.clientWallet) {
        try {
          await sendNotification(
            formData.clientWallet,
            invoiceId,
            'New Invoice Received',
            `You have received an invoice of ${formData.amount} ETH from ${username || 'AutoMint Merchant'}.`,
            username || 'AutoMint Merchant',
            formData.amount
          );
          console.log('Notification sent to client successfully');
        } catch (notificationError) {
          console.warn('Failed to send notification to client:', notificationError);
          // Don't fail the invoice creation if notification fails
        }
      }

      setCreatedInvoice({
        id: invoiceId,
        ...invoiceData
      });

      // Emit event to notify other components (like My Bills) about the new invoice
      emitInvoiceCreated({
        id: invoiceId,
        title: formData.title,
        billedTo: formData.billedTo,
        amount: formData.amount,
        description: formData.description
      });

      // Reset form
      setFormData({
        title: '',
        billedTo: '',
        clientWallet: '',
        amount: '',
        dueDate: '',
        description: '',
        referenceNumber: '',
        email: '',
        taxInfo: ''
      });
    } catch (err) {
      console.error('Invoice creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ready || !authenticated || userDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show invoice card if invoice was created
  if (createdInvoice) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Created Successfully!</h1>
            <p className="text-gray-600">
              Your professional invoice has been created and stored on the blockchain
            </p>
          </div>

          <InvoiceCard 
            invoice={createdInvoice} 
            onCopyLink={() => {
              // Could add analytics or notifications here
            }}
          />

          {/* Actions */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setCreatedInvoice(null);
                setError(null);
              }}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Another Invoice
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-blue-700 mb-2">Create Professional Invoice</h1>
          <p className="text-gray-500 text-md ">
            Create a secure, blockchain-based invoice for your business
          </p>
        </div>

        {/* Contract Status */}
        {!isContractDeployed() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Contract Not Deployed</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  The AutoMint contract hasn't been deployed yet. Deploy it first using the deployment script.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-lg" />
                  <span className='text-lg'>Invoice Title *</span>
                </div>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Web Development Services - Q4 2024"
                className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* Billed To */}
            <div>
              <label htmlFor="billedTo" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-lg" />
                  <span className='text-lg'>Billed To (Company/Client Name) *</span>
                </div>
              </label>
              <input
                type="text"
                id="billedTo"
                name="billedTo"
                value={formData.billedTo}
                onChange={handleInputChange}
                placeholder="Acme Corporation Ltd."
                className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* Client Wallet and Email Row */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="clientWallet" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-lg" />
                    <span className='text-lg'>Client Wallet Address (Optional)</span>
                  </div>
                </label>
                <input
                  type="text"
                  id="clientWallet"
                  name="clientWallet"
                  value={formData.clientWallet}
                  onChange={handleInputChange}
                  placeholder="0x742d35Cc6Bf4532C0532..."
                  className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Restrict payment to this address only
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-lg" />
                    <span className='text-lg'>Email (Optional)</span>
                  </div>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="client@acme.com"
                  className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Amount and Due Date Row */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-lg" />
                    <span className='text-lg'>Amount (ETH) *</span>
                  </div>
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="0.0001"
                  min="0"
                  placeholder="2.5"
                  className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-lg" />
                    <span className='text-lg'>Due Date *</span>
                  </div>
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-lg" />
                  <span className='text-lg'>Item Description *</span>
                </div>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Full-stack web application development including frontend, backend, and database implementation..."
                className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 hover:border-blue-500 transition-colors resize-none"
                required
              />
            </div>

            {/* Reference Number and Tax Info Row */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-lg" />
                    <span className='text-lg'>Reference Number / PO (Optional)</span>
                  </div>
                </label>
                <input
                  type="text"
                  id="referenceNumber"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleInputChange}
                  placeholder="PO-2024-001"
                  className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="taxInfo" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-lg" />
                    <span className='text-lg'>GST / Tax Info (Optional)</span>
                  </div>
                </label>
                <input
                  type="text"
                  id="taxInfo"
                  name="taxInfo"
                  value={formData.taxInfo}
                  onChange={handleInputChange}
                  placeholder="GST: 123456789"
                  className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Current User Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2 text-lg">Invoice Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Merchant:</span>
                  <span className="font-mono">{username || 'You'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Wallet:</span>
                  {user?.wallet?.address ? (
                    <button
                      onClick={() => copyToClipboard(user.wallet!.address)}
                      className="font-mono text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1 group"
                      title="Click to copy full address"
                    >
                      <span>{user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}</span>
                      {copiedAddress === user.wallet.address ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  ) : (
                    <span className="font-mono">Not connected</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span>Ethereum Sepolia</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee:</span>
                  <span>1% (deducted from payment)</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !isContractDeployed()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Invoice...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Create Professional Invoice</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Your invoice will be securely stored on the blockchain. Share the payment link with your client for secure payment processing.
          </p>
        </div>
      </div>
    </div>
  );
}
