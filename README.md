# AutoMint - Decentralized Web3 Invoicing System

AutoMint is a mobile-first Web3 application for creating and managing invoices on Ethereum-compatible testnets. Built with Next.js, it allows merchants to create invoices that customers can pay directly with cryptocurrency.

## 🌟 Features

### ✅ Completed
- **Mobile-first UI** with Tailwind CSS
- **Wallet Integration** via Privy SDK  
- **Multi-network Balance Display** - Shows wallet balances across 8+ EVM testnets
- **User Authentication** with username setup
- **Smart Contract Infrastructure** for invoice management
- **Create Invoice Page** with full form validation and contract interaction
- **Firebase Integration** for user data persistence
- **Real-time Price Data** via CoinGecko API

### 🚧 In Development
- **Pay Invoice** functionality
- **Invoice Management** dashboard
- **Payment Tracking** and notifications

### � Supported Networks
- Ethereum Sepolia
- Polygon Mumbai
- Optimism Goerli
- Arbitrum Sepolia
- Base Sepolia
- Scroll Sepolia
- Linea Goerli
- Mantle Testnet
- ⚡ Built with Next.js 15 and Tailwind CSS
- 🔗 Multi-chain support (Ethereum, Base, Polygon)
- 💼 Professional invoice management
- 🎨 Modern, clean UI with smooth animations

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Privy account (for Web3 authentication)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd automint
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add:

```env
# Privy Configuration (Required)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id_here

# App Configuration
NEXT_PUBLIC_APP_NAME=AutoMint
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Get your Privy App ID:
   - Go to [Privy Console](https://console.privy.io)
   - Create a new app or use an existing one
   - Copy your App ID from the dashboard
   - Add it to your `.env.local` file

5. (Optional) Get WalletConnect Project ID:
   - Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
   - Create a new project
   - Copy the Project ID

### Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                     # Next.js app router
│   ├── dashboard/          # Protected dashboard page
│   ├── login/              # Login page (redirects to onboarding)
│   ├── layout.tsx          # Root layout with Web3 providers
│   └── page.tsx            # Landing page with onboarding flow
├── components/
│   ├── dashboard/          # Dashboard components
│   │   └── Dashboard.tsx   # Main dashboard component
│   └── onboarding/         # Onboarding flow components
│       └── OnboardingFlow.tsx
└── providers/
    └── Web3Providers.tsx   # Privy and Wagmi configuration
```

## Onboarding Flow

The app includes a 4-step mobile-first onboarding process:

1. **Welcome** - Introduction to AutoMint
2. **Features** - Highlighting key benefits
3. **Security** - Emphasizing blockchain security
4. **Connect** - Web3 wallet connection via Privy

## Authentication

Authentication is handled by Privy SDK with support for:

- Email authentication
- Wallet connections (MetaMask, WalletConnect, etc.)
- Embedded wallets for users without existing wallets
- Social logins (Google, Twitter, Discord)

## Supported Chains

- Ethereum Mainnet
- Ethereum Sepolia (testnet)
- Base
- Base Sepolia (testnet)
- Polygon
- Polygon Mumbai (testnet)

## Configuration

### Privy Configuration

The Privy provider is configured in `src/providers/Web3Providers.tsx` with:

- Custom appearance and branding
- Embedded wallet creation for new users
- Multiple login methods
- Multi-chain support

### Mobile Optimization

- Touch-friendly buttons (44px minimum)
- Mobile-first responsive design
- Optimized font sizes and spacing
- Smooth animations and transitions

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Your Privy app ID | Yes |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID | No |
| `NEXT_PUBLIC_APP_NAME` | App name for branding | No |
| `NEXT_PUBLIC_APP_URL` | App URL for redirects | No |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Development

### Adding New Features

1. Create components in appropriate directories
2. Use TypeScript for type safety
3. Follow mobile-first design principles
4. Test on multiple screen sizes

### Styling

- Uses Tailwind CSS for styling
- Custom CSS variables for theming
- Mobile-first responsive design
- Dark mode support ready

## Troubleshooting

### Common Issues

1. **"Web3 configuration error"**
   - Ensure `NEXT_PUBLIC_PRIVY_APP_ID` is set correctly
   - Check that your Privy app is properly configured

2. **Build errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check for TypeScript errors with `npm run lint`

3. **Wallet connection issues**
   - Verify supported chains in Privy dashboard
   - Check network connectivity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the GitHub issues
- Consult Privy documentation
- Reach out to the development team
