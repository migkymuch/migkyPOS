// Global state interface for the POS system
export interface AppState {
  version: number;
  menus: MenuItem[];
  orders: Order[];
  tickets: Ticket[];
  bills: Bill[];
  kpis: any;
  pendingOrderMeta: any;
  settings: {
    mode: 'LOCAL_ONLY' | 'CLOUD_SYNC';
    orgId?: string;
    storeId?: string;
  };
}

// MenuItem interface matching the data contract
export interface MenuItem {
  sku: string;
  name: string;
  price: number;
  category: 'rice' | 'tea' | 'water';
  station: 'kitchen' | 'tea';
  imageUrl?: string;
  imageAlt?: string;
  modifiers: any[];
}

// Order interface matching the data contract
export interface Order {
  id: string;
  queueNo: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNo?: number;
  platform?: string;
  trackingNo?: string;
  items: any[];
  totals: {
    sub: number;
    discount: number;
    grand: number;
  };
  status: 'OPEN' | 'PAID' | 'VOID';
  createdAt: number;
  updatedAt: number;
  updatedBy: string;
}

// Ticket interface for KDS
export interface Ticket {
  id: string;
  orderId: string;
  station: 'kitchen' | 'tea';
  status: 'NEW' | 'IN_PROGRESS' | 'READY' | 'CLOSED';
  items: any[];
  startedAt?: number;
  readyAt?: number;
  slaMin: number;
}

// Bill interface for payment tracking
export interface Bill {
  id: string;
  orderId: string;
  tableNo?: number;
  status: 'UNPAID' | 'PAID' | 'VOID' | 'REFUND';
  payments: Array<{
    method: 'CASH' | 'QR';
    amount: number;
    paidAt: number;
    by: string;
  }>;
  createdAt: number;
  updatedAt: number;
}

// Global App namespace for the POS system
declare global {
  interface Window {
    App: {
      state: AppState;
      ui: {
        navigateTo: (page: string) => void;
      };
      auth: {
        login: (pin: string) => boolean;
        logout: () => void;
        isAuthed: () => boolean;
        requireRole: (role: string) => boolean;
      };
      pos: {
        init: () => void;
      };
      kds: {
        listenKitchen: () => void;
        listenTea: () => void;
      };
      reports: {
        computeKPIs: (range: any) => any;
      };
      cloud: {
        enable: (config: { orgId: string; storeId: string }) => Promise<void>;
        disable: () => void;
        status: () => string;
      };
      queue: {
        enqueue: (action: any) => void;
        flush: () => void;
      };
      events: any;
    };
  }
}