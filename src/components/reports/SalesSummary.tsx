import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, Minus, BarChart3, LineChartIcon, Search, Settings } from 'lucide-react';

interface SalesSummaryProps {
  data: any;
  loading: boolean;
  dateRange: string;
  granularity: string;
}

export default function SalesSummary({ data, loading, dateRange, granularity }: SalesSummaryProps) {
  const [chartType, setChartType] = React.useState<'bar' | 'line'>('bar');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showColumns, setShowColumns] = React.useState({
    time: true,
    sales: true,
    refunds: true,
    discount: true,
    netSales: true,
    cost: true,
    profit: true,
    difference: true,
    tax: true
  });

  // คำนวณ KPI ข้อมูล
  const kpiData = useMemo(() => {
    const salesData = data.sales || {};
    const bills = data.bills || [];
    const orders = data.orders || [];

    // คำนวณการเปลี่ยนแปลงเปอร์เซ็นต์ (mock data สำหรับ demo)
    const changes = {
      sales: Math.random() * 10 - 5, // -5% to +5%
      refunds: Math.random() * 5 - 2.5, // -2.5% to +2.5%
      discount: Math.random() * 6 - 3, // -3% to +3%
      netSales: Math.random() * 8 - 4, // -4% to +4%
      profit: Math.random() * 12 - 6, // -6% to +6%
      transactions: Math.floor(Math.random() * 20) - 10 // -10 to +10 transactions
    };

    return {
      totalSales: salesData.totalSales || 0,
      totalRefunds: salesData.totalRefunds || 0,
      totalDiscount: salesData.totalDiscount || 0,
      netSales: salesData.netSales || 0,
      estimatedProfit: (salesData.netSales || 0) * 0.35, // 35% profit margin
      totalTransactions: salesData.totalTransactions || 0,
      changes
    };
  }, [data]);

  // สร้างข้อมูลกราฟตามช่วงเวลา
  const chartData = useMemo(() => {
    if (loading || !data.orders) return [];

    const timeSlots = [];
    const now = new Date();
    
    // สร้าง time slots ตาม granularity
    if (granularity === 'hour') {
      // 24 ชั่วโมงของวันนี้
      for (let i = 0; i < 24; i++) {
        const hour = new Date(now);
        hour.setHours(i, 0, 0, 0);
        timeSlots.push({
          time: `${i.toString().padStart(2, '0')}:00`,
          timestamp: hour.getTime(),
          sales: Math.random() * 5000,
          refunds: Math.random() * 200,
          discount: Math.random() * 300,
          netSales: 0
        });
      }
    } else if (granularity === 'day') {
      // 7 วันที่ผ่านมา
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        timeSlots.push({
          time: day.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' }),
          timestamp: day.getTime(),
          sales: Math.random() * 15000,
          refunds: Math.random() * 800,
          discount: Math.random() * 1200,
          netSales: 0
        });
      }
    }

    // คำนวณ netSales
    return timeSlots.map(slot => ({
      ...slot,
      netSales: slot.sales - slot.refunds - slot.discount
    }));
  }, [granularity, loading, data]);

  // สร้างข้อมูลตาราง
  const tableData = useMemo(() => {
    return chartData.map((item, index) => ({
      time: item.time,
      sales: item.sales,
      refunds: item.refunds,
      discount: item.discount,
      netSales: item.netSales,
      cost: item.netSales * 0.65, // 65% cost of goods
      profit: item.netSales * 0.35, // 35% profit
      difference: index > 0 ? ((item.netSales - chartData[index - 1].netSales) / chartData[index - 1].netSales) * 100 : 0,
      tax: item.netSales * 0.07 // 7% VAT
    }));
  }, [chartData]);

  // Filter ตารางตาม search
  const filteredTableData = useMemo(() => {
    if (!searchQuery.trim()) return tableData;
    
    return tableData.filter(row =>
      row.time.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tableData, searchQuery]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Get trend icon
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  // Get trend color class
  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600 bg-green-100';
    if (value < 0) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* ยอดขาย */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              ยอดขาย
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : formatCurrency(kpiData.totalSales)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(kpiData.changes.sales)}
              <Badge variant="secondary" className={getTrendColor(kpiData.changes.sales)}>
                {formatPercentage(kpiData.changes.sales)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* คืนเงิน */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              คืนเงิน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? '...' : formatCurrency(kpiData.totalRefunds)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(kpiData.changes.refunds)}
              <Badge variant="secondary" className={getTrendColor(kpiData.changes.refunds)}>
                {formatPercentage(kpiData.changes.refunds)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* ส่วนลด */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">ส่วนลด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : formatCurrency(kpiData.totalDiscount)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(kpiData.changes.discount)}
              <Badge variant="secondary" className={getTrendColor(kpiData.changes.discount)}>
                {formatPercentage(kpiData.changes.discount)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* ยอดขายสุทธิ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">ยอดขายสุทธิ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {loading ? '...' : formatCurrency(kpiData.netSales)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(kpiData.changes.netSales)}
              <Badge variant="secondary" className={getTrendColor(kpiData.changes.netSales)}>
                {formatPercentage(kpiData.changes.netSales)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* กำไรรวม */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">กำไรรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {loading ? '...' : formatCurrency(kpiData.estimatedProfit)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(kpiData.changes.profit)}
              <Badge variant="secondary" className={getTrendColor(kpiData.changes.profit)}>
                {formatPercentage(kpiData.changes.profit)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* ใบเสร็จรวม */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">ใบเสร็จรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : kpiData.totalTransactions.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(kpiData.changes.transactions)}
              <Badge variant="secondary" className={getTrendColor(kpiData.changes.transactions)}>
                {kpiData.changes.transactions >= 0 ? '+' : ''}{kpiData.changes.transactions} บิล
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>แนวโน้มยอดขายตามเวลา</CardTitle>
              <CardDescription>
                กราฟแสดงยอดขาย คืนเงิน ส่วนลด และยอดสุทธิตาม{granularity === 'hour' ? 'ชั่วโมง' : 'วัน'}
              </CardDescription>
            </div>
            
            {/* Chart Type Toggle */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  chartType === 'bar'
                    ? 'bg-[#761F1C] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                แท่งกราฟ
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  chartType === 'line'
                    ? 'bg-[#761F1C] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <LineChartIcon className="w-4 h-4" />
                เส้นกราฟ
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="time" 
                      className="text-xs" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'sales' ? 'ยอดขาย' :
                        name === 'refunds' ? 'คืนเงิน' :
                        name === 'discount' ? 'ส่วนลด' :
                        name === 'netSales' ? 'ยอดสุทธิ' : name
                      ]}
                    />
                    <Bar dataKey="sales" fill="#22c55e" name="sales" />
                    <Bar dataKey="refunds" fill="#ef4444" name="refunds" />
                    <Bar dataKey="discount" fill="#3b82f6" name="discount" />
                    <Bar dataKey="netSales" fill="#8b5cf6" name="netSales" />
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="time" 
                      className="text-xs"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'sales' ? 'ยอดขาย' :
                        name === 'refunds' ? 'คืนเงิน' :
                        name === 'discount' ? 'ส่วนลด' :
                        name === 'netSales' ? 'ยอดสุทธิ' : name
                      ]}
                    />
                    <Line type="monotone" dataKey="sales" stroke="#22c55e" strokeWidth={2} name="sales" />
                    <Line type="monotone" dataKey="refunds" stroke="#ef4444" strokeWidth={2} name="refunds" />
                    <Line type="monotone" dataKey="discount" stroke="#3b82f6" strokeWidth={2} name="discount" />
                    <Line type="monotone" dataKey="netSales" stroke="#8b5cf6" strokeWidth={2} name="netSales" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>สรุปต่อช่วงเวลา</CardTitle>
              <CardDescription>
                รายละเอียดยอดขายและกำไรแยกตามช่วงเวลา
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="ค้นหาเวลา..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>
              
              {/* Column Settings */}
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                เลือกคอลัมน์
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {showColumns.time && <TableHead>เวลา</TableHead>}
                  {showColumns.sales && <TableHead className="text-right">ยอดขาย</TableHead>}
                  {showColumns.refunds && <TableHead className="text-right">คืนเงิน</TableHead>}
                  {showColumns.discount && <TableHead className="text-right">ส่วนลด</TableHead>}
                  {showColumns.netSales && <TableHead className="text-right">ยอดขายสุทธิ</TableHead>}
                  {showColumns.cost && <TableHead className="text-right">ต้นทุนของสินค้า</TableHead>}
                  {showColumns.profit && <TableHead className="text-right">กำไรรวม</TableHead>}
                  {showColumns.difference && <TableHead className="text-right">ผลต่าง%</TableHead>}
                  {showColumns.tax && <TableHead className="text-right">ภาษี</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      กำลังโหลดข้อมูล...
                    </TableCell>
                  </TableRow>
                ) : filteredTableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      ไม่พบข้อมูลในช่วงเวลาที่เลือก
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTableData.map((row, index) => (
                    <TableRow 
                      key={index}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        // TODO: Show detailed breakdown for this time slot
                        console.log('Clicked row:', row);
                      }}
                    >
                      {showColumns.time && (
                        <TableCell className="font-medium">{row.time}</TableCell>
                      )}
                      {showColumns.sales && (
                        <TableCell className="text-right">{formatCurrency(row.sales)}</TableCell>
                      )}
                      {showColumns.refunds && (
                        <TableCell className="text-right text-red-600">{formatCurrency(row.refunds)}</TableCell>
                      )}
                      {showColumns.discount && (
                        <TableCell className="text-right text-blue-600">{formatCurrency(row.discount)}</TableCell>
                      )}
                      {showColumns.netSales && (
                        <TableCell className="text-right font-semibold">{formatCurrency(row.netSales)}</TableCell>
                      )}
                      {showColumns.cost && (
                        <TableCell className="text-right text-gray-600">{formatCurrency(row.cost)}</TableCell>
                      )}
                      {showColumns.profit && (
                        <TableCell className="text-right text-green-600 font-semibold">{formatCurrency(row.profit)}</TableCell>
                      )}
                      {showColumns.difference && (
                        <TableCell className="text-right">
                          <span className={row.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatPercentage(row.difference)}
                          </span>
                        </TableCell>
                      )}
                      {showColumns.tax && (
                        <TableCell className="text-right text-gray-600">{formatCurrency(row.tax)}</TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Table Footer with Totals */}
          {!loading && filteredTableData.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">รวมยอดขาย:</span>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(filteredTableData.reduce((sum, row) => sum + row.sales, 0))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">รวมคืนเงิน:</span>
                  <div className="font-semibold text-red-600">
                    {formatCurrency(filteredTableData.reduce((sum, row) => sum + row.refunds, 0))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">รวมยอดสุทธิ:</span>
                  <div className="font-semibold text-purple-600">
                    {formatCurrency(filteredTableData.reduce((sum, row) => sum + row.netSales, 0))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">รวมกำไร:</span>
                  <div className="font-semibold text-orange-600">
                    {formatCurrency(filteredTableData.reduce((sum, row) => sum + row.profit, 0))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}