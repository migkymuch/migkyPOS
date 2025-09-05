import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ChefHat, Monitor, Settings, Store } from 'lucide-react';
import { handleExportJSON, handleImportJSON } from '../services/appService';

interface RoleSelectionProps {
  isOnline: boolean;
  showRoleSelection: boolean;
  currentPage: string;
  isAuthenticated: boolean;
  onRoleSelection: (role: string) => void;
}

export default function RoleSelection({ 
  isOnline, 
  showRoleSelection, 
  currentPage, 
  isAuthenticated,
  onRoleSelection 
}: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 p-4">
      {/* Online/Offline status banner */}
      <div className="fixed top-4 right-4 z-50">
        <Badge 
          variant={isOnline ? "default" : "destructive"}
          className={isOnline ? "bg-green-600" : "bg-red-600"}
        >
          {isOnline ? "🟢 ออนไลน์" : "🔴 ออฟไลน์"}
        </Badge>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">เลือกบทบาทของคุณ</h1>
          <p className="text-red-200">กรุณาเลือกหน้าที่ที่ต้องการใช้งาน</p>
        </div>

        {/* Role selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* POS Role */}
          <Card 
            id="rolePOS"
            className="cursor-pointer hover:shadow-lg transition-all bg-white/90 backdrop-blur select-none hover:scale-105 transform duration-200 relative z-10"
            onClick={(e) => {
              e.preventDefault();
              console.log('POS Role clicked!');
              // Show visual feedback
              const card = e.currentTarget;
              card.style.transform = 'scale(0.95)';
              setTimeout(() => {
                card.style.transform = 'scale(1.05)';
                onRoleSelection('POS');
              }, 100);
            }}
          >
            <CardContent className="p-6 text-center">
              <Store className="w-12 h-12 mx-auto mb-4 text-red-900" />
              <h3 className="font-bold mb-2">จุดขาย (POS)</h3>
              <p className="text-sm text-gray-600">รับออเดอร์ ชำระเงิน พิมพ์ใบเสร็จ</p>
            </CardContent>
          </Card>

          {/* KDS Kitchen Role */}
          <Card 
            id="roleKDSKitchen"
            className="cursor-pointer hover:shadow-lg transition-all bg-white/90 backdrop-blur select-none hover:scale-105 transform duration-200 relative z-10"
            onClick={(e) => {
              e.preventDefault();
              console.log('KDS Kitchen Role clicked!');
              const card = e.currentTarget;
              card.style.transform = 'scale(0.95)';
              setTimeout(() => {
                card.style.transform = 'scale(1.05)';
                onRoleSelection('KDS Kitchen');
              }, 100);
            }}
          >
            <CardContent className="p-6 text-center">
              <ChefHat className="w-12 h-12 mx-auto mb-4 text-red-900" />
              <h3 className="font-bold mb-2">KDS ครัว</h3>
              <p className="text-sm text-gray-600">จอแสดงคิวครัว ข้าว น้ำ</p>
            </CardContent>
          </Card>

          {/* KDS Tea Role */}
          <Card 
            id="roleKDSTea"
            className="cursor-pointer hover:shadow-lg transition-all bg-white/90 backdrop-blur select-none hover:scale-105 transform duration-200 relative z-10"
            onClick={(e) => {
              e.preventDefault();
              console.log('KDS Tea Role clicked!');
              const card = e.currentTarget;
              card.style.transform = 'scale(0.95)';
              setTimeout(() => {
                card.style.transform = 'scale(1.05)';
                onRoleSelection('KDS Tea');
              }, 100);
            }}
          >
            <CardContent className="p-6 text-center">
              <Monitor className="w-12 h-12 mx-auto mb-4 text-red-900" />
              <h3 className="font-bold mb-2">KDS ชา</h3>
              <p className="text-sm text-gray-600">จอแสดงคิวเครื่องดื่ม ชา</p>
            </CardContent>
          </Card>

          {/* Manager Role */}
          <Card 
            id="roleManager"
            className="cursor-pointer hover:shadow-lg transition-all bg-white/90 backdrop-blur select-none hover:scale-105 transform duration-200 relative z-10"
            onClick={(e) => {
              e.preventDefault();
              console.log('Manager Role clicked!');
              const card = e.currentTarget;
              card.style.transform = 'scale(0.95)';
              setTimeout(() => {
                card.style.transform = 'scale(1.05)';
                onRoleSelection('Manager');
              }, 100);
            }}
          >
            <CardContent className="p-6 text-center">
              <Settings className="w-12 h-12 mx-auto mb-4 text-red-900" />
              <h3 className="font-bold mb-2">ผู้จัดการ</h3>
              <p className="text-sm text-gray-600">รายงาน ตั้งค่า บริหาร</p>
            </CardContent>
          </Card>
        </div>

        {/* Data management buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={handleImportJSON}
            variant="outline"
            className="bg-white/90 backdrop-blur"
          >
            📁 โหลดข้อมูลจากไฟล์
          </Button>
          
          <Button
            onClick={handleExportJSON}
            variant="outline"
            className="bg-white/90 backdrop-blur"
          >
            💾 บันทึกข้อมูล
          </Button>

          <Button
            onClick={() => {
              console.log('Logout clicked');
              if (window.App && window.App.auth) {
                window.App.auth.logout();
              }
            }}
            variant="outline"
            className="bg-white/90 backdrop-blur"
          >
            🚪 ออกจากระบบ
          </Button>
          
          {/* Debug button to test role selection */}
          <Button
            onClick={() => {
              console.log('Debug: Testing role selection directly');
              console.log('Current state - showRoleSelection:', showRoleSelection);
              console.log('Current state - currentPage:', currentPage);
              console.log('Current state - isAuthenticated:', isAuthenticated);
              alert(`Debug Info:
- showRoleSelection: ${showRoleSelection}
- currentPage: ${currentPage}
- isAuthenticated: ${isAuthenticated}
การคลิกทำงานแล้ว!`);
            }}
            variant="outline"
            className="bg-yellow-100 hover:bg-yellow-200 border-yellow-400"
          >
            🐛 ทดสอบการคลิก
          </Button>
        </div>
      </div>
    </div>
  );
}