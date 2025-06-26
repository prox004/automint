import { useState, useEffect } from 'react';
import { createPublicClient, http, formatEther, type Address } from 'viem';
import {  
  polygonAmoy,
  optimismSepolia,
  sepolia, 
  arbitrumSepolia,
  baseSepolia,
  scrollSepolia,
  lineaSepolia,
  mantleSepoliaTestnet,
} from 'viem/chains';

export interface NetworkBalance {
  chainId: number;
  chainName: string;
  tokenSymbol: string;
  balance: string;
  balanceFormatted: string;
  isLoading: boolean;
  error?: string;
  usdValue?: number;
}

// Define network configurations
const NETWORK_CONFIGS = [
  {
    chain: polygonAmoy,
    name: 'Polygon Amoy',
    symbol: 'POL',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    coingeckoId: 'matic-network'
  },
  {
    chain: optimismSepolia,
    name: 'Optimism Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://optimism-sepolia.drpc.org',
    coingeckoId: 'ethereum'
  },
  {
    chain: sepolia,
    name: 'Ethereum Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://1rpc.io/sepolia',
    coingeckoId: 'ethereum'
  },
  {
    chain: arbitrumSepolia,
    name: 'Arbitrum Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    coingeckoId: 'ethereum'
  },
  {
    chain: baseSepolia,
    name: 'Base Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia.base.org',
    coingeckoId: 'ethereum'
  },
  {
    chain: scrollSepolia,
    name: 'Scroll Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia-rpc.scroll.io',
    coingeckoId: 'ethereum'
  },
  {
    chain: lineaSepolia,
    name: 'Linea Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://rpc.sepolia.linea.build',
    coingeckoId: 'ethereum'
  },
  {
    chain: mantleSepoliaTestnet,
    name: 'Mantle Sepolia Testnet',
    symbol: 'MNT',
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
    coingeckoId: 'mantle'
  }
];

// Simple cache for token prices
const priceCache: Record<string, { price: number; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchTokenPrice(coingeckoId: string): Promise<number | undefined> {
  try {
    // Check cache first
    const cached = priceCache[coingeckoId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.price;
    }

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch price');
    }
    
    const data = await response.json();
    const price = data[coingeckoId]?.usd;
    
    if (price) {
      priceCache[coingeckoId] = { price, timestamp: Date.now() };
    }
    
    return price;
  } catch (error) {
    console.warn(`Failed to fetch price for ${coingeckoId}:`, error);
    return undefined;
  }
}

export function useMultiNetworkBalances(walletAddress?: string) {
  const [balances, setBalances] = useState<NetworkBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setBalances([]);
      return;
    }

    const fetchBalances = async () => {
      setIsLoading(true);
      
      // Initialize balances with loading state
      const initialBalances: NetworkBalance[] = NETWORK_CONFIGS.map(config => ({
        chainId: config.chain.id,
        chainName: config.name,
        tokenSymbol: config.symbol,
        balance: '0',
        balanceFormatted: '0.0000',
        isLoading: true
      }));
      
      setBalances(initialBalances);

      // Fetch balances for each network
      const balancePromises = NETWORK_CONFIGS.map(async (config, index) => {
        try {
          // Create public client for this network
          const client = createPublicClient({
            chain: config.chain,
            transport: http(config.rpcUrl)
          });

          // Get balance
          const balance = await client.getBalance({
            address: walletAddress as Address
          });

          const balanceFormatted = parseFloat(formatEther(balance)).toFixed(4);
          
          // Fetch USD price
          let usdValue: number | undefined;
          try {
            const price = await fetchTokenPrice(config.coingeckoId);
            if (price) {
              usdValue = parseFloat(balanceFormatted) * price;
            }
          } catch (error) {
            console.warn(`Failed to fetch USD price for ${config.symbol}:`, error);
          }

          const networkBalance: NetworkBalance = {
            chainId: config.chain.id,
            chainName: config.name,
            tokenSymbol: config.symbol,
            balance: balance.toString(),
            balanceFormatted,
            isLoading: false,
            usdValue
          };

          // Update the specific balance in the array
          setBalances(prev => 
            prev.map((item, i) => i === index ? networkBalance : item)
          );

          return networkBalance;
        } catch (error) {
          console.error(`Failed to fetch balance for ${config.name}:`, error);
          
          const errorBalance: NetworkBalance = {
            chainId: config.chain.id,
            chainName: config.name,
            tokenSymbol: config.symbol,
            balance: '0',
            balanceFormatted: '0.0000',
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch balance'
          };

          // Update with error state
          setBalances(prev => 
            prev.map((item, i) => i === index ? errorBalance : item)
          );

          return errorBalance;
        }
      });

      // Wait for all balances to complete
      await Promise.allSettled(balancePromises);
      setIsLoading(false);
    };

    fetchBalances();
  }, [walletAddress]);

  const refetch = () => {
    if (walletAddress) {
      // Clear cache and refetch
      Object.keys(priceCache).forEach(key => delete priceCache[key]);
      setBalances([]);
      // The useEffect will trigger a refetch
    }
  };

  return {
    balances,
    isLoading,
    refetch
  };
}
