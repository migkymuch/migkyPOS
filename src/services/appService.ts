import { AppState } from '../types';
import { seedMenus } from '../constants/seedData';

export const initializeGlobalApp = (
  setCurrentPage: (page: string) => void,
  setIsAuthenticated: (auth: boolean) => void,
  setShowRoleSelection: (show: boolean) => void,
  isAuthenticated: boolean
) => {
  // Initialize global App state with default values
  // Initialize sample bills for demonstration
  const sampleBills = [
    {
      id: 'BILL001',
      orderId: 'ORD001',
      tableNo: 5,
      status: 'UNPAID' as const,
      payments: [],
      createdAt: Date.now() - 3600000, // 1 ชั่วโมงที่แล้ว
      updatedAt: Date.now() - 3600000
    },
    {
      id: 'BILL002',
      orderId: 'ORD002',
      tableNo: 3,
      status: 'PAID' as const,
      payments: [
        {
          method: 'CASH' as const,
          amount: 185,
          paidAt: Date.now() - 1800000, // 30 นาทีที่แล้ว
          by: 'Cashier01'
        }
      ],
      createdAt: Date.now() - 7200000, // 2 ชั่วโมงที่แล้ว
      updatedAt: Date.now() - 1800000
    },
    {
      id: 'BILL003',
      orderId: 'ORD003',
      tableNo: 7,
      status: 'UNPAID' as const,
      payments: [],
      createdAt: Date.now() - 5400000, // 1.5 ชั่วโมงที่แล้ว
      updatedAt: Date.now() - 5400000
    }
  ];

  // Initialize sample orders matching the bills
  const sampleOrders = [
    {
      id: 'ORD001',
      queueNo: 'A001',
      orderType: 'dine-in' as const,
      tableNo: 5,
      items: [
        { sku: 'A001', name: 'ข้าวผัดไก่', price: 45, quantity: 2 },
        { sku: 'A003', name: 'ชาไทย', price: 25, quantity: 1 }
      ],
      totals: {
        sub: 115,
        discount: 0,
        grand: 115
      },
      status: 'OPEN' as const,
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
      updatedBy: 'POS01'
    },
    {
      id: 'ORD002',
      queueNo: 'A002',
      orderType: 'takeaway' as const,
      items: [
        { sku: 'A002', name: 'ข้าวผัดหมู', price: 40, quantity: 3 },
        { sku: 'W001', name: 'น้ำเปล่า', price: 10, quantity: 2 },
        { sku: 'A004', name: 'ชาเขียว', price: 20, quantity: 2 }
      ],
      totals: {
        sub: 185,
        discount: 0,
        grand: 185
      },
      status: 'PAID' as const,
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now() - 1800000,
      updatedBy: 'POS01'
    },
    {
      id: 'ORD003',
      queueNo: 'A003',
      orderType: 'dine-in' as const,
      tableNo: 7,
      items: [
        { sku: 'A001', name: 'ข้าวผัดไก่', price: 45, quantity: 1 },
        { sku: 'A003', name: 'ชาไทย', price: 25, quantity: 2 },
        { sku: 'W002', name: 'น้ำอัดลม', price: 15, quantity: 1 }
      ],
      totals: {
        sub: 110,
        discount: 0,
        grand: 110
      },
      status: 'OPEN' as const,
      createdAt: Date.now() - 5400000,
      updatedAt: Date.now() - 5400000,
      updatedBy: 'POS01'
    }
  ];

  window.App = {
    state: {
      version: 1,
      menus: seedMenus,
      orders: sampleOrders,
      tickets: [],
      bills: sampleBills,
      kpis: {},
      pendingOrderMeta: {},
      settings: {
        mode: 'LOCAL_ONLY'
      }
    } as AppState,
    ui: {
      // Navigation function to switch between pages
      navigateTo: (page: string) => {
        console.log('Navigating to:', page);
        setCurrentPage(page);
      }
    },
    auth: {
      // PIN authentication (demo implementation)
      login: (pin: string) => {
        if (pin === '1234' || pin === '123456') {
          setIsAuthenticated(true);
          setShowRoleSelection(true);
          return true;
        }
        return false;
      },
      logout: () => {
        setIsAuthenticated(false);
        setShowRoleSelection(false);
        setCurrentPage('login');
      },
      isAuthed: () => isAuthenticated,
      requireRole: (role: string) => isAuthenticated
    },
    pos: {
      init: () => {
        console.log('POS initialized');
      }
    },
    kds: {
      listenKitchen: () => {
        console.log('KDS Kitchen listening');
      },
      listenTea: () => {
        console.log('KDS Tea listening');
      }
    },
    reports: {
      computeKPIs: (range: any) => {
        return {
          dailySales: 1250.50,
          topItems: ['ข้าวผัดไก่', 'ชาไทย'],
          avgCookTime: 8.5,
          slaBreach: 12
        };
      }
    },
    cloud: {
      enable: async (config: { orgId: string; storeId: string }) => {
        window.App.state.settings.mode = 'CLOUD_SYNC';
        window.App.state.settings.orgId = config.orgId;
        window.App.state.settings.storeId = config.storeId;
        // Save to localStorage for persistence
        localStorage.setItem('posSettings', JSON.stringify(window.App.state.settings));
      },
      disable: () => {
        window.App.state.settings.mode = 'LOCAL_ONLY';
        delete window.App.state.settings.orgId;
        delete window.App.state.settings.storeId;
        localStorage.setItem('posSettings', JSON.stringify(window.App.state.settings));
      },
      status: () => {
        return window.App.state.settings.mode;
      }
    },
    queue: {
      enqueue: (action: any) => {
        console.log('Queued action:', action);
      },
      flush: () => {
        console.log('Flushing queue');
      }
    },
    events: {
      // Simple pub/sub for internal communication
      listeners: new Map(),
      on: (event: string, callback: Function) => {
        if (!window.App.events.listeners.has(event)) {
          window.App.events.listeners.set(event, []);
        }
        window.App.events.listeners.get(event).push(callback);
      },
      emit: (event: string, data: any) => {
        const callbacks = window.App.events.listeners.get(event) || [];
        callbacks.forEach((callback: Function) => callback(data));
      }
    }
  };

  // Load saved settings from localStorage
  const savedSettings = localStorage.getItem('posSettings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      window.App.state.settings = { ...window.App.state.settings, ...settings };
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
};

// Export JSON data for backup
export const handleExportJSON = () => {
  const dataStr = JSON.stringify(window.App.state, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pos-data-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// Import JSON data from file
export const handleImportJSON = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          window.App.state = { ...window.App.state, ...data };
          alert('ข้อมูลถูกโหลดเรียบร้อยแล้ว');
        } catch (error) {
          alert('ไฟล์ไม่ถูกต้อง');
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
};