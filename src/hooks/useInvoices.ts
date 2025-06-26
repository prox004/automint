import { useState, useEffect, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { getAutoMintContractReadOnly, isContractDeployed, formatEthAmount } from '@/lib/contract';
import { AutoMintInvoiceABI } from '@/lib/contracts/AutoMintInvoiceABI';

export interface InvoiceData {
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
  createdBy: string;
  paidAt?: string;
  paidBy?: string;
  withdrawn?: boolean;
}

export function useInvoices() {
  const { user } = usePrivy();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoicesFromContract = async (userAddress: string) => {
    if (!isContractDeployed()) {
      throw new Error('Smart contract not deployed');
    }

    try {
      // Get provider for reading contract data
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/b9980f4f63a84ea480f8e6e21477bbae'
      );
      
      const contract = getAutoMintContractReadOnly(provider);
      
      // Get the current invoice ID to know how many invoices exist
      const currentInvoiceId = await contract.getCurrentInvoiceId();
      
      const userInvoices: InvoiceData[] = [];
      
      // Fetch all invoices and filter for user's invoices
      for (let i = 1; i <= currentInvoiceId; i++) {
        try {
          const invoiceExists = await contract.invoiceExists(i);
          if (!invoiceExists) continue;
          
          const invoice = await contract.getInvoice(i);
          
          // Check if this invoice is created by the user or paid by the user
          const isCreatedByUser = invoice.merchant.toLowerCase() === userAddress.toLowerCase();
          
          // To check if paid by user, we need to look at event logs
          let isPaidByUser = false;
          let paidBy = '';
          let paidAt = '';
          let originalAmount = invoice.amount; // Keep track of original amount
          
          if (invoice.isPaid) {
            // Get payment events for this invoice
            const filter = contract.filters.InvoicePaid(i);
            const events = await contract.queryFilter(filter);
            
            if (events.length > 0) {
              const paymentEvent = events[0] as ethers.EventLog;
              if (paymentEvent.args) {
                paidBy = paymentEvent.args.payer;
                isPaidByUser = paidBy.toLowerCase() === userAddress.toLowerCase();
                originalAmount = paymentEvent.args.amount; // Get original amount from event
                
                // Get block timestamp for paidAt
                const block = await provider.getBlock(paymentEvent.blockNumber);
                paidAt = new Date((block?.timestamp || 0) * 1000).toISOString();
              }
            }
          }
          
          // Include invoice if user created it or paid it
          if (isCreatedByUser || isPaidByUser) {
            // Parse metadata if available
            let metadata = {};
            try {
              if (invoice.metadataURI) {
                metadata = JSON.parse(invoice.metadataURI);
              }
            } catch (e) {
              console.warn('Failed to parse metadata for invoice', i, e);
            }
            
            const invoiceData: InvoiceData = {
              id: Number(invoice.id),
              title: (metadata as any)?.title || `Invoice #${invoice.id}`,
              billedTo: (metadata as any)?.billedTo || 'Unknown Client',
              clientWallet: invoice.allowedPayer !== ethers.ZeroAddress ? invoice.allowedPayer : undefined,
              amount: formatEthAmount(originalAmount), // Use original amount from payment event
              dueDate: (metadata as any)?.dueDate || new Date(Number(invoice.createdAt) * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              description: (metadata as any)?.description || 'Payment required',
              referenceNumber: (metadata as any)?.referenceNumber,
              email: (metadata as any)?.email,
              taxInfo: (metadata as any)?.taxInfo,
              merchantName: (metadata as any)?.merchantName || 'Merchant',
              merchantWallet: invoice.merchant,
              status: invoice.isPaid ? 'paid' : 'unpaid',
              createdAt: new Date(Number(invoice.createdAt) * 1000).toISOString(),
              createdBy: invoice.merchant,
              paidAt: paidAt || undefined,
              paidBy: paidBy || undefined,
              withdrawn: invoice.isPaid && invoice.amount === BigInt(0) // Funds withdrawn if paid but amount is 0
            };
            
            userInvoices.push(invoiceData);
          }
        } catch (err) {
          console.warn(`Failed to fetch invoice ${i}:`, err);
          // Continue with next invoice
        }
      }
      
      return userInvoices;
      
    } catch (err) {
      console.error('Error fetching invoices from contract:', err);
      throw err;
    }
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const userWallet = user?.wallet?.address;
        if (!userWallet) {
          setInvoices([]);
          setIsLoading(false);
          return;
        }

        if (!isContractDeployed()) {
          setError('Smart contract not deployed. Please deploy the contract first.');
          setInvoices([]);
          setIsLoading(false);
          return;
        }

        const contractInvoices = await fetchInvoicesFromContract(userWallet);
        setInvoices(contractInvoices);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoices from smart contract';
        setError(errorMessage);
        setInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [user?.wallet?.address]);

  // Filter invoices created by the current user
  const createdInvoices = useMemo(() => {
    const userWallet = user?.wallet?.address?.toLowerCase();
    if (!userWallet) return [];
    
    return invoices.filter(invoice => 
      invoice.createdBy.toLowerCase() === userWallet
    );
  }, [invoices, user?.wallet?.address]);

  // Filter paid invoices created by the current user
  const paidInvoices = useMemo(() => {
    return createdInvoices.filter(invoice => invoice.status === 'paid');
  }, [createdInvoices]);

  // Filter unpaid invoices created by the current user
  const unpaidInvoices = useMemo(() => {
    return createdInvoices.filter(invoice => invoice.status === 'unpaid');
  }, [createdInvoices]);

  const refreshInvoices = async () => {
    setIsLoading(true);
    try {
      const userWallet = user?.wallet?.address;
      if (!userWallet) {
        setInvoices([]);
        setIsLoading(false);
        return;
      }

      if (!isContractDeployed()) {
        setError('Smart contract not deployed');
        setInvoices([]);
        setIsLoading(false);
        return;
      }

      const contractInvoices = await fetchInvoicesFromContract(userWallet);
      setInvoices(contractInvoices);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh invoices');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Data
    allInvoices: invoices,
    createdInvoices,
    paidInvoices,
    unpaidInvoices,
    
    // Counts
    totalCreated: createdInvoices.length,
    totalPaid: paidInvoices.length,
    totalUnpaid: unpaidInvoices.length,
    
    // State
    isLoading,
    error,
    
    // Actions
    refreshInvoices
  };
}
