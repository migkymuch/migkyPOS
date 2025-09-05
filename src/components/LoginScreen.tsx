import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface LoginScreenProps {
  isOnline: boolean;
  onLogin: (pin: string) => void;
}

export default function LoginScreen({ isOnline, onLogin }: LoginScreenProps) {
  const [pinInput, setPinInput] = useState('');

  // Handle PIN input submission
  const handleLogin = () => {
    console.log('Login clicked, PIN:', pinInput);
    try {
      if (window.App && window.App.auth && window.App.auth.login(pinInput)) {
        setPinInput('');
        console.log('Login successful');
      } else {
        // Show error alert (TODO: Replace with SweetAlert2)
        alert('PIN ไม่ถูกต้อง กรุณาลองใหม่\nลอง: 1234 หรือ 123456');
        setPinInput('');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center p-4">
      {/* Online/Offline status banner */}
      <div className="fixed top-4 right-4 z-50">
        <Badge 
          id="bannerOnline" 
          variant={isOnline ? "default" : "destructive"}
          className={isOnline ? "bg-green-600" : "bg-red-600"}
        >
          {isOnline ? "🟢 ออนไลน์" : "🔴 ออฟไลน์"}
        </Badge>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/* Brand header with chicken logo */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🐔</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-900">ระบบ POS ร้านอาหาร</CardTitle>
          <CardDescription>กรุณาใส่รหัส PIN เพื่อเข้าสู่ระบบ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PIN input form */}
          <div className="space-y-2">
            <Input
              id="pinInput"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="รหัส PIN (4-6 หลัก)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLogin();
                }
              }}
              className="text-center text-lg tracking-widest"
            />
          </div>
          
          {/* Login button */}
          <Button 
            id="btnLogin"
            onClick={handleLogin}
            className="w-full bg-red-900 hover:bg-red-800"
            disabled={pinInput.length < 4}
          >
            เข้าสู่ระบบ
          </Button>

          {/* Demo credentials hint */}
          <div className="text-xs text-gray-500 text-center">
            Demo PIN: 1234 หรือ 123456
          </div>

          {/* Quick test button */}
          <Button 
            onClick={() => {
              console.log('Quick test button clicked!');
              alert('ปุ่มทำงานแล้ว! การคลิกใช้ได้');
              setPinInput('1234');
            }}
            variant="outline"
            className="w-full text-xs"
          >
            🧪 ทดสอบการคลิก (กดเพื่อใส่ PIN อัตโนมัติ)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}