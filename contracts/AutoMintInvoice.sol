// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AutoMintInvoice
 * @dev A decentralized invoicing system for AutoMint
 * Supports creating and paying invoices with native ETH
 */
contract AutoMintInvoice is Ownable, ReentrancyGuard {
    // Platform fee (1% = 100 basis points)
    uint256 public constant PLATFORM_FEE_BPS = 100;
    uint256 public constant BASIS_POINTS = 10000;
    
    // Invoice counter for unique IDs
    uint256 public nextInvoiceId = 1;
    
    // Invoice structure
    struct Invoice {
        uint256 id;
        address merchant;
        uint256 amount;
        string metadataURI;
        address allowedPayer; // Optional: only this address can pay (zero address = anyone)
        bool isPaid;
        uint256 createdAt;
        uint256 paidAt;
    }
    
    // Mapping from invoice ID to invoice details
    mapping(uint256 => Invoice) public invoices;
    
    // Accumulated platform fees
    uint256 public accumulatedFees;
    
    // Events
    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed merchant,
        uint256 amount,
        string metadataURI,
        address allowedPayer
    );
    
    event InvoicePaid(
        uint256 indexed invoiceId,
        address indexed payer,
        uint256 amount,
        uint256 platformFee
    );
    
    event FundsWithdrawn(
        uint256 indexed invoiceId,
        address indexed merchant,
        uint256 amount
    );
    
    event PlatformFeesWithdrawn(
        address indexed owner,
        uint256 amount
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new invoice
     * @param amount The amount to be paid (in wei)
     * @param metadataURI URI containing invoice metadata (IPFS or off-chain)
     * @param allowedPayer Optional: specific address that can pay (zero address = anyone)
     * @return invoiceId The unique ID of the created invoice
     */
    function createInvoice(
        uint256 amount,
        string calldata metadataURI,
        address allowedPayer
    ) external returns (uint256 invoiceId) {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        
        invoiceId = nextInvoiceId++;
        
        invoices[invoiceId] = Invoice({
            id: invoiceId,
            merchant: msg.sender,
            amount: amount,
            metadataURI: metadataURI,
            allowedPayer: allowedPayer,
            isPaid: false,
            createdAt: block.timestamp,
            paidAt: 0
        });
        
        emit InvoiceCreated(
            invoiceId,
            msg.sender,
            amount,
            metadataURI,
            allowedPayer
        );
        
        return invoiceId;
    }
    
    /**
     * @dev Pay an invoice with native ETH
     * @param invoiceId The ID of the invoice to pay
     */
    function payInvoice(uint256 invoiceId) external payable nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        
        require(invoice.id != 0, "Invoice does not exist");
        require(!invoice.isPaid, "Invoice already paid");
        require(msg.value == invoice.amount, "Incorrect payment amount");
        
        // Check if payer is allowed (if restriction is set)
        if (invoice.allowedPayer != address(0)) {
            require(msg.sender == invoice.allowedPayer, "Not authorized to pay this invoice");
        }
        
        // Calculate platform fee
        uint256 platformFee = (invoice.amount * PLATFORM_FEE_BPS) / BASIS_POINTS;
        
        // Mark invoice as paid
        invoice.isPaid = true;
        invoice.paidAt = block.timestamp;
        
        // Accumulate platform fees
        accumulatedFees += platformFee;
        
        emit InvoicePaid(invoiceId, msg.sender, invoice.amount, platformFee);
    }
    
    /**
     * @dev Withdraw funds from a paid invoice (only by merchant)
     * @param invoiceId The ID of the invoice to withdraw from
     */
    function withdrawInvoiceFunds(uint256 invoiceId) external nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        
        require(invoice.id != 0, "Invoice does not exist");
        require(invoice.isPaid, "Invoice not paid yet");
        require(msg.sender == invoice.merchant, "Only merchant can withdraw");
        
        // Calculate amount after platform fee
        uint256 platformFee = (invoice.amount * PLATFORM_FEE_BPS) / BASIS_POINTS;
        uint256 merchantAmount = invoice.amount - platformFee;
        
        // Prevent double withdrawal by setting amount to 0
        require(invoice.amount > 0, "Funds already withdrawn");
        invoice.amount = 0;
        
        // Transfer funds to merchant
        (bool success, ) = payable(invoice.merchant).call{value: merchantAmount}("");
        require(success, "Transfer to merchant failed");
        
        emit FundsWithdrawn(invoiceId, invoice.merchant, merchantAmount);
    }
    
    /**
     * @dev Withdraw accumulated platform fees (only owner)
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");
        
        accumulatedFees = 0;
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit PlatformFeesWithdrawn(owner(), amount);
    }
    
    /**
     * @dev Get invoice details
     * @param invoiceId The ID of the invoice
     * @return invoice The invoice details
     */
    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        require(invoices[invoiceId].id != 0, "Invoice does not exist");
        return invoices[invoiceId];
    }
    
    /**
     * @dev Get the current invoice counter
     * @return The next invoice ID that will be assigned
     */
    function getCurrentInvoiceId() external view returns (uint256) {
        return nextInvoiceId;
    }
    
    /**
     * @dev Check if an invoice exists
     * @param invoiceId The ID to check
     * @return exists Whether the invoice exists
     */
    function invoiceExists(uint256 invoiceId) external view returns (bool) {
        return invoices[invoiceId].id != 0;
    }
}
