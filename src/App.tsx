import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { AlertCircle } from 'lucide-react';
import OrderTypeSelection from './components/OrderTypeSelection';
import POS from './components/POS';
import KDSKitchen from './components/KDSKitchen';
import KDSTea from './components/KDSTea';
import Manager from './components/Manager';
import Bills from './components/Bills';
import Reports from './components/Reports';
import LoginScreen from './components/LoginScreen';
import RoleSelection from './components/RoleSelection';
import { initializeGlobalApp } from './services/appService';
import './types';

export default function App() {
  // State for authentication and current page
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Initialize global App namespace on component mount
  useEffect(() => {
    initializeGlobalApp(
      setCurrentPage,
      setIsAuthenticated,
      setShowRoleSelection,
      isAuthenticated
    );

    // Listen for online/offline status changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle role selection and navigation
  const handleRoleSelection = (role: string) => {
    console.log('Role selected:', role);
    console.log('Current showRoleSelection:', showRoleSelection);
    console.log('Current currentPage:', currentPage);
    
    // Hide role selection first
    setShowRoleSelection(false);
    
    // Then navigate to the appropriate page
    switch (role) {
      case 'POS':
        console.log('Setting page to order-type');
        setCurrentPage('order-type');
        break;
      case 'KDS Kitchen':
        console.log('Setting page to kds-kitchen');
        setCurrentPage('kds-kitchen');
        break;
      case 'KDS Tea':
        console.log('Setting page to kds-tea');
        setCurrentPage('kds-tea');
        break;
      case 'Manager':
        console.log('Setting page to manager');
        setCurrentPage('manager');
        break;
      default:
        console.log('Unknown role:', role);
        break;
    }
  };

  // Handle login callback (placeholder for future use)
  const handleLogin = (pin: string) => {
    // This is handled in the LoginScreen component via window.App.auth.login
    // Just kept for consistency in case we need custom logic
  };

  // Render different pages based on current state
  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen
          isOnline={isOnline}
          onLogin={handleLogin}
        />
        <Toaster />
      </>
    );
  }

  // Show role selection after successful login
  if (showRoleSelection) {
    return (
      <>
        <RoleSelection
          isOnline={isOnline}
          showRoleSelection={showRoleSelection}
          currentPage={currentPage}
          isAuthenticated={isAuthenticated}
          onRoleSelection={handleRoleSelection}
        />
        <Toaster />
      </>
    );
  }

  // Render different pages based on current state
  switch (currentPage) {
    case 'order-type':
      return (
        <>
          <OrderTypeSelection
            onBack={() => setShowRoleSelection(true)}
            onConfirm={() => setCurrentPage('pos')}
          />
          <Toaster />
        </>
      );
    
    case 'pos':
      return (
        <>
          <POS
            onBack={() => setCurrentPage('order-type')}
          />
          <Toaster />
        </>
      );
    
    case 'kds-kitchen':
      return (
        <>
          <KDSKitchen
            onBack={() => setShowRoleSelection(true)}
          />
          <Toaster />
        </>
      );
    
    case 'kds-tea':
      return (
        <>
          <KDSTea
            onBack={() => setShowRoleSelection(true)}
          />
          <Toaster />
        </>
      );
    
    case 'manager':
      return (
        <>
          <Manager
            onBack={() => setShowRoleSelection(true)}
          />
          <Toaster />
        </>
      );
    
    case 'bills':
      return (
        <>
          <Bills
            onBack={() => setCurrentPage('manager')}
          />
          <Toaster />
        </>
      );
    
    case 'reports':
      return (
        <>
          <Reports
            onBack={() => setCurrentPage('manager')}
          />
          <Toaster />
        </>
      );
    
    default:
      return (
        <>
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-900" />
                <h2 className="text-xl font-bold mb-2">หน้า {currentPage} ไม่พบ</h2>
                <p className="text-gray-600 mb-4">กรุณาเลือกบทบาทใหม่</p>
                <Button 
                  onClick={() => setShowRoleSelection(true)}
                >
                  กลับไปเลือกบทบาท
                </Button>
              </CardContent>
            </Card>
          </div>
          <Toaster />
        </>
      );
  }
}