import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Download,
  Cloud,
  CloudOff,
  BarChart3,
  FileText,
  Settings,
  DollarSign,
  Receipt,
  CreditCard
} from 'lucide-react';

interface ManagerProps {
  onBack: () => void;
}

interface KPIData {
  dailySales: number;
  topItems: string[];
  avgCookTime: number;
  slaBreach: number;
}

export default function Manager({ onBack }: ManagerProps) {
  // State for KPI data and cloud settings
  const [kpiData, setKpiData] = useState<KPIData>({
    dailySales: 0,
    topItems: [],
    avgCookTime: 0,
    slaBreach: 0
  });
  const [dateRange, setDateRange] = useState('today');
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [orgId, setOrgId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [cloudStatus, setCloudStatus] = useState<'LOCAL_ONLY' | 'CLOUD_SYNC'>('LOCAL_ONLY');

  // Load saved settings and compute KPIs on mount
  useEffect(() => {
    // Load cloud settings from localStorage
    const savedSettings = localStorage.getItem('posSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setCloudStatus(settings.mode || 'LOCAL_ONLY');
        setOrgId(settings.orgId || '');
        setStoreId(settings.storeId || '');
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }

    // Compute initial KPIs
    computeKPIs();
  }, []);

  // Auto-enable cloud sync if settings exist
  useEffect(() => {
    if (cloudStatus === 'CLOUD_SYNC' && orgId && storeId) {
      enableCloudSync();
    }
  }, []);

  // Compute KPI metrics from current data
  const computeKPIs = () => {
    if (!window.App?.state) return;

    const { orders, tickets, bills } = window.App.state;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Filter data by date range
    let startDate = today;
    if (dateRange === 'week') {
      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const filteredOrders = orders.filter(order => 
      new Date(order.createdAt) >= startDate
    );
    const filteredTickets = tickets.filter(ticket => 
      new Date(ticket.createdAt) >= startDate && ticket.readyAt
    );
    const filteredBills = bills.filter(bill => 
      new Date(bill.createdAt) >= startDate && bill.status === 'PAID'
    );

    // Calculate daily sales
    const dailySales = filteredBills.reduce((sum, bill) => 
      sum + (bill.amount || 0), 0
    );

    // Calculate top items
    const itemCount = new Map();
    filteredOrders.forEach(order => {
      order.items?.forEach((item: any) => {
        const count = itemCount.get(item.name) || 0;
        itemCount.set(item.name, count + item.quantity);
      });
    });
    const topItems = Array.from(itemCount.entries())
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([name]) => name as string);

    // Calculate average cook time
    const avgCookTime = filteredTickets.length > 0 
      ? filteredTickets.reduce((sum, ticket) => {
          const cookTime = (ticket.readyAt! - (ticket.startedAt || ticket.createdAt)) / 1000 / 60;
          return sum + cookTime;
        }, 0) / filteredTickets.length
      : 0;

    // Calculate SLA breach percentage
    const slaBreach = filteredTickets.length > 0
      ? (filteredTickets.filter(ticket => {
          const cookTime = (ticket.readyAt! - (ticket.startedAt || ticket.createdAt)) / 1000 / 60;
          return cookTime > ticket.slaMin;
        }).length / filteredTickets.length) * 100
      : 0;

    setKpiData({
      dailySales,
      topItems,
      avgCookTime,
      slaBreach
    });
  };

  // Export data as JSON
  const exportJSON = () => {
    if (!window.App?.state) return;

    const exportData = {
      exportedAt: new Date().toISOString(),
      dateRange,
      data: window.App.state
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pos-export-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export data as CSV
  const exportCSV = () => {
    if (!window.App?.state) return;

    const { orders, bills } = window.App.state;
    
    // Create CSV content
    const csvContent = [
      ['Date', 'Order ID', 'Queue No', 'Order Type', 'Table', 'Amount', 'Status'].join(','),
      ...orders.map(order => [
        new Date(order.createdAt).toISOString().split('T')[0],
        order.id,
        order.queueNo,
        order.orderType,
        order.tableNo || '',
        order.totals?.grand || 0,
        order.status
      ].join(','))
    ].join('\n');

    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pos-orders-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Enable cloud sync
  const enableCloudSync = async () => {
    if (!orgId.trim() || !storeId.trim()) {
      alert('กรุณากรอก Organization ID และ Store ID');
      return;
    }

    try {
      // Call the global cloud enable function
      if (window.App?.cloud?.enable) {
        await window.App.cloud.enable({ orgId: orgId.trim(), storeId: storeId.trim() });
      }

      // Update local state and UI
      setCloudStatus('CLOUD_SYNC');
      
      // Save to localStorage for persistence
      const settings = {
        mode: 'CLOUD_SYNC',
        orgId: orgId.trim(),
        storeId: storeId.trim()
      };
      localStorage.setItem('posSettings', JSON.stringify(settings));
      
      setShowCloudModal(false);
      alert('✅ เปิดใช้งาน Cloud Sync เรียบร้อยแล้ว');
      
    } catch (error) {
      console.error('Failed to enable cloud sync:', error);
      alert('❌ ไม่สามารถเปิดใช้งาน Cloud Sync ได้');
    }
  };

  // Disable cloud sync
  const disableCloudSync = () => {
    try {
      // Call the global cloud disable function
      if (window.App?.cloud?.disable) {
        window.App.cloud.disable();
      }

      // Update local state
      setCloudStatus('LOCAL_ONLY');
      
      // Save to localStorage
      const settings = { mode: 'LOCAL_ONLY' };
      localStorage.setItem('posSettings', JSON.stringify(settings));
      
      alert('✅ ปิดใช้งาน Cloud Sync เรียบร้อยแล้ว');
      
    } catch (error) {
      console.error('Failed to disable cloud sync:', error);
      alert('❌ ไม่สามารถปิดใช้งาน Cloud Sync ได้');
    }
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
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-8 h-8 mr-3 text-red-900" />
                Dashboard ผู้จัดการ
              </h1>
              <p className="text-sm text-gray-600">
                รายงาน การตั้งค่า และการจัดการระบบ
              </p>
            </div>
          </div>
          
          {/* Cloud status indicator */}
          <div className="flex items-center space-x-4">
            <Badge 
              id="cloudStatus"
              variant={cloudStatus === 'CLOUD_SYNC' ? 'default' : 'secondary'}
              className={`flex items-center ${
                cloudStatus === 'CLOUD_SYNC' ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              {cloudStatus === 'CLOUD_SYNC' ? (
                <>
                  <Cloud className="w-4 h-4 mr-1" />
                  Cloud Sync
                </>
              ) : (
                <>
                  <CloudOff className="w-4 h-4 mr-1" />
                  Local Only
                </>
              )}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="export">Export ข้อมูล</TabsTrigger>
            <TabsTrigger value="settings">ตั้งค่า</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Date range selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">ช่วงเวลา:</label>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setTimeout(computeKPIs, 100); // Recompute after state update
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="today">วันนี้</option>
                <option value="week">7 วันที่ผ่านมา</option>
                <option value="month">เดือนนี้</option>
              </select>
              <Button 
                size="sm" 
                variant="outline"
                onClick={computeKPIs}
              >
                รีเฟรช
              </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Daily Sales */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ยอดขายรวม</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div id="kpiDailySales" className="text-2xl font-bold text-green-600">
                    ฿{kpiData.dailySales.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dateRange === 'today' ? 'วันนี้' : 
                     dateRange === 'week' ? '7 วันที่ผ่านมา' : 'เดือนนี้'}
                  </p>
                </CardContent>
              </Card>

              {/* Top Items */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">เมนูขายดี</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div id="kpiTopItems" className="space-y-1">
                    {kpiData.topItems.length > 0 ? (
                      kpiData.topItems.map((item, index) => (
                        <div key={index} className="text-sm">
                          {index + 1}. {item}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">ไม่มีข้อมูล</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Average Cook Time */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">เวลาทำอาหารเฉลี่ย</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div id="kpiAvgCook" className="text-2xl font-bold text-blue-600">
                    {kpiData.avgCookTime.toFixed(1)} นาที
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ต่อออเดอร์
                  </p>
                </CardContent>
              </Card>

              {/* SLA Breach */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">เกิน SLA</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div id="kpiSLABreach" className={`text-2xl font-bold ${
                    kpiData.slaBreach > 20 ? 'text-red-600' : 
                    kpiData.slaBreach > 10 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {kpiData.slaBreach.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ของออเดอร์ทั้งหมด
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Bills Management */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent 
                  className="p-6 text-center"
                  onClick={() => {
                    if (window.App?.ui?.navigateTo) {
                      window.App.ui.navigateTo('bills');
                    }
                  }}
                >
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-bold mb-2">จัดการบิล</h3>
                  <p className="text-sm text-gray-600">
                    ตรวจสอบและจัดการบิลค้างชำระ
                  </p>
                  <Badge 
                    variant="secondary" 
                    className="mt-2 bg-red-100 text-red-700"
                  >
                    {window.App?.state?.bills?.filter(bill => bill.status === 'UNPAID').length || 0} บิลค้าง
                  </Badge>
                </CardContent>
              </Card>

              {/* Reports */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-green-100">
                <CardContent 
                  className="p-6 text-center"
                  onClick={() => {
                    if (window.App?.ui?.navigateTo) {
                      window.App.ui.navigateTo('reports');
                    }
                  }}
                >
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-bold mb-2">รายงานโดยละเอียด</h3>
                  <p className="text-sm text-gray-600">
                    วิเคราะห์ข้อมูลขายและประสิทธิภาพ
                  </p>
                  <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
                    6 รายงาน
                  </Badge>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-6 text-center">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-bold mb-2">ตั้งค่าระบบ</h3>
                  <p className="text-sm text-gray-600">
                    จัดการเมนู พิมพ์เตอร์ และการตั้งค่า
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    เร็วๆ นี้
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Additional charts placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>กราฟแสดงยอดขาย</CardTitle>
                <CardDescription>
                  TODO: Implement charts using recharts library
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-500">กราฟจะแสดงที่นี่</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* JSON Export */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Export JSON
                  </CardTitle>
                  <CardDescription>
                    ส่งออกข้อมูลทั้งหมดในรูปแบบ JSON สำหรับสำรองข้อมูลหรือย้ายระบบ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    id="btnExportJSON"
                    onClick={exportJSON}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    ดาวน์โหลด JSON
                  </Button>
                </CardContent>
              </Card>

              {/* CSV Export */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Export CSV
                  </CardTitle>
                  <CardDescription>
                    ส่งออกข้อมูลออเดอร์ในรูปแบบ CSV สำหรับนำเข้า Excel หรือระบบอื่น
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    id="btnExportCSV"
                    onClick={exportCSV}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    ดาวน์โหลด CSV
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Cloud Sync Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cloud className="w-5 h-5 mr-2" />
                  Cloud Sync
                </CardTitle>
                <CardDescription>
                  เชื่อมต่อกับ Firebase Firestore เพื่อซิงก์ข้อมูลระหว่างอุปกรณ์
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">สถานะปัจจุบัน</h4>
                    <p className="text-sm text-gray-600">
                      {cloudStatus === 'CLOUD_SYNC' ? 
                        `เชื่อมต่อแล้ว (${orgId}/${storeId})` : 
                        'ใช้งานแบบออฟไลน์เท่านั้น'}
                    </p>
                  </div>
                  <Badge 
                    variant={cloudStatus === 'CLOUD_SYNC' ? 'default' : 'secondary'}
                    className={cloudStatus === 'CLOUD_SYNC' ? 'bg-green-600' : 'bg-gray-600'}
                  >
                    {cloudStatus === 'CLOUD_SYNC' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </Badge>
                </div>

                <div className="flex space-x-2">
                  {cloudStatus === 'LOCAL_ONLY' ? (
                    <Button 
                      id="btnEnableCloud"
                      onClick={() => setShowCloudModal(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Cloud className="w-4 h-4 mr-2" />
                      เปิดใช้งาน Cloud Sync
                    </Button>
                  ) : (
                    <Button 
                      id="btnDisableCloud"
                      onClick={disableCloudSync}
                      variant="outline"
                    >
                      <CloudOff className="w-4 h-4 mr-2" />
                      ปิดใช้งาน Cloud Sync
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  ข้อมูลระบบ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>เวอร์ชัน:</span>
                  <span>1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>จำนวนเมนู:</span>
                  <span>{window.App?.state?.menus?.length || 0} รายการ</span>
                </div>
                <div className="flex justify-between">
                  <span>จำนวนออเดอร์:</span>
                  <span>{window.App?.state?.orders?.length || 0} รายการ</span>
                </div>
                <div className="flex justify-between">
                  <span>จำนวนบิล:</span>
                  <span>{window.App?.state?.bills?.length || 0} รายการ</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Cloud Sync Configuration Modal */}
      <Dialog open={showCloudModal} onOpenChange={setShowCloudModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ตั้งค่า Cloud Sync</DialogTitle>
            <DialogDescription>
              กรุณากรอกข้อมูลการเชื่อมต่อ Firebase Firestore
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="orgIdInput" className="block text-sm font-medium mb-2">
                Organization ID
              </label>
              <Input
                id="orgIdInput"
                placeholder="ตัวอย่าง: restaurant-chain-001"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="storeIdInput" className="block text-sm font-medium mb-2">
                Store ID
              </label>
              <Input
                id="storeIdInput"
                placeholder="ตัวอย่าง: branch-central-world"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
              />
            </div>
            
            <div className="text-xs text-gray-500 p-3 bg-yellow-50 rounded">
              <p>⚠️ หมายเหตุ: Figma Make ไม่เหมาะสำหรับเก็บข้อมูลส่วนตัว (PII) หรือข้อมูลที่ต้องการความปลอดภัยสูง</p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowCloudModal(false)}
                variant="outline"
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={enableCloudSync}
                disabled={!orgId.trim() || !storeId.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                เปิดใช้งาน
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}