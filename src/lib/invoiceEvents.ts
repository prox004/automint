// Simple event system for cross-page invoice communication
type InvoiceEventType = 'invoice-created' | 'invoice-paid';

interface InvoiceEvent {
  type: InvoiceEventType;
  data: any;
}

class InvoiceEventEmitter {
  private listeners: Map<InvoiceEventType, Function[]> = new Map();

  on(event: InvoiceEventType, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: InvoiceEventType, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: InvoiceEventType, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

// Global instance
export const invoiceEvents = new InvoiceEventEmitter();

// Helper functions for easy use
export const emitInvoiceCreated = (invoiceData: any) => {
  invoiceEvents.emit('invoice-created', invoiceData);
};

export const emitInvoicePaid = (invoiceData: any) => {
  invoiceEvents.emit('invoice-paid', invoiceData);
};
