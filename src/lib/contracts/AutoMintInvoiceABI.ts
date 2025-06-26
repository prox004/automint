export const AutoMintInvoiceABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "PLATFORM_FEE_BPS",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "BASIS_POINTS",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "accumulatedFees",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createInvoice",
    "inputs": [
      { "name": "amount", "type": "uint256", "internalType": "uint256" },
      { "name": "metadataURI", "type": "string", "internalType": "string" },
      { "name": "allowedPayer", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "invoiceId", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getCurrentInvoiceId",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getInvoice",
    "inputs": [
      { "name": "invoiceId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "invoice",
        "type": "tuple",
        "internalType": "struct AutoMintInvoice.Invoice",
        "components": [
          { "name": "id", "type": "uint256", "internalType": "uint256" },
          { "name": "merchant", "type": "address", "internalType": "address" },
          { "name": "amount", "type": "uint256", "internalType": "uint256" },
          { "name": "metadataURI", "type": "string", "internalType": "string" },
          { "name": "allowedPayer", "type": "address", "internalType": "address" },
          { "name": "isPaid", "type": "bool", "internalType": "bool" },
          { "name": "createdAt", "type": "uint256", "internalType": "uint256" },
          { "name": "paidAt", "type": "uint256", "internalType": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "invoiceExists",
    "inputs": [
      { "name": "invoiceId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "exists", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "invoices",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "id", "type": "uint256", "internalType": "uint256" },
      { "name": "merchant", "type": "address", "internalType": "address" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" },
      { "name": "metadataURI", "type": "string", "internalType": "string" },
      { "name": "allowedPayer", "type": "address", "internalType": "address" },
      { "name": "isPaid", "type": "bool", "internalType": "bool" },
      { "name": "createdAt", "type": "uint256", "internalType": "uint256" },
      { "name": "paidAt", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextInvoiceId",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "payInvoice",
    "inputs": [
      { "name": "invoiceId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      { "name": "newOwner", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdrawInvoiceFunds",
    "inputs": [
      { "name": "invoiceId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdrawPlatformFees",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "FundsWithdrawn",
    "inputs": [
      { "name": "invoiceId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "merchant", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InvoiceCreated",
    "inputs": [
      { "name": "invoiceId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "merchant", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "metadataURI", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "allowedPayer", "type": "address", "indexed": false, "internalType": "address" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InvoicePaid",
    "inputs": [
      { "name": "invoiceId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "payer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "platformFee", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      { "name": "previousOwner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "newOwner", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PlatformFeesWithdrawn",
    "inputs": [
      { "name": "owner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [
      { "name": "owner", "type": "address", "internalType": "address" }
    ]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [
      { "name": "account", "type": "address", "internalType": "address" }
    ]
  },
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  }
] as const;
