"use client"
import React, { createContext, useContext, useEffect } from 'react';
import { useInvoices, InvoiceData } from '@/hooks/useInvoices';
import { invoiceEvents } from '@/lib/invoiceEvents';

interface InvoiceContextType {
  // Data from the hook
  allInvoices: InvoiceData[];
  createdInvoices: InvoiceData[];
  paidInvoices: InvoiceData[];
  unpaidInvoices: InvoiceData[];
  totalCreated: number;
  totalPaid: number;
  totalUnpaid: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshInvoices: () => Promise<void>;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const invoiceHook = useInvoices();

  // Listen for invoice events from other parts of the app (like Create page)
  useEffect(() => {
    const handleInvoiceCreated = () => {
      // When an invoice is created, refresh the list
      invoiceHook.refreshInvoices();
    };

    const handleInvoicePaid = () => {
      // When an invoice is paid, refresh the list
      invoiceHook.refreshInvoices();
    };

    invoiceEvents.on('invoice-created', handleInvoiceCreated);
    invoiceEvents.on('invoice-paid', handleInvoicePaid);

    return () => {
      invoiceEvents.off('invoice-created', handleInvoiceCreated);
      invoiceEvents.off('invoice-paid', handleInvoicePaid);
    };
  }, [invoiceHook]);

  const contextValue: InvoiceContextType = {
    ...invoiceHook
  };

  return (
    <InvoiceContext.Provider value={contextValue}>
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoiceContext() {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoiceContext must be used within an InvoiceProvider');
  }
  return context;
}
