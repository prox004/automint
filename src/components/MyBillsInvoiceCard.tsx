import { useState } from 'react';
import { InvoiceCard } from './InvoiceCard';
import { InvoiceData } from '@/hooks/useInvoices';
import { 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  DollarSign,
  ExternalLink
} from 'lucide-react';

interface MyBillsInvoiceCardProps {
  invoice: InvoiceData;
  viewType: 'created' | 'paid';
  onWithdraw?: (invoiceId: number) => Promise<void>;
  onCopyLink?: () => void;
}

export function MyBillsInvoiceCard({ 
  invoice, 
  viewType, 
  onWithdraw, 
  onCopyLink
}: MyBillsInvoiceCardProps) {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [isWithdrawn, setIsWithdrawn] = useState(false);

  const handleWithdraw = async () => {
    if (!onWithdraw) return;

    setIsWithdrawing(true);
    setWithdrawError(null);

    try {
      await onWithdraw(invoice.id);
      setIsWithdrawn(true);
    } catch (error) {
      setWithdrawError(error instanceof Error ? error.message : 'Withdrawal failed');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const calculatePlatformFee = () => {
    const amount = parseFloat(invoice.amount);
    return (amount * 0.01).toFixed(4); // 1% platform fee
  };

  const calculateMerchantReceives = () => {
    const amount = parseFloat(invoice.amount);
    const fee = amount * 0.01;
    return (amount - fee).toFixed(4);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Enhanced Status Bar for Created Bills */}
      {viewType === 'created' && (
        <div className={`px-6 py-3 border-b border-gray-100 ${
          invoice.status === 'paid' ? 'bg-green-50' : 'bg-yellow-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {invoice.status === 'paid' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              )}
              <span className={`text-sm font-medium ${
                invoice.status === 'paid' ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {invoice.status === 'paid' ? 
                  (invoice.withdrawn || isWithdrawn ? 'Funds Withdrawn' : 'Payment Received') : 
                  'Awaiting Payment'
                }
              </span>
            </div>
            
            {invoice.status === 'paid' && (
              <div className="text-right">
                <div className="text-sm text-green-700">
                  <span className="font-medium">You'll receive: </span>
                  <span className="font-bold">{calculateMerchantReceives()} ETH</span>
                </div>
                <div className="text-xs text-green-600">
                  Platform fee: {calculatePlatformFee()} ETH
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Withdrawal Error */}
      {withdrawError && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700">{withdrawError}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {isWithdrawn && (
        <div className="px-6 py-3 bg-green-50 border-b border-green-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-700">
              Withdrawal successful! Funds have been transferred to your wallet.
            </p>
          </div>
        </div>
      )}

      {/* Invoice Card Content */}
      <div className="p-6">
        <InvoiceCard invoice={invoice} onCopyLink={onCopyLink} />
      </div>

      {/* Enhanced Actions for Created Bills */}
      {viewType === 'created' && (
        <div className="px-6 pb-6">
          <div className="border-t border-gray-100 pt-4">
            {invoice.status === 'paid' && !invoice.withdrawn && !isWithdrawn ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Withdrawing...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Withdraw {calculateMerchantReceives()} ETH</span>
                    </>
                  )}
                </button>
                
                <a
                  href={`/pay?id=${invoice.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Payment Details</span>
                </a>
              </div>
            ) : invoice.status === 'paid' && (invoice.withdrawn || isWithdrawn) ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-green-100 text-green-800 py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Funds Withdrawn</span>
                </div>
                <a
                  href={`/pay?id=${invoice.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Payment Details</span>
                </a>
              </div>
            ) : invoice.status === 'unpaid' ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`/pay?id=${invoice.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Payment Page</span>
                </a>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Status for Paid Bills View */}
      {viewType === 'paid' && (
        <div className="px-6 pb-6">
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Payment Completed
                </span>
              </div>
              <a
                href={`/pay?id=${invoice.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
              >
                <span>View Receipt</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
