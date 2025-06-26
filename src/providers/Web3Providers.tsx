'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { mainnet, sepolia, base, baseSepolia, polygon, polygonMumbai } from 'viem/chains';
import { createConfig } from 'wagmi';
import { useState } from 'react';

const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, base, baseSepolia, polygon, polygonMumbai],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [polygon.id]: http(),
    [polygonMumbai.id]: http(),
  },
});

interface Web3ProvidersProps {
  children: React.ReactNode;
}

export default function Web3Providers({ children }: Web3ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!privyAppId) {
    console.error('NEXT_PUBLIC_PRIVY_APP_ID is not set');
    return <div>Web3 configuration error. Please check environment variables.</div>;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        // Customize Privy's appearance in your app
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          logo: '/automint-logo.png', // Add your logo here
          showWalletLoginFirst: false,
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        // Configure supported login methods
        loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord'],
        // Configure supported wallets
        supportedChains: [mainnet, sepolia, base, baseSepolia, polygon, polygonMumbai],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
