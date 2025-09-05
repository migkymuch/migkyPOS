import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { toast } from 'sonner@2.0.3';
import { ArrowLeft, Search, Filter, DollarSign, RefreshCw, Trash2, Clock, Eye, AlertTriangle } from 'lucide-react';
import { Bill } from '../types';

interface BillsProps {
  onBack: () => void;
}

export default function Bills({ onBack }: BillsProps) {
  // State สำหรับการจัดการข้อมูลบิล
  const [bills, setBills] = useState<Bill[]>([]);
  
  // State สำหรับ UI และการโต้ตอบ
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'dine-in' | 'takeaway' | 'delivery'>('all');
  const [filterTable, setFilterTable] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [loading, setLoading] = useState(false);
  
  // State สำหรับ Alert Dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'paid' | 'refund' | 'void';
    billId: string;
    amount?: number;
  } | null>(null);

  // Load bills data จาก global state เมื่อ component mount
  useEffect(() => {
    loadBillsData();
    
    // Subscribe ถึงการเปลี่ยนแปลงของข้อมูลในโหมด CLOUD_SYNC
    if (window.App?.state?.settings?.mode === 'CLOUD_SYNC') {
      subscribeToCloudBills();
    }
    
    // Set up interval สำหรับ refresh data ทุก 30 วินาที
    const refreshInterval = setInterval(() => {
      if (window.App?.state?.settings?.mode === 'CLOUD_SYNC') {
        loadBillsData();
      }
    }, 30000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // ฟังก์ชันสำหรับโหลดข้อมูลบิลจาก global state
  const loadBillsData = async () => {
    try {
      setLoading(true);
      
      // โหลดข้อมูลจาก window.App.state.bills
      if (window.App?.state?.bills) {
        setBills([...window.App.state.bills]);
      } else {
        // สร้างข้อมูลตัวอย่างถ้าไม่มีข้อมูล
        const sampleBills: Bill[] = [
          {
            id: 'BILL001',
            orderId: 'ORD001',
            tableNo: 5,
            status: 'UNPAID',
            payments: [],
            createdAt: Date.now() - 3600000, // 1 ชั่วโมงที่แล้ว
            updatedAt: Date.now() - 3600000
          },
          {
            id: 'BILL002',
            orderId: 'ORD002',
            tableNo: 3,
            status: 'PAID',
            payments: [
              {
                method: 'CASH',
                amount: 185,
                paidAt: Date.now() - 1800000, // 30 นาทีที่แล้ว
                by: 'Cashier01'
              }
            ],
            createdAt: Date.now() - 7200000, // 2 ชั่วโมงที่แล้ว
            updatedAt: Date.now() - 1800000
          }
        ];
        
        setBills(sampleBills);
        
        // อัพเดทข้อมูลใน global state
        if (window.App?.state) {
          window.App.state.bills = sampleBills;
        }
      }
    } catch (error) {
      console.error('Error loading bills data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลบิล');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับ subscribe ข้อมูลจาก cloud ในโหมด CLOUD_SYNC
  const subscribeToCloudBills = () => {
    // TODO: Implement real-time subscription สำหรับ cloud sync
    console.log('Subscribing to cloud bills updates...');
    
    // Mock implementation สำหรับ demonstration
    if (window.App?.events) {
      window.App.events.on('billStatusChanged', (data: any) => {
        console.log('Received bill status change:', data);
        loadBillsData(); // Refresh data เมื่อมีการเปลี่ยนแปลง
      });
    }
  };

  // ฟังก์ชันสำหรับหาข้อมูล Order ที่เกี่ยวข้องกับบิล
  const getOrderData = (orderId: string) => {
    const orders = window.App?.state?.orders || [];
    return orders.find(order => order.id === orderId);
  };

  // Filter และ search ข้อมูลบิล
  const filteredBills = useMemo(() => {
    let filtered = bills;

    // Filter ตาม status (UNPAID/PAID)
    if (activeTab === 'unpaid') {
      filtered = filtered.filter(bill => bill.status === 'UNPAID');
    } else {
      filtered = filtered.filter(bill => ['PAID', 'VOID', 'REFUND'].includes(bill.status));
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bill => {
        const order = getOrderData(bill.orderId);
        return (
          bill.id.toLowerCase().includes(query) ||
          bill.orderId.toLowerCase().includes(query) ||
          (order?.queueNo && order.queueNo.toLowerCase().includes(query)) ||
          (bill.tableNo && bill.tableNo.toString().includes(query))
        );
      });
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(bill => {
        const order = getOrderData(bill.orderId);
        return order?.orderType === filterType;
      });
    }

    // Table filter
    if (filterTable !== 'all') {
      filtered = filtered.filter(bill => {
        if (filterTable === 'no-table') {
          return !bill.tableNo;
        }
        return bill.tableNo?.toString() === filterTable;
      });
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = Date.now();
      const timeRanges = {
        today: 24 * 60 * 60 * 1000, // 24 ชั่วโมง
        week: 7 * 24 * 60 * 60 * 1000, // 7 วัน
        month: 30 * 24 * 60 * 60 * 1000 // 30 วัน
      };
      
      const range = timeRanges[timeFilter];
      filtered = filtered.filter(bill => now - bill.createdAt <= range);
    }

    // เรียงลำดับตามเวลาที่สร้าง (ใหม่สุดก่อน)
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }, [bills, activeTab, searchQuery, filterType, filterTable, timeFilter]);

  // ฟังก์ชันสำหรับคำนวณยอดรวมของบิล
  const calculateBillAmount = (bill: Bill): number => {
    const order = getOrderData(bill.orderId);
    return order?.totals?.grand || 0;
  };

  // ฟังก์ชันสำหรับ format วันที่และเวลา
  const formatDateTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ฟังก์ชันสำหรับแสดงสถานะบิล
  const getBillStatusBadge = (status: string) => {
    const statusConfig = {
      UNPAID: { variant: 'destructive' as const, label: 'ค้างชำระ', icon: AlertTriangle },
      PAID: { variant: 'default' as const, label: 'ชำระแล้ว', icon: DollarSign },
      VOID: { variant: 'secondary' as const, label: 'ยกเลิก', icon: Trash2 },
      REFUND: { variant: 'outline' as const, label: 'คืนเงิน', icon: RefreshCw }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // ฟังก์ชันสำหรับจัดการ action ต่างๆ
  const handleAction = (type: 'paid' | 'refund' | 'void', billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    const amount = calculateBillAmount(bill);
    
    setConfirmAction({ type, billId, amount });
    setShowConfirmDialog(true);
  };

  // ฟังก์ชันสำหรับยืนยันและดำเนินการ action
  const confirmActionHandler = async () => {
    if (!confirmAction) return;

    try {
      setLoading(true);
      
      const { type, billId, amount } = confirmAction;
      const bill = bills.find(b => b.id === billId);
      
      if (!bill) {
        throw new Error('ไม่พบข้อมูลบิล');
      }

      // ป้องกัน state mismatch โดยตรวจสอบสถานะปัจจุบัน
      if (type === 'paid' && bill.status !== 'UNPAID') {
        toast.error('บิลนี้ถูกชำระแล้วหรือมีสถานะที่ไม่สามารถชำระได้');
        return;
      }

      // อัพเดทสถานะบิลตาม action ที่เลือก
      const updatedBill = { ...bill };
      const now = Date.now();
      
      switch (type) {
        case 'paid':
          updatedBill.status = 'PAID';
          updatedBill.payments = [
            ...updatedBill.payments,
            {
              method: 'CASH', // Default method, สามารถปรับให้เลือกได้
              amount: amount || 0,
              paidAt: now,
              by: 'CurrentUser' // TODO: ใช้ข้อมูลผู้ใช้จริง
            }
          ];
          break;
        
        case 'refund':
          updatedBill.status = 'REFUND';
          break;
        
        case 'void':
          updatedBill.status = 'VOID';
          break;
      }
      
      updatedBill.updatedAt = now;

      // อัพเดท state local
      setBills(prevBills => 
        prevBills.map(b => b.id === billId ? updatedBill : b)
      );

      // อัพเดท global state
      if (window.App?.state?.bills) {
        const billIndex = window.App.state.bills.findIndex(b => b.id === billId);
        if (billIndex !== -1) {
          window.App.state.bills[billIndex] = updatedBill;
        }
      }

      // ส่งข้อมูลไปยัง cloud ถ้าอยู่ในโหมด CLOUD_SYNC
      if (window.App?.state?.settings?.mode === 'CLOUD_SYNC') {
        // TODO: Implement cloud sync
        console.log('Syncing bill update to cloud:', updatedBill);
        
        // Mock cloud sync
        if (window.App.events) {
          window.App.events.emit('billStatusChanged', {
            billId: billId,
            newStatus: updatedBill.status,
            timestamp: now
          });
        }
      }

      // แสดงข้อความสำเร็จ
      const actionMessages = {
        paid: 'ชำระเงินสำเร็จ',
        refund: 'คืนเงินสำเร็จ',
        void: 'ยกเลิกบิลสำเร็จ'
      };
      
      toast.success(actionMessages[type]);

    } catch (error) {
      console.error('Error processing bill action:', error);
      toast.error('เกิดข้อผิดพลาดในการดำเนินการ');
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  // ฟังก์ชันสำหรับ debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Search จะทำงานหลังจาก user หยุดพิมพ์ 300ms
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // ฟังก์ชันสำหรับรีเซ็ตฟิลเตอร์
  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterTable('all');
    setTimeFilter('today');
  };

  // คำนวณสถิติสำหรับแสดงผล
  const stats = useMemo(() => {
    const unpaidBills = bills.filter(bill => bill.status === 'UNPAID');
    const paidBills = bills.filter(bill => bill.status === 'PAID');
    
    const unpaidAmount = unpaidBills.reduce((sum, bill) => sum + calculateBillAmount(bill), 0);
    const paidAmount = paidBills.reduce((sum, bill) => sum + calculateBillAmount(bill), 0);
    
    return {
      unpaidCount: unpaidBills.length,
      paidCount: paidBills.length,
      unpaidAmount,
      paidAmount
    };
  }, [bills]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header พร้อมปุ่มกลับและสถิติ */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Button
              onClick={onBack}
              variant="outline"
              className="bg-white/90 backdrop-blur"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับ
            </Button>
            <h1 className="text-2xl font-bold text-white">จัดการบิล</h1>
          </div>
          
          {/* แสดงสถิติ */}
          <div className="flex gap-4">
            <Card className="bg-white/90 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">ค้างชำระ</p>
                    <p className="font-bold">{stats.unpaidCount} บิล</p>
                    <p className="text-sm text-red-600">฿{stats.unpaidAmount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">ชำระแล้ว</p>
                    <p className="font-bold">{stats.paidCount} บิล</p>
                    <p className="text-sm text-green-600">฿{stats.paidAmount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ส่วนค้นหาและฟิลเตอร์ */}
        <Card className="bg-white/95 backdrop-blur mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              ค้นหาและฟิลเตอร์
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="filtersBar" className="space-y-4">
              {/* แถวแรก: ช่องค้นหา */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    id="searchBills"
                    placeholder="ค้นหาบิล (Bill ID, Order ID, Queue, Table No)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  รีเซ็ตฟิลเตอร์
                </Button>
              </div>

              {/* แถวที่สอง: ฟิลเตอร์ต่างๆ */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">ประเภทออเดอร์</label>
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="dine-in">ทานที่ร้าน</SelectItem>
                      <SelectItem value="takeaway">ใส่กล่อง</SelectItem>
                      <SelectItem value="delivery">เดลิเวอรี่</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">โต๊ะ</label>
                  <Select value={filterTable} onValueChange={setFilterTable}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกโต๊ะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="no-table">ไม่มีโต๊ะ</SelectItem>
                      {/* สร้างรายการโต๊ะจาก 1-20 */}
                      {Array.from({ length: 20 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          โต๊ะ {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">ช่วงเวลา</label>
                  <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกช่วงเวลา" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">วันนี้</SelectItem>
                      <SelectItem value="week">สัปดาห์นี้</SelectItem>
                      <SelectItem value="month">เดือนนี้</SelectItem>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={loadBillsData}
                    className="w-full gap-2"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    รีเฟรช
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ตารางบิล */}
        <Card className="bg-white/95 backdrop-blur">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
              {/* แท็บ UNPAID/PAID */}
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger id="tabUnpaid" value="unpaid" className="flex-1 gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  ค้างชำระ ({stats.unpaidCount})
                </TabsTrigger>
                <TabsTrigger id="tabPaid" value="paid" className="flex-1 gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  ชำระแล้ว ({stats.paidCount})
                </TabsTrigger>
              </TabsList>

              {/* เนื้อหาแท็บ Unpaid */}
              <TabsContent value="unpaid" className="m-0">
                <div className="bills-table">
                  <Table id="billsTable">
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead>Bill ID</TableHead>
                        <TableHead>Order ID / Queue</TableHead>
                        <TableHead>ประเภท / โต๊ะ</TableHead>
                        <TableHead className="text-right">จำนวนเงิน</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>เวลาสร้าง</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBills.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลบิล'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBills.map((bill) => {
                          const order = getOrderData(bill.orderId);
                          const amount = calculateBillAmount(bill);
                          const isOverdue = bill.status === 'UNPAID' && (Date.now() - bill.createdAt) > 3600000; // เกิน 1 ชั่วโมง
                          
                          return (
                            <TableRow 
                              key={bill.id} 
                              className={`${isOverdue ? 'bg-red-50 border-l-4 border-l-red-500' : ''} hover:bg-gray-50`}
                            >
                              <TableCell className="font-medium">
                                {bill.id}
                                {isOverdue && (
                                  <Badge variant="destructive" className="ml-2 text-xs">
                                    เกินเวลา
                                  </Badge>
                                )}
                              </TableCell>
                              
                              <TableCell>
                                <div>
                                  <div className="font-medium">{bill.orderId}</div>
                                  {order?.queueNo && (
                                    <div className="text-sm text-gray-500">Queue: {order.queueNo}</div>
                                  )}
                                </div>
                              </TableCell>
                              
                              <TableCell>
                                <div>
                                  <div className="capitalize">{order?.orderType || 'N/A'}</div>
                                  {bill.tableNo && (
                                    <div className="text-sm text-gray-500">โต๊ะ {bill.tableNo}</div>
                                  )}
                                </div>
                              </TableCell>
                              
                              <TableCell className="text-right font-bold">
                                ฿{amount.toFixed(2)}
                              </TableCell>
                              
                              <TableCell>
                                {getBillStatusBadge(bill.status)}
                              </TableCell>
                              
                              <TableCell>
                                <div className="text-sm">
                                  <div>{formatDateTime(bill.createdAt)}</div>
                                  {bill.status === 'UNPAID' && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {Math.round((Date.now() - bill.createdAt) / 60000)} นาทีที่แล้ว
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              
                              <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
                                  {bill.status === 'UNPAID' && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="gap-1"
                                        onClick={() => handleAction('paid', bill.id)}
                                      >
                                        <DollarSign className="w-3 h-3" />
                                        ชำระ
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="gap-1"
                                        onClick={() => handleAction('void', bill.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        ยกเลิก
                                      </Button>
                                    </>
                                  )}
                                  
                                  {bill.status === 'PAID' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1"
                                      onClick={() => handleAction('refund', bill.id)}
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      คืนเงิน
                                    </Button>
                                  )}
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => {
                                      // TODO: Implement view bill details
                                      toast.info('ฟีเจอร์ดูรายละเอียดจะมาในเร็วๆ นี้');
                                    }}
                                  >
                                    <Eye className="w-3 h-3" />
                                    ดู
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* เนื้อหาแท็บ Paid - ใช้ตารางเดียวกัน */}
              <TabsContent value="paid" className="m-0">
                <div className="bills-table">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead>Bill ID</TableHead>
                        <TableHead>Order ID / Queue</TableHead>
                        <TableHead>ประเภท / โต๊ะ</TableHead>
                        <TableHead className="text-right">จำนวนเงิน</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>เวลาชำระ</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBills.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลบิล'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBills.map((bill) => {
                          const order = getOrderData(bill.orderId);
                          const amount = calculateBillAmount(bill);
                          const lastPayment = bill.payments[bill.payments.length - 1];
                          
                          return (
                            <TableRow key={bill.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{bill.id}</TableCell>
                              
                              <TableCell>
                                <div>
                                  <div className="font-medium">{bill.orderId}</div>
                                  {order?.queueNo && (
                                    <div className="text-sm text-gray-500">Queue: {order.queueNo}</div>
                                  )}
                                </div>
                              </TableCell>
                              
                              <TableCell>
                                <div>
                                  <div className="capitalize">{order?.orderType || 'N/A'}</div>
                                  {bill.tableNo && (
                                    <div className="text-sm text-gray-500">โต๊ะ {bill.tableNo}</div>
                                  )}
                                </div>
                              </TableCell>
                              
                              <TableCell className="text-right font-bold">
                                ฿{amount.toFixed(2)}
                              </TableCell>
                              
                              <TableCell>
                                {getBillStatusBadge(bill.status)}
                              </TableCell>
                              
                              <TableCell>
                                <div className="text-sm">
                                  {lastPayment ? (
                                    <>
                                      <div>{formatDateTime(lastPayment.paidAt)}</div>
                                      <div className="text-xs text-gray-500">{lastPayment.method}</div>
                                    </>
                                  ) : (
                                    <div>{formatDateTime(bill.updatedAt)}</div>
                                  )}
                                </div>
                              </TableCell>
                              
                              <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
                                  {bill.status === 'PAID' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1"
                                      onClick={() => handleAction('refund', bill.id)}
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      คืนเงิน
                                    </Button>
                                  )}
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => {
                                      // TODO: Implement view bill details
                                      toast.info('ฟีเจอร์ดูรายละเอียดจะมาในเร็วๆ นี้');
                                    }}
                                  >
                                    <Eye className="w-3 h-3" />
                                    ดู
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Alert Dialog สำหรับยืนยันการดำเนินการ */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ยืนยันการดำเนินการ
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction && (
                <>
                  คุณต้องการ
                  {confirmAction.type === 'paid' && ' ชำระเงิน '}
                  {confirmAction.type === 'refund' && ' คืนเงิน '}
                  {confirmAction.type === 'void' && ' ยกเลิก '}
                  บิล {confirmAction.billId} 
                  {confirmAction.amount && ` จำนวน ฿${confirmAction.amount.toFixed(2)}`}
                  หรือไม่?
                  <br /><br />
                  <span className="text-yellow-600">
                    ⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmActionHandler}
              disabled={loading}
              className={confirmAction?.type === 'void' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {loading ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}