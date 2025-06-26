import { useState } from 'react';
import { 
  Copy, 
  Check, 
  Calendar, 
  Building2, 
  FileText, 
  DollarSign,
  Hash,
  Mail,
  CreditCard,
  ExternalLink
} from 'lucide-react';

interface InvoiceCardProps {
  invoice: {
    id: number;
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
  };
  onCopyLink?: () => void;
}

export function InvoiceCard({ invoice, onCopyLink }: InvoiceCardProps) {
  const [copied, setCopied] = useState(false);
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

  const handleCopyLink = async () => {
    const paymentLink = `${window.location.origin}/pay?id=${invoice.id}`;
    await navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopyLink?.();
  };

  const handleCopyInvoiceId = async () => {
    await navigator.clipboard.writeText(invoice.id.toString());
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4 text-gray-500" />
            <span className="font-mono text-lg font-semibold text-gray-700">
              #{invoice.id}
            </span>
            <button
              onClick={handleCopyInvoiceId}
              className="p-1 hover:bg-gray-100 rounded"
              title="Copy Invoice ID"
            >
              <Copy className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-1">{invoice.title}</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Created: {new Date(invoice.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Invoice Details Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* From */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>From</span>
          </h4>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{invoice.merchantName}</p>
            <button
              onClick={() => copyToClipboard(invoice.merchantWallet)}
              className="font-mono text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1 group"
              title="Click to copy address"
            >
              <span className="break-all">{invoice.merchantWallet}</span>
              {copiedAddress === invoice.merchantWallet ? (
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
            <Building2 className="w-4 h-4" />
            <span>Billed To</span>
          </h4>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{invoice.billedTo}</p>
            {invoice.clientWallet && (
              <button
                onClick={() => copyToClipboard(invoice.clientWallet!)}
                className="font-mono text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1 group"
                title="Click to copy address"
              >
                <span className="break-all">{invoice.clientWallet}</span>
                {copiedAddress === invoice.clientWallet ? (
                  <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                )}
              </button>
            )}
            {invoice.email && (
              <div className="flex items-center space-x-1 text-gray-600">
                <Mail className="w-3 h-3" />
                <span>{invoice.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
          <FileText className="w-4 h-4" />
          <span>Description</span>
        </h4>
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          {invoice.description}
        </p>
      </div>

      {/* Additional Info */}
      {(invoice.referenceNumber || invoice.taxInfo) && (
        <div className="grid md:grid-cols-2 gap-4 mb-6 text-sm">
          {invoice.referenceNumber && (
            <div>
              <span className="font-medium text-gray-700">Reference:</span>
              <span className="ml-2 text-gray-600">{invoice.referenceNumber}</span>
            </div>
          )}
          {invoice.taxInfo && (
            <div>
              <span className="font-medium text-gray-700">Tax Info:</span>
              <span className="ml-2 text-gray-600">{invoice.taxInfo}</span>
            </div>
          )}
        </div>
      )}

      {/* Amount */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">Total Amount</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900">
              {invoice.amount} ETH
            </div>
            <div className="text-sm text-blue-700">+ 1% platform fee</div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Payment Status:</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          invoice.status === 'paid' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {invoice.status === 'paid' ? '✓ Paid' : '⏳ Pending Payment'}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleCopyLink}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Link Copied!' : 'Copy Payment Link'}</span>
        </button>
        
        <a
          href={`/pay?id=${invoice.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View Payment Page</span>
        </a>
      </div>

      {/* Network Info */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center">
        <p>Secured by smart contract on Ethereum Sepolia • AutoMint</p>
      </div>
    </div>
  );
}
