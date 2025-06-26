import { ethers } from 'ethers';
import { AutoMintInvoiceABI } from './contracts/AutoMintInvoiceABI';

// Contract deployment info - update these after deployment
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'; // Update after deployment
export const CHAIN_ID = 11155111; // Sepolia
export const NETWORK_NAME = 'Ethereum Sepolia';

export function getAutoMintContract(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, AutoMintInvoiceABI, signer);
}

export function getAutoMintContractReadOnly(provider: ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, AutoMintInvoiceABI, provider);
}

// Helper to format ETH amounts
export function formatEthAmount(amountWei: bigint): string {
  return ethers.formatEther(amountWei);
}

// Helper to parse ETH amounts
export function parseEthAmount(amountEth: string): bigint {
  return ethers.parseEther(amountEth);
}

// Check if contract is deployed
export function isContractDeployed(): boolean {
  return CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';
}

// Helper to create metadata URI for invoice
export function createInvoiceMetadata(data: {
  title: string;
  description: string;
  billedTo: string;
  dueDate: string;
  referenceNumber?: string;
  email?: string;
  taxInfo?: string;
}): string {
  return JSON.stringify({
    title: data.title,
    description: data.description,
    billedTo: data.billedTo,
    dueDate: data.dueDate,
    referenceNumber: data.referenceNumber || '',
    email: data.email || '',
    taxInfo: data.taxInfo || '',
    version: '1.0',
    createdAt: new Date().toISOString()
  });
}
