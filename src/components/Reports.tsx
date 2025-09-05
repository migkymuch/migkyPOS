import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Package, 
  Layers, 
  Users, 
  CreditCard, 
  Receipt,
  Calendar,
  Download,
  Filter,
  Search,
  ChevronRight
} from 'lucide-react';
import SalesSummary from './reports/SalesSummary';

interface ReportsProps {
  onBack: () => void;
}

// Define report sections for sidebar navigation
const reportSections = [
  {
    id: 'sales-summary',
    title: 'สรุปยอดขาย',
    icon: BarChart3,
    description: 'ภาพรวมยอดขายและกำไร'
  },
  {
    id: 'sales-by-item',
    title: 'ยอดขายตามสินค้า',
    icon: Package,
    description: 'วิเคราะห์ยอดขายแต่ละสินค้า'
  },
  {
    id: 'sales-by-category',
    title: 'ยอดขายตามหมวดหมู่',
    icon: Layers,
    description: 'ยอดขายแยกตามประเภทสินค้า'
  },
  {
    id: 'sales-by-staff',
    title: 'ยอดขายตามพนักงาน',
    icon: Users,
    description: 'ประสิทธิภาพการขายของพนักงาน'
  },
  {
    id: 'sales-by-payment',
    title: 'ยอดขายตามประเภทชำระเงิน',
    icon: CreditCard,
    description: 'วิเคราะห์ช่องทางการชำระเงิน'
  },
  {
    id: 'receipts',
    title: 'ใบเสร็จชำระเงิน',
    icon: Receipt,
    description: 'รายการใบเสร็จทั้งหมด'
  }
];

