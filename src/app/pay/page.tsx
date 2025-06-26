'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ethers } from 'ethers';
import { getAutoMintContract, getAutoMintContractReadOnly, isContractDeployed, formatEthAmount } from '@/lib/contract';
import { emitInvoicePaid } from '@/lib/invoiceEvents';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
  Search,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface InvoiceData {
  invoiceId: number;
  title: string;
  billedTo: string;
  clientWallet?: string;
  amount: string;
  dueDate: string;
  description: string;
  referenceNumber?: string;
  email?: string;
  taxInfo?: string;
  merchantName: string;
  merchantWallet: string;
  status: 'unpaid' | 'paid';
  createdAt: string;
  transactionHash?: string;
  paymentHash?: string;
}

function PayPageContent() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [invoiceId, setInvoiceId] = useState<string>(searchParams?.get('id') || '');
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [onChainData, setOnChainData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
    if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceId]);

  const fetchInvoiceData = async () => {
    if (!invoiceId || !isContractDeployed()) {
      setError('Invalid invoice ID or contract not deployed');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get a provider for reading contract data
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/b9980f4f63a84ea480f8e6e21477bbae');
      const contract = getAutoMintContractReadOnly(provider);

      // Fetch on-chain invoice data
      const invoiceDetails = await contract.getInvoice(Number(invoiceId));
      
      setOnChainData({
        merchant: invoiceDetails.merchant,
        amount: invoiceDetails.amount,
        metadataURI: invoiceDetails.metadataURI,
        allowedPayer: invoiceDetails.allowedPayer,
        isPaid: invoiceDetails.isPaid,
        createdAt: Number(invoiceDetails.createdAt)
      });

      // Parse metadata from contract first
      let contractMetadata = null;
      try {
        if (invoiceDetails.metadataURI && invoiceDetails.metadataURI.trim()) {
          contractMetadata = JSON.parse(invoiceDetails.metadataURI);
        }
      } catch (e) {
        console.warn('Failed to parse contract metadata:', e);
      }

      // Fetch additional metadata from Firebase
      const invoicesRef = collection(db, 'invoices');
      const q = query(invoicesRef, where('invoiceId', '==', Number(invoiceId)));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        setInvoiceData({
          invoiceId: Number(invoiceId),
          title: contractMetadata?.title || data.title || 'Invoice',
          billedTo: contractMetadata?.billedTo || data.billedTo || 'Client',
          clientWallet: data.clientWallet,
          amount: data.amount || formatEthAmount(invoiceDetails.amount),
          dueDate: contractMetadata?.dueDate || data.dueDate || new Date(Number(invoiceDetails.createdAt) * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: contractMetadata?.description || data.description || 'Payment required',
          referenceNumber: contractMetadata?.referenceNumber || data.referenceNumber,
          email: contractMetadata?.email || data.email,
          taxInfo: contractMetadata?.taxInfo || data.taxInfo,
          merchantName: data.merchantName || 'Merchant',
          merchantWallet: data.merchantWallet || invoiceDetails.merchant,
          status: invoiceDetails.isPaid ? 'paid' : 'unpaid',
          createdAt: data.createdAt || new Date(Number(invoiceDetails.createdAt) * 1000).toISOString(),
          transactionHash: data.transactionHash,
          paymentHash: data.paymentHash
        });
      } else {
        // Create invoice data from contract data and metadata
        setInvoiceData({
          invoiceId: Number(invoiceId),
          title: contractMetadata?.title || 'Invoice',
          billedTo: contractMetadata?.billedTo || 'Client',
          amount: formatEthAmount(invoiceDetails.amount),
          dueDate: contractMetadata?.dueDate || new Date(Number(invoiceDetails.createdAt) * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from creation
          description: contractMetadata?.description || 'Payment required',
          referenceNumber: contractMetadata?.referenceNumber,
          email: contractMetadata?.email,
          taxInfo: contractMetadata?.taxInfo,
          merchantName: 'Merchant',
          merchantWallet: invoiceDetails.merchant,
          status: invoiceDetails.isPaid ? 'paid' : 'unpaid',
          createdAt: new Date(Number(invoiceDetails.createdAt) * 1000).toISOString()
        });
      }
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Invoice not found or failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!invoiceData || !onChainData || !user?.wallet?.address) {
      setError('Missing invoice data or wallet not connected');
      return;
    }

    if (onChainData.isPaid) {
      setError('Invoice has already been paid');
      return;
    }

    // Check if payment is restricted to specific address
    if (onChainData.allowedPayer !== ethers.ZeroAddress && 
        onChainData.allowedPayer.toLowerCase() !== user.wallet.address.toLowerCase()) {
      setError('You are not authorized to pay this invoice');
      return;
    }

    setPaying(true);
    setError(null);

    try {
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
      const contract = getAutoMintContract(signer);

      // Calculate total amount with platform fee (1%)
      const invoiceAmount = onChainData.amount;
      // NOTE: Contract expects only the invoice amount, it calculates platform fee internally
      
      // Pay the invoice - send only the invoice amount
      const tx = await contract.payInvoice(Number(invoiceId), {
        value: invoiceAmount  // Send only invoice amount, not amount + fee
      });

      setSuccess(`Payment transaction submitted: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      setSuccess('Payment confirmed! Invoice has been paid successfully.');
      
      // Emit event to notify other components about the payment
      emitInvoicePaid({
        id: Number(invoiceId),
        transactionHash: tx.hash
      });
      
      // Update local state
      setInvoiceData(prev => prev ? { ...prev, status: 'paid', paymentHash: tx.hash } : null);
      setOnChainData((prev: any) => ({ ...prev, isPaid: true }));

    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const calculateTotalWithFee = () => {
    if (!onChainData) return '0';
    // The user pays only the invoice amount; platform fee is deducted from this amount
    return formatEthAmount(onChainData.amount);
  };

  const calculatePlatformFee = () => {
    if (!onChainData) return '0';
    const invoiceAmount = onChainData.amount;
    const platformFee = (invoiceAmount * BigInt(100)) / BigInt(10000); // 1% = 100/10000
    return formatEthAmount(platformFee);
  };

  const calculateMerchantReceives = () => {
    if (!onChainData) return '0';
    const invoiceAmount = onChainData.amount;
    const platformFee = (invoiceAmount * BigInt(100)) / BigInt(10000); // 1% = 100/10000
    const merchantAmount = invoiceAmount - platformFee;
    return formatEthAmount(merchantAmount);
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Pay Invoice</h1>
          <p className="text-gray-500 font-semibold">
            Secure blockchain-based invoice payment
          </p>
        </div>

        {/* Invoice ID Input */}
        {!invoiceId && (
          <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Search className="w-5 h-5 text-blue-700" />
              <span className='text-blue-700 font-semibold'>Enter Invoice ID</span>
            </h2>
            <div className="flex space-x-3 rounded-lg p-3">
              <input
                type="number"
                placeholder="Enter Invoice ID..."
                className="flex-1 px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setInvoiceId((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                  setInvoiceId(input.value);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Load Invoice
              </button>
            </div>
          </div>
        )}

        {/* Contract Status */}
        {!isContractDeployed() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Contract Not Deployed</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  The AutoMint contract hasn't been deployed yet.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading invoice details...</p>
          </div>
        )}

        {/* Error */}
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

        {/* Success */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Details */}
        {invoiceData && onChainData && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
            {/* Header */}
            <div className="border-b border-gray-100 pb-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-blue-600">INVOICE</h2>
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <button
                    onClick={() => copyToClipboard(invoiceData.invoiceId.toString())}
                    className="font-mono text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1 group"
                    title="Click to copy invoice ID"
                  >
                    <span>{invoiceData.invoiceId}</span>
                    {copiedAddress === invoiceData.invoiceId.toString() ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-1">{invoiceData.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created: {new Date(invoiceData.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {new Date(invoiceData.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Invoice Details Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* From */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-lg" />
                  <span className='text-lg'>From</span>
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-black">{invoiceData.merchantName}</p>
                  <button
                    onClick={() => copyToClipboard(invoiceData.merchantWallet)}
                    className="font-mono text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1 group"
                    title="Click to copy address"
                  >
                    <span className="break-all">{invoiceData.merchantWallet}</span>
                    {copiedAddress === invoiceData.merchantWallet ? (
                      <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* To */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-lg" />
                  <span className='text-lg'>Billed To</span>
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-black">{invoiceData.billedTo}</p>
                  {invoiceData.clientWallet && (
                    <button
                      onClick={() => copyToClipboard(invoiceData.clientWallet!)}
                      className="font-mono text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1 group"
                      title="Click to copy address"
                    >
                      <span className="break-all">{invoiceData.clientWallet}</span>
                      {copiedAddress === invoiceData.clientWallet ? (
                        <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      )}
                    </button>
                  )}
                  {invoiceData.email && (
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Mail className="w-3 h-3" />
                      <span>{invoiceData.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-lg" />
                <span className='text-lg'>Description</span>
              </h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 border-2 border-gray-300 rounded-lg">
                {invoiceData.description}
              </p>
            </div>

            {/* Additional Info */}
            {(invoiceData.referenceNumber || invoiceData.taxInfo) && (
              <div className="grid md:grid-cols-2 gap-4 mb-6 text-sm">
                {invoiceData.referenceNumber && (
                  <div>
                    <span className="font-medium text-gray-700">Reference:</span>
                    <span className="ml-2 text-gray-600">{invoiceData.referenceNumber}</span>
                  </div>
                )}
                {invoiceData.taxInfo && (
                  <div>
                    <span className="font-medium text-gray-700">Tax Info:</span>
                    <span className="ml-2 text-gray-600">{invoiceData.taxInfo}</span>
                  </div>
                )}
              </div>
            )}

            {/* Amount Breakdown */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-lg" />
                <span className='text-lg'>Payment Details</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700 text-md">Total Payment Amount:</span>
                  <span className="font-medium text-blue-900">{invoiceData.amount} ETH</span>
                </div>
                <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-100 rounded">
                  <p className='text-md'><strong>How fees work:</strong></p>
                  <p>• You pay: {invoiceData.amount} ETH</p>
                  <p>• Platform fee (1%): {calculatePlatformFee()} ETH (deducted from payment)</p>
                  <p>• Merchant receives: {calculateMerchantReceives()} ETH</p>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-gray-500 text-lg" />
                <span className="text-lg font-medium text-gray-700">Payment Status:</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                invoiceData.status === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {invoiceData.status === 'paid' ? '✓ Paid' : '⏳ Pending Payment'}
              </div>
            </div>

            {/* Payment Action */}
            {invoiceData.status === 'unpaid' && authenticated && (
              <div className="space-y-4">
                {/* Wallet Connection Check */}
                {!user?.wallet?.address ? (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Connect your wallet to pay this invoice</p>
                    <button
                      onClick={() => router.push('/login')}
                      className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Connect Wallet
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handlePayInvoice}
                    disabled={paying}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {paying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Payment...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pay {calculateTotalWithFee()} ETH</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Transaction Links */}
            {(invoiceData.transactionHash || invoiceData.paymentHash) && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h4 className="font-medium text-lg text-gray-700 mb-2">Transaction History</h4>
                <div className="space-y-2 text-sm">
                  {invoiceData.transactionHash && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Invoice Creation:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copyToClipboard(invoiceData.transactionHash!)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 group"
                          title="Click to copy transaction hash"
                        >
                          <span className="font-mono text-xs">{invoiceData.transactionHash.slice(0, 10)}...</span>
                          {copiedAddress === invoiceData.transactionHash ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${invoiceData.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                  {invoiceData.paymentHash && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Payment:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copyToClipboard(invoiceData.paymentHash!)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 group"
                          title="Click to copy transaction hash"
                        >
                          <span className="font-mono text-xs">{invoiceData.paymentHash.slice(0, 10)}...</span>
                          {copiedAddress === invoiceData.paymentHash ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${invoiceData.paymentHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Network Info */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center">
              <p>Secured by smart contract on Ethereum Sepolia • AutoMint</p>
            </div>
          </div>
        )}

        {/* Not Authenticated */}
        {invoiceData && !authenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="font-medium text-blue-900 mb-2">Connect Wallet to Pay</h3>
            <p className="text-blue-700 mb-4">
              You need to connect your wallet to pay this invoice securely.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PayPageContent />
    </Suspense>
  );
}
