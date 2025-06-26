import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, parseEther, formatEther, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { AutoMintInvoiceABI } from '@/lib/contracts/AutoMintInvoiceABI';

// Contract configuration
const CONTRACT_CONFIG = {
  // This will be populated after deployment
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address || '0x0000000000000000000000000000000000000000',
  abi: AutoMintInvoiceABI,
  chain: sepolia
};

export interface CreateInvoiceParams {
  amount: string; // Amount in ETH as string
  description: string;
  allowedPayer?: string; // Optional specific payer address
}

export interface Invoice {
  id: number;
  merchant: Address;
  amount: bigint;
  metadataURI: string;
  allowedPayer: Address;
  isPaid: boolean;
  createdAt: number;
  paidAt: number;
}

export function useAutoMintContract() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWalletClient = async () => {
    if (!ready || !authenticated || !user?.wallet) {
      throw new Error('Wallet not connected');
    }

    const walletAddress = user.wallet?.address;
    const wallet = wallets.find(w => w.address === walletAddress);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const provider = await wallet.getEthereumProvider();
    
    return createWalletClient({
      account: user.wallet.address as Address,
      chain: CONTRACT_CONFIG.chain,
      transport: custom(provider)
    });
  };

  const createInvoice = async (params: CreateInvoiceParams): Promise<number> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!CONTRACT_CONFIG.address || CONTRACT_CONFIG.address === '0x0000000000000000000000000000000000000000') {
        throw new Error('Contract not deployed yet. Please deploy the contract first.');
      }

      const walletClient = await getWalletClient();
      
      // Convert amount to wei
      const amountInWei = parseEther(params.amount);
      
      // Create metadata URI (for now, just JSON stringified description)
      const metadata = {
        description: params.description,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      const metadataURI = JSON.stringify(metadata);
      
      // Set allowed payer (zero address if none specified)
      const allowedPayer = (params.allowedPayer || '0x0000000000000000000000000000000000000000') as Address;

      // Call the contract
      const hash = await walletClient.writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'createInvoice',
        args: [amountInWei, metadataURI, allowedPayer]
      });

      console.log('Transaction hash:', hash);

      // Wait for transaction confirmation
      // Note: In a production app, you'd want to wait for the transaction receipt
      // and parse the event logs to get the actual invoice ID
      
      // For now, we'll return a placeholder ID
      // In production, you should wait for the receipt and parse the InvoiceCreated event
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for mining
      
      return Date.now(); // Placeholder invoice ID
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getInvoice = async (invoiceId: number): Promise<Invoice | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!CONTRACT_CONFIG.address || CONTRACT_CONFIG.address === '0x0000000000000000000000000000000000000000') {
        throw new Error('Contract not deployed yet');
      }

      // This would use a public client to read from the contract
      // For now, return null as we haven't implemented the read functionality
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get invoice';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const payInvoice = async (invoiceId: number, amount: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!CONTRACT_CONFIG.address || CONTRACT_CONFIG.address === '0x0000000000000000000000000000000000000000') {
        throw new Error('Contract not deployed yet');
      }

      const walletClient = await getWalletClient();
      const amountInWei = parseEther(amount);

      const hash = await walletClient.writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'payInvoice',
        args: [BigInt(invoiceId)],
        value: amountInWei
      });

      console.log('Payment transaction hash:', hash);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pay invoice';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createInvoice,
    getInvoice,
    payInvoice,
    isLoading,
    error,
    isContractDeployed: CONTRACT_CONFIG.address !== '0x0000000000000000000000000000000000000000',
    contractAddress: CONTRACT_CONFIG.address
  };
}
