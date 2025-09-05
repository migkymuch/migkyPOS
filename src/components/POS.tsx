import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Send, 
  CreditCard,
  Printer,
  QrCode,
  Banknote
} from 'lucide-react';

interface POSProps {
  onBack: () => void;
}

interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: any[];
}

interface MenuItem {
  sku: string;
  name: string;
  price: number;
  category: 'rice' | 'tea' | 'water';
  station: 'kitchen' | 'tea';
  imageUrl?: string;
  imageAlt?: string;
  modifiers: any[];
}

export default function POS({ onBack }: POSProps) {
  // State for menu and cart management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR' | null>(null);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  // Get order metadata from global state
  const orderMeta = window.App?.state?.pendingOrderMeta || {};
  
  // Get menu items from global state with seed data fallback
  const menuItems: MenuItem[] = window.App?.state?.menus || [
    {
      sku: 'A001',
      name: 'ข้าวผัดไก่',
      price: 45,
      category: 'rice',
      station: 'kitchen',
      imageUrl: '/placeholder-food.jpg',
      imageAlt: 'ข้าวผัดไก่',
      modifiers: []
    },
    {
      sku: 'A003',
      name: 'ชาไทย',
      price: 25,
      category: 'tea',
      station: 'tea',
      imageUrl: '/placeholder-tea.jpg',
      imageAlt: 'ชาไทย',
      modifiers: []
    },
    {
      sku: 'W001',
      name: 'น้ำเปล่า',
      price: 10,
      category: 'water',
      station: 'kitchen',
      imageUrl: '/placeholder-water.jpg',
      imageAlt: 'น้ำเปล่า',
      modifiers: []
    }
  ];

  // Filter menu items based on search and category
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate cart totals
  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = 0; // TODO: Implement discount logic
    const grand = subtotal - discount;
    
    return { subtotal, discount, grand };
  };

  const totals = calculateTotals();

  // Add item to cart
  const addToCart = (menuItem: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.sku === menuItem.sku);
      
      if (existingItem) {
        // Increase quantity if item already exists
        return prevCart.map(item =>
          item.sku === menuItem.sku
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item to cart
        return [...prevCart, {
          sku: menuItem.sku,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          modifiers: []
        }];
      }
    });
  };

  // Update item quantity in cart
  const updateQuantity = (sku: string, change: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.sku === sku) {
          const newQuantity = Math.max(0, item.quantity + change);
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Generate queue number (simple increment for demo)
  const generateQueueNo = (): string => {
    const existingOrders = window.App?.state?.orders || [];
    const nextNumber = existingOrders.length + 1;
    const letter = String.fromCharCode(65 + ((nextNumber - 1) % 26)); // A-Z cycling
    const number = String(((nextNumber - 1) % 999) + 1).padStart(3, '0');
    return `${letter}${number}`;
  };

  // Send order to kitchen (create order, tickets, and bill)
  const sendToKitchen = () => {
    if (cart.length === 0) return;

    const queueNo = generateQueueNo();
    const orderId = `ORD-${Date.now()}`;
    const now = Date.now();

    // Create order object
    const order = {
      id: orderId,
      queueNo,
      orderType: orderMeta.orderType,
      tableNo: orderMeta.tableNo,
      platform: orderMeta.platform,
      trackingNo: orderMeta.trackingNo,
      items: cart.map(item => ({
        sku: item.sku,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        modifiers: item.modifiers
      })),
      totals,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
      updatedBy: 'POS'
    };

    // Create tickets by station
    const ticketsByStation = new Map();
    cart.forEach(item => {
      const menuItem = menuItems.find(m => m.sku === item.sku);
      if (menuItem) {
        if (!ticketsByStation.has(menuItem.station)) {
          ticketsByStation.set(menuItem.station, []);
        }
        ticketsByStation.get(menuItem.station).push(item);
      }
    });

    const tickets = Array.from(ticketsByStation.entries()).map(([station, items]) => ({
      id: `TKT-${orderId}-${station}`,
      orderId,
      station,
      status: 'NEW',
      items,
      slaMin: station === 'kitchen' ? 5 : 3,
      createdAt: now
    }));

    // Create bill
    const bill = {
      id: `BILL-${orderId}`,
      orderId,
      tableNo: orderMeta.tableNo,
      status: 'UNPAID',
      payments: [],
      createdAt: now,
      updatedAt: now,
      amount: totals.grand
    };

    // Save to global state
    if (window.App) {
      window.App.state.orders.push(order);
      window.App.state.tickets.push(...tickets);
      window.App.state.bills.push(bill);
    }

    // Clear cart and show success
    setCart([]);
    alert(`✅ ส่งเข้าครัวเรียบร้อย\nคิว: ${queueNo}`);

    // TODO: Implement CLOUD_SYNC push if enabled
    if (window.App?.state.settings.mode === 'CLOUD_SYNC') {
      console.log('TODO: Push to Firestore:', { order, tickets, bill });
    }
  };

  // Process payment
  const processPayment = () => {
    if (!paymentMethod || cart.length === 0) return;

    const orderId = `ORD-${Date.now()}`;
    const now = Date.now();

    // Find or create the bill
    const billId = `BILL-${orderId}`;
    const payment = {
      method: paymentMethod,
      amount: totals.grand,
      paidAt: now,
      by: 'POS'
    };

    // Update bill status to PAID
    if (window.App) {
      const existingBill = window.App.state.bills.find(b => b.id === billId);
      if (existingBill) {
        existingBill.status = 'PAID';
        existingBill.payments.push(payment);
        existingBill.updatedAt = now;
      }
    }

    // Set current order for receipt
    setCurrentOrder({
      id: orderId,
      queueNo: generateQueueNo(),
      ...orderMeta,
      items: cart,
      totals,
      payment,
      paidAt: now
    });

    setShowPaymentModal(false);
    setShowReceiptModal(true);
  };

  // Print receipt (open print dialog)
  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              onClick={onBack}
              variant="outline" 
              size="sm"
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับ
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จุดขาย (POS)</h1>
              <p className="text-sm text-gray-600">
                {orderMeta.orderType === 'dine-in' && `โต๊ะ ${orderMeta.tableNo}`}
                {orderMeta.orderType === 'takeaway' && 'ซื้อกลับ'}
                {orderMeta.orderType === 'delivery' && `${orderMeta.platform} - ${orderMeta.trackingNo}`}
              </p>
            </div>
          </div>
          
          {/* Cart summary */}
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              <ShoppingCart className="w-4 h-4 mr-1" />
              {cart.reduce((sum, item) => sum + item.quantity, 0)} รายการ
            </Badge>
            <div className="text-right">
              <div className="text-lg font-bold text-red-900">
                ฿{totals.grand.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Menu section */}
        <div className="flex-1 p-4">
          {/* Search and filter bar */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="menuSearch"
                placeholder="ค้นหาเมนู..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                id="filterCategory"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">ทั้งหมด</option>
                <option value="rice">ข้าว</option>
                <option value="tea">ชา</option>
                <option value="water">น้ำ</option>
              </select>
            </div>
          </div>

          {/* Menu grid */}
          <div id="menuGrid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMenuItems.map((item) => (
              <Card 
                key={item.sku}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-4">
                  {/* Menu item image */}
                  <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={item.imageUrl || '/placeholder-food.jpg'}
                      alt={item.imageAlt || item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Menu item details */}
                  <div className="text-center">
                    <h3 className="font-medium text-sm mb-1 truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{item.sku}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-red-900">
                        ฿{item.price}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          item.category === 'rice' ? 'bg-orange-100 text-orange-800' :
                          item.category === 'tea' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.category === 'rice' ? 'ข้าว' : 
                         item.category === 'tea' ? 'ชา' : 'น้ำ'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart sidebar */}
        <div className="w-80 bg-white border-l shadow-lg">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">ตะกร้าสินค้า</h2>
          </div>

          {/* Cart items */}
          <div id="cartList" className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>ไม่มีสินค้าในตะกร้า</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.sku} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-gray-500">฿{item.price} x {item.quantity}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.sku, -1)}
                      className="w-8 h-8 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.sku, 1)}
                      className="w-8 h-8 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart totals and actions */}
          <div className="border-t p-4 space-y-4">
            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ราคารวม:</span>
                <span>฿{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>ส่วนลด:</span>
                <span>-฿{totals.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>รวมสุทธิ:</span>
                <span className="text-red-900">฿{totals.grand.toFixed(2)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <Button
                id="btnSendKitchen"
                onClick={sendToKitchen}
                disabled={cart.length === 0}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Send className="w-4 h-4 mr-2" />
                ส่งเข้าครัว
              </Button>
              
              <Button
                id="btnPay"
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0}
                className="w-full bg-red-900 hover:bg-red-800"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                ชำระเงิน
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เลือกวิธีการชำระเงิน</DialogTitle>
            <DialogDescription>
              ยอดรวม: ฿{totals.grand.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={paymentMethod === 'CASH' ? "default" : "outline"}
                onClick={() => setPaymentMethod('CASH')}
                className="h-20 flex-col"
              >
                <Banknote className="w-8 h-8 mb-2" />
                เงินสด
              </Button>
              
              <Button
                variant={paymentMethod === 'QR' ? "default" : "outline"}
                onClick={() => setPaymentMethod('QR')}
                className="h-20 flex-col"
              >
                <QrCode className="w-8 h-8 mb-2" />
                QR Code
              </Button>
            </div>
            
            <Button
              onClick={processPayment}
              disabled={!paymentMethod}
              className="w-full bg-red-900 hover:bg-red-800"
            >
              ยืนยันการชำระเงิน
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ใบเสร็จรับเงิน</DialogTitle>
          </DialogHeader>
          
          <div id="receiptContainer" className="receipt-58 space-y-3">
            {currentOrder && (
              <>
                <div className="text-center border-b pb-2">
                  <h3 className="font-bold">ร้านอาหารไก่</h3>
                  <p className="text-xs">คิว: {currentOrder.queueNo}</p>
                  <p className="text-xs">{new Date(currentOrder.paidAt).toLocaleString('th-TH')}</p>
                </div>
                
                <div className="space-y-1">
                  {currentOrder.items.map((item: CartItem) => (
                    <div key={item.sku} className="flex justify-between text-xs">
                      <span>{item.name} x{item.quantity}</span>
                      <span>฿{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>รวม:</span>
                    <span>฿{currentOrder.totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ส่วนลด:</span>
                    <span>-฿{currentOrder.totals.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>สุทธิ:</span>
                    <span>฿{currentOrder.totals.grand.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ชำระด้วย:</span>
                    <span>{currentOrder.payment.method === 'CASH' ? 'เงินสด' : 'QR Code'}</span>
                  </div>
                </div>
                
                <div className="text-center text-xs border-t pt-2">
                  <p>ขอบคุณที่ใช้บริการ</p>
                </div>
              </>
            )}
          </div>
          
          <Button
            id="btnPrint"
            onClick={printReceipt}
            className="w-full bg-red-900 hover:bg-red-800"
          >
            <Printer className="w-4 h-4 mr-2" />
            พิมพ์ใบเสร็จ
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}