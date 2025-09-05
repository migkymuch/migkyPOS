import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ArrowLeft, Store, Package, Truck } from 'lucide-react';

interface OrderTypeSelectionProps {
  onBack: () => void;
  onConfirm: (orderMeta: any) => void;
}

export default function OrderTypeSelection({ onBack, onConfirm }: OrderTypeSelectionProps) {
  // State for selected order type and related data
  const [selectedType, setSelectedType] = useState<'dine-in' | 'takeaway' | 'delivery' | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'shopee' | 'lineman' | 'grab' | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Validation for tracking number (3-32 characters, alphanumeric with dash/underscore)
  const validateTrackingNumber = (value: string): boolean => {
    const regex = /^[A-Za-z0-9\-_]{3,32}$/;
    return regex.test(value);
  };

  // Check if form is valid based on order type requirements
  useEffect(() => {
    let valid = false;
    
    switch (selectedType) {
      case 'dine-in':
        // Dine-in requires table selection (1-10)
        valid = selectedTable !== null && selectedTable >= 1 && selectedTable <= 10;
        break;
      case 'takeaway':
        // Takeaway has no additional requirements
        valid = true;
        break;
      case 'delivery':
        // Delivery requires platform and valid tracking number
        valid = selectedPlatform !== null && validateTrackingNumber(trackingNumber);
        break;
      default:
        valid = false;
    }
    
    setIsValid(valid);
  }, [selectedType, selectedTable, selectedPlatform, trackingNumber]);

  // Handle order type selection
  const handleTypeSelection = (type: 'dine-in' | 'takeaway' | 'delivery') => {
    setSelectedType(type);
    // Reset related selections when changing type
    setSelectedTable(null);
    setSelectedPlatform(null);
    setTrackingNumber('');
  };

  // Handle table selection for dine-in orders
  const handleTableSelection = (tableNo: number) => {
    setSelectedTable(tableNo);
  };

  // Handle platform selection for delivery orders
  const handlePlatformSelection = (platform: 'shopee' | 'lineman' | 'grab') => {
    setSelectedPlatform(platform);
  };

  // Handle tracking number input
  const handleTrackingChange = (value: string) => {
    setTrackingNumber(value);
  };

  // Submit the order metadata
  const handleConfirm = () => {
    if (!isValid) return;

    const orderMeta: any = {
      orderType: selectedType
    };

    // Add type-specific data
    switch (selectedType) {
      case 'dine-in':
        orderMeta.tableNo = selectedTable;
        break;
      case 'delivery':
        orderMeta.platform = selectedPlatform;
        orderMeta.trackingNo = trackingNumber;
        break;
    }

    // Save to global state and navigate to POS
    if (window.App) {
      window.App.state.pendingOrderMeta = orderMeta;
    }
    
    onConfirm(orderMeta);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <Button 
            onClick={onBack}
            variant="outline" 
            size="sm"
            className="bg-white/90 backdrop-blur mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">เลือกประเภทออเดอร์</h1>
            <p className="text-red-200">กรุณาเลือกประเภทการสั่ง</p>
          </div>
        </div>

        {/* Order type selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Dine-in option */}
          <Card 
            id="btnDineIn"
            className={`cursor-pointer transition-all ${
              selectedType === 'dine-in' 
                ? 'ring-4 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-lg bg-white/90'
            } backdrop-blur`}
            onClick={() => handleTypeSelection('dine-in')}
          >
            <CardContent className="p-6 text-center">
              <Store className="w-12 h-12 mx-auto mb-4 text-red-900" />
              <h3 className="font-bold mb-2">ทานที่ร้าน</h3>
              <p className="text-sm text-gray-600">สั่งอาหารทานในร้าน</p>
            </CardContent>
          </Card>

          {/* Takeaway option */}
          <Card 
            id="btnTakeaway"
            className={`cursor-pointer transition-all ${
              selectedType === 'takeaway' 
                ? 'ring-4 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-lg bg-white/90'
            } backdrop-blur`}
            onClick={() => handleTypeSelection('takeaway')}
          >
            <CardContent className="p-6 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-red-900" />
              <h3 className="font-bold mb-2">ซื้อกลับ</h3>
              <p className="text-sm text-gray-600">สั่งอาหารเพื่อนำกลับ</p>
            </CardContent>
          </Card>

          {/* Delivery option */}
          <Card 
            id="btnDelivery"
            className={`cursor-pointer transition-all ${
              selectedType === 'delivery' 
                ? 'ring-4 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-lg bg-white/90'
            } backdrop-blur`}
            onClick={() => handleTypeSelection('delivery')}
          >
            <CardContent className="p-6 text-center">
              <Truck className="w-12 h-12 mx-auto mb-4 text-red-900" />
              <h3 className="font-bold mb-2">เดลิเวอรี่</h3>
              <p className="text-sm text-gray-600">สั่งผ่านแอปฯ ส่งถึงที่</p>
            </CardContent>
          </Card>
        </div>

        {/* Conditional UI based on selected type */}
        {selectedType === 'dine-in' && (
          <Card className="mb-6 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>เลือกโต๊ะ</CardTitle>
              <CardDescription>กรุณาเลือกหมายเลขโต๊ะที่ลูกค้านั่ง</CardDescription>
            </CardHeader>
            <CardContent>
              <div id="tableButtons" className="grid grid-cols-5 gap-3">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((tableNo) => (
                  <Button
                    key={tableNo}
                    data-table={tableNo}
                    variant={selectedTable === tableNo ? "default" : "outline"}
                    className={`h-16 ${
                      selectedTable === tableNo 
                        ? 'bg-red-900 hover:bg-red-800' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleTableSelection(tableNo)}
                    aria-pressed={selectedTable === tableNo}
                  >
                    โต๊ะ {tableNo}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedType === 'delivery' && (
          <Card className="mb-6 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>ข้อมูลเดลิเวอรี่</CardTitle>
              <CardDescription>กรุณาเลือกแพลตฟอร์มและใส่หมายเลขพัสดุ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Platform selection */}
              <div>
                <label className="block text-sm font-medium mb-2">แพลตฟอร์ม</label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    id="platformShopee"
                    variant={selectedPlatform === 'shopee' ? "default" : "outline"}
                    className={selectedPlatform === 'shopee' ? 'bg-red-900 hover:bg-red-800' : ''}
                    onClick={() => handlePlatformSelection('shopee')}
                    aria-pressed={selectedPlatform === 'shopee'}
                  >
                    Shopee
                  </Button>
                  <Button
                    id="platformLineman"
                    variant={selectedPlatform === 'lineman' ? "default" : "outline"}
                    className={selectedPlatform === 'lineman' ? 'bg-red-900 hover:bg-red-800' : ''}
                    onClick={() => handlePlatformSelection('lineman')}
                    aria-pressed={selectedPlatform === 'lineman'}
                  >
                    LINE MAN
                  </Button>
                  <Button
                    id="platformGrab"
                    variant={selectedPlatform === 'grab' ? "default" : "outline"}
                    className={selectedPlatform === 'grab' ? 'bg-red-900 hover:bg-red-800' : ''}
                    onClick={() => handlePlatformSelection('grab')}
                    aria-pressed={selectedPlatform === 'grab'}
                  >
                    Grab
                  </Button>
                </div>
              </div>

              {/* Tracking number input */}
              <div>
                <label htmlFor="trackingInput" className="block text-sm font-medium mb-2">
                  หมายเลขพัสดุ
                </label>
                <Input
                  id="trackingInput"
                  type="text"
                  placeholder="ตัวอย่าง: LM-12345"
                  value={trackingNumber}
                  onChange={(e) => handleTrackingChange(e.target.value)}
                  className={`${
                    trackingNumber && !validateTrackingNumber(trackingNumber)
                      ? 'border-red-500 focus:border-red-500'
                      : ''
                  }`}
                />
                {trackingNumber && !validateTrackingNumber(trackingNumber) && (
                  <p className="text-sm text-red-500 mt-1">
                    หมายเลขพัสดุต้องมี 3-32 ตัวอักษร (A-Z, a-z, 0-9, -, _)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary and confirm button */}
        {selectedType && (
          <Card className="bg-white/90 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold mb-2">สรุปคำสั่ง</h3>
                  <div className="text-sm text-gray-600">
                    <p>ประเภท: {
                      selectedType === 'dine-in' ? 'ทานที่ร้าน' :
                      selectedType === 'takeaway' ? 'ซื้อกลับ' :
                      'เดลิเวอรี่'
                    }</p>
                    {selectedType === 'dine-in' && selectedTable && (
                      <p>โต๊ะ: {selectedTable}</p>
                    )}
                    {selectedType === 'delivery' && selectedPlatform && (
                      <>
                        <p>แพลตฟอร์ม: {
                          selectedPlatform === 'shopee' ? 'Shopee' :
                          selectedPlatform === 'lineman' ? 'LINE MAN' :
                          'Grab'
                        }</p>
                        {trackingNumber && <p>หมายเลขพัสดุ: {trackingNumber}</p>}
                      </>
                    )}
                  </div>
                </div>
                
                <Button
                  id="btnConfirm"
                  onClick={handleConfirm}
                  disabled={!isValid}
                  className="bg-red-900 hover:bg-red-800 disabled:opacity-50"
                  size="lg"
                >
                  ยืนยัน
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}