export default function Reports({ onBack }: ReportsProps) {
  // State สำหรับการนำทางและข้อมูล
  const [activeSection, setActiveSection] = useState('sales-summary');
  const [dateRange, setDateRange] = useState('today');
  const [granularity, setGranularity] = useState('hour');
  const [loading, setLoading] = useState(false);

  // State สำหรับข้อมูลรายงาน
  const [reportData, setReportData] = useState<any>({
    sales: [],
    orders: [],
    bills: [],
    staff: [],
    categories: [],
    paymentMethods: []
  });

  // Load และคำนวณข้อมูลรายงานเมื่อ component mount หรือ filter เปลี่ยน
  useEffect(() => {
    loadReportData();
  }, [dateRange, granularity]);

  // ฟังก์ชันสำหรับโหลดข้อมูลจาก global state
  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // ดึงข้อมูลจาก window.App.state
      const appState = window.App?.state;
      if (!appState) {
        toast.error('ไม่พบข้อมูลระบบ');
        return;
      }

      const { orders = [], bills = [], menus = [] } = appState;
      
      // กรองข้อมูลตามช่วงเวลาที่เลือก
      const filteredData = filterDataByDateRange(orders, bills, dateRange);
      
      // คำนวณข้อมูลสำหรับรายงานต่างๆ
      const processedData = {
        sales: calculateSalesData(filteredData.orders, filteredData.bills),
        orders: filteredData.orders,
        bills: filteredData.bills,
        staff: calculateStaffData(filteredData.orders, filteredData.bills),
        categories: calculateCategoryData(filteredData.orders, menus),
        paymentMethods: calculatePaymentMethodData(filteredData.bills)
      };

      setReportData(processedData);
      
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลรายงาน');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับกรองข้อมูลตามช่วงเวลา
  const filterDataByDateRange = (orders: any[], bills: any[], range: string) => {
    const now = Date.now();
    let startTime = 0;

    switch (range) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startTime = today.getTime();
        break;
      case 'yesterday':
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        startTime = yesterday.getTime();
        break;
      case 'week':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        startTime = monthStart.getTime();
        break;
      default:
        startTime = 0;
    }

    return {
      orders: orders.filter(order => order.createdAt >= startTime),
      bills: bills.filter(bill => bill.createdAt >= startTime)
    };
  };

  // ฟังก์ชันสำหรับคำนวณข้อมูลยอดขาย
  const calculateSalesData = (orders: any[], bills: any[]) => {
    const paidBills = bills.filter(bill => bill.status === 'PAID');
    const refundBills = bills.filter(bill => bill.status === 'REFUND');
    
    const totalSales = paidBills.reduce((sum, bill) => {
      const order = orders.find(o => o.id === bill.orderId);
      return sum + (order?.totals?.grand || 0);
    }, 0);

    const totalRefunds = refundBills.reduce((sum, bill) => {
      const order = orders.find(o => o.id === bill.orderId);
      return sum + (order?.totals?.grand || 0);
    }, 0);

    const totalDiscount = orders.reduce((sum, order) => {
      return sum + (order.totals?.discount || 0);
    }, 0);

    const netSales = totalSales - totalRefunds;
    const totalTransactions = paidBills.length;

    return {
      totalSales,
      totalRefunds,
      totalDiscount,
      netSales,
      totalTransactions,
      averageOrderValue: totalTransactions > 0 ? netSales / totalTransactions : 0
    };
  };

  // ฟังก์ชันสำหรับคำนวณข้อมูลพนักงาน
  const calculateStaffData = (orders: any[], bills: any[]) => {
    const staffMap = new Map();
    
    orders.forEach(order => {
      const staff = order.updatedBy || 'ไม่ระบุ';
      if (!staffMap.has(staff)) {
        staffMap.set(staff, {
          name: staff,
          totalSales: 0,
          totalOrders: 0,
          totalRefunds: 0
        });
      }
      
      const bill = bills.find(b => b.orderId === order.id && b.status === 'PAID');
      if (bill) {
        const staffData = staffMap.get(staff);
        staffData.totalSales += order.totals?.grand || 0;
        staffData.totalOrders += 1;
      }
    });

    return Array.from(staffMap.values());
  };

  // ฟังก์ชันสำหรับคำนวณข้อมูลหมวดหมู่
  const calculateCategoryData = (orders: any[], menus: any[]) => {
    const categoryMap = new Map();
    
    orders.forEach(order => {
      order.items?.forEach((item: any) => {
        // หาหมวดหมู่จากเมนู
        const menuItem = menus.find(m => m.sku === item.sku);
        const category = menuItem?.category || 'ไม่ระบุ';
        
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            name: category,
            totalSales: 0,
            totalQuantity: 0,
            totalItems: 0
          });
        }
        
        const categoryData = categoryMap.get(category);
        categoryData.totalSales += item.price * item.quantity;
        categoryData.totalQuantity += item.quantity;
        categoryData.totalItems += 1;
      });
    });

    return Array.from(categoryMap.values());
  };

  // ฟังก์ชันสำหรับคำนวณข้อมูลประเภทการชำระเงิน
  const calculatePaymentMethodData = (bills: any[]) => {
    const paymentMap = new Map();
    
    bills.forEach(bill => {
      if (bill.status === 'PAID' && bill.payments) {
        bill.payments.forEach((payment: any) => {
          const method = payment.method || 'ไม่ระบุ';
          if (!paymentMap.has(method)) {
            paymentMap.set(method, {
              method: method,
              totalAmount: 0,
              totalTransactions: 0
            });
          }
          
          const paymentData = paymentMap.get(method);
          paymentData.totalAmount += payment.amount;
          paymentData.totalTransactions += 1;
        });
      }
    });

    return Array.from(paymentMap.values());
  };

  // ฟังก์ชันสำหรับ export ข้อมูล
  const exportData = (format: 'csv' | 'pdf') => {
    // TODO: Implement export functionality
    toast.info(`กำลังเตรียม export ${format.toUpperCase()}...`);
  };

  // ฟังก์ชันสำหรับ render เนื้อหาตาม section ที่เลือก
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'sales-summary':
        return (
          <SalesSummary 
            data={reportData} 
            loading={loading} 
            dateRange={dateRange}
            granularity={granularity}
          />
        );
      case 'sales-by-item':
        return <SalesByItemSection data={reportData} loading={loading} />;
      case 'sales-by-category':
        return <SalesByCategorySection data={reportData} loading={loading} />;
      case 'sales-by-staff':
        return <SalesByStaffSection data={reportData} loading={loading} />;
      case 'sales-by-payment':
        return <SalesByPaymentSection data={reportData} loading={loading} />;
      case 'receipts':
        return <ReceiptsSection data={reportData} loading={loading} />;
      default:
        return <div>เลือกรายงานจากเมนูด้านซ้าย</div>;
    }
  };

  const activeReportSection = reportSections.find(section => section.id === activeSection);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </Button>
          </div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#761F1C]" />
            รายงานโดยละเอียด
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            วิเคราะห์ข้อมูลการขายและประสิทธิภาพ
          </p>
        </div>

        {/* Navigation Menu */}
        <div className="p-4 space-y-2">
          {reportSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full p-3 rounded-lg text-left transition-all group ${
                  isActive
                    ? 'bg-[#761F1C] text-white shadow-lg'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <div className="flex-1">
                    <div className={`font-medium ${isActive ? 'text-white' : 'text-gray-900'}`}>
                      {section.title}
                    </div>
                    <div className={`text-xs ${isActive ? 'text-gray-200' : 'text-gray-500'}`}>
                      {section.description}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Filters */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Page Title */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {activeReportSection?.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {activeReportSection?.description}
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#761F1C] focus:border-transparent"
                >
                  <option value="today">วันนี้</option>
                  <option value="yesterday">เมื่อวาน</option>
                  <option value="week">7 วันที่ผ่านมา</option>
                  <option value="month">เดือนนี้</option>
                </select>
              </div>

              {/* Granularity Filter */}
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                {[
                  { value: 'hour', label: 'ชั่วโมง' },
                  { value: 'day', label: 'วัน' },
                  { value: 'week', label: 'สัปดาห์' },
                  { value: 'month', label: 'เดือน' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setGranularity(option.value)}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      granularity === option.value
                        ? 'bg-[#761F1C] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Export Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => exportData('csv')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </Button>
                <Button
                  onClick={() => exportData('pdf')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
}

import SalesSummary from './reports/SalesSummary';

// Placeholder components สำหรับหน้าอื่นๆ (จะถูกแทนที่ด้วย component จริงในอนาคต)
const SalesByItemSection = ({ data, loading }: { data: any; loading: boolean }) => (
  <Card>
    <CardHeader>
      <CardTitle>ยอดขายตามสินค้า</CardTitle>
      <CardDescription>วิเคราะห์ยอดขายของแต่ละสินค้า</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-96 bg-gray-100 rounded flex items-center justify-center">
        <p className="text-gray-500">กำลังพัฒนา - จะมีกราฟ Donut และตารางสินค้า</p>
      </div>
    </CardContent>
  </Card>
);

const SalesByCategorySection = ({ data, loading }: { data: any; loading: boolean }) => (
  <Card>
    <CardHeader>
      <CardTitle>ยอดขายตามหมวดหมู่</CardTitle>
      <CardDescription>วิเคราะห์ยอดขายแยกตามประเภทสินค้า</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-96 bg-gray-100 rounded flex items-center justify-center">
        <p className="text-gray-500">กำลังพัฒนา - จะมีกราฟ Stacked Bar และตารางหมวดหมู่</p>
      </div>
    </CardContent>
  </Card>
);

const SalesByStaffSection = ({ data, loading }: { data: any; loading: boolean }) => (
  <Card>
    <CardHeader>
      <CardTitle>ยอดขายตามพนักงาน</CardTitle>
      <CardDescription>ประสิทธิภาพการขายของพนักงาน</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-96 bg-gray-100 rounded flex items-center justify-center">
        <p className="text-gray-500">กำลังพัฒนา - จะมีกราฟ Horizontal Bar และตารางพนักงาน</p>
      </div>
    </CardContent>
  </Card>
);

const SalesByPaymentSection = ({ data, loading }: { data: any; loading: boolean }) => (
  <Card>
    <CardHeader>
      <CardTitle>ยอดขายตามประเภทชำระเงิน</CardTitle>
      <CardDescription>วิเคราะห์ช่องทางการชำระเงิน</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-96 bg-gray-100 rounded flex items-center justify-center">
        <p className="text-gray-500">กำลังพัฒนา - จะมีกราฟ Donut และตารางช่องทางชำระเงิน</p>
      </div>
    </CardContent>
  </Card>
);

const ReceiptsSection = ({ data, loading }: { data: any; loading: boolean }) => (
  <Card>
    <CardHeader>
      <CardTitle>ใบเสร็จชำระเงิน</CardTitle>
      <CardDescription>รายการใบเสร็จทั้งหมด</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-96 bg-gray-100 rounded flex items-center justify-center">
        <p className="text-gray-500">กำลังพัฒนา - จะมีตารางใบเสร็จพร้อมค้นหาและกรอง</p>
      </div>
    </CardContent>
  </Card>
);