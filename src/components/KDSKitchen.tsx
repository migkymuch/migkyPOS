import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Clock, Play, CheckCircle, X } from 'lucide-react';

interface KDSKitchenProps {
  onBack: () => void;
}

interface Ticket {
  id: string;
  orderId: string;
  station: 'kitchen' | 'tea';
  status: 'NEW' | 'IN_PROGRESS' | 'READY' | 'CLOSED';
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
  }>;
  startedAt?: number;
  readyAt?: number;
  slaMin: number;
  createdAt: number;
  queueNo?: string;
}

export default function KDSKitchen({ onBack }: KDSKitchenProps) {
  // State for tickets and active tab
  const [activeTab, setActiveTab] = useState('NEW');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for timer display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load tickets from global state and filter for kitchen station
  useEffect(() => {
    const loadTickets = () => {
      if (window.App?.state?.tickets) {
        const kitchenTickets = window.App.state.tickets
          .filter(ticket => ticket.station === 'kitchen')
          .map(ticket => {
            // Add queue number from related order
            const order = window.App.state.orders.find(o => o.id === ticket.orderId);
            return {
              ...ticket,
              queueNo: order?.queueNo || 'N/A'
            };
          });
        setTickets(kitchenTickets);
      }
    };

    loadTickets();

    // Listen for real-time updates
    if (window.App?.events) {
      window.App.events.on('ticketUpdate', loadTickets);
    }

    return () => {
      if (window.App?.events) {
        // TODO: Implement proper event cleanup
      }
    };
  }, []);

  // Play notification sound for new tickets
  useEffect(() => {
    const newTickets = tickets.filter(t => t.status === 'NEW');
    if (newTickets.length > 0) {
      // TODO: Implement beep sound
      console.log('🔊 New ticket notification');
    }
  }, [tickets]);

  // Calculate elapsed time for ticket
  const getElapsedTime = (ticket: Ticket): number => {
    const startTime = ticket.startedAt || ticket.createdAt;
    return Math.floor((currentTime - startTime) / 1000 / 60); // minutes
  };

  // Get SLA status color
  const getSLAColor = (ticket: Ticket): string => {
    const elapsed = getElapsedTime(ticket);
    if (elapsed >= ticket.slaMin) return 'bg-red-500'; // SLA breached
    if (elapsed >= ticket.slaMin * 0.8) return 'bg-yellow-500'; // Warning
    return 'bg-green-500'; // On time
  };

  // Update ticket status
  const updateTicketStatus = (ticketId: string, newStatus: Ticket['status']) => {
    const now = Date.now();
    
    setTickets(prevTickets => {
      const updatedTickets = prevTickets.map(ticket => {
        if (ticket.id === ticketId) {
          const updatedTicket = { ...ticket, status: newStatus };
          
          // Set timestamps based on status
          if (newStatus === 'IN_PROGRESS' && !ticket.startedAt) {
            updatedTicket.startedAt = now;
          } else if (newStatus === 'READY' && !ticket.readyAt) {
            updatedTicket.readyAt = now;
          }
          
          return updatedTicket;
        }
        return ticket;
      });
      
      // Update global state
      if (window.App?.state?.tickets) {
        const globalTicketIndex = window.App.state.tickets.findIndex(t => t.id === ticketId);
        if (globalTicketIndex !== -1) {
          const updatedTicket = updatedTickets.find(t => t.id === ticketId);
          if (updatedTicket) {
            window.App.state.tickets[globalTicketIndex] = updatedTicket;
          }
        }
      }
      
      return updatedTickets;
    });

    // TODO: Sync to cloud if enabled
    if (window.App?.state.settings.mode === 'CLOUD_SYNC') {
      console.log('TODO: Sync ticket update to Firestore:', { ticketId, newStatus });
    }
  };

  // Start working on ticket
  const startTicket = (ticketId: string) => {
    updateTicketStatus(ticketId, 'IN_PROGRESS');
  };

  // Mark ticket as ready
  const markReady = (ticketId: string) => {
    updateTicketStatus(ticketId, 'READY');
  };

  // Close ticket (served)
  const closeTicket = (ticketId: string) => {
    updateTicketStatus(ticketId, 'CLOSED');
  };

  // Filter tickets by status
  const getTicketsByStatus = (status: Ticket['status']) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  // Render ticket card
  const renderTicketCard = (ticket: Ticket) => (
    <Card 
      key={ticket.id}
      data-ticket-id={ticket.id}
      className={`ticketCard relative ${getSLAColor(ticket)} border-l-4`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">คิว {ticket.queueNo}</CardTitle>
          <div className="flex items-center space-x-2">
            {/* Timer badge */}
            <Badge 
              variant="secondary"
              className={`${
                getElapsedTime(ticket) >= ticket.slaMin ? 'bg-red-100 text-red-800' : 
                getElapsedTime(ticket) >= ticket.slaMin * 0.8 ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {getElapsedTime(ticket)}min
            </Badge>
            
            {/* Status badge */}
            <Badge 
              variant={
                ticket.status === 'NEW' ? 'destructive' :
                ticket.status === 'IN_PROGRESS' ? 'default' :
                ticket.status === 'READY' ? 'secondary' : 'outline'
              }
            >
              {ticket.status === 'NEW' ? 'ใหม่' :
               ticket.status === 'IN_PROGRESS' ? 'กำลังทำ' :
               ticket.status === 'READY' ? 'พร้อม' : 'เสร็จแล้ว'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Items list */}
        <div className="space-y-2 mb-4">
          {ticket.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="font-medium">{item.name}</span>
              <Badge variant="outline" className="text-xs">
                x{item.quantity}
              </Badge>
            </div>
          ))}
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-2">
          {ticket.status === 'NEW' && (
            <Button
              className="btnStart flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => startTicket(ticket.id)}
            >
              <Play className="w-4 h-4 mr-2" />
              เริ่มทำ
            </Button>
          )}
          
          {ticket.status === 'IN_PROGRESS' && (
            <Button
              className="btnReady flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => markReady(ticket.id)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              พร้อมเสิร์ฟ
            </Button>
          )}
          
          {ticket.status === 'READY' && (
            <Button
              className="btnClose flex-1 bg-gray-600 hover:bg-gray-700"
              onClick={() => closeTicket(ticket.id)}
            >
              <X className="w-4 h-4 mr-2" />
              เสร็จแล้ว
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-orange-50">
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
              <h1 className="text-2xl font-bold text-orange-900">KDS - สถานีครัว</h1>
              <p className="text-sm text-orange-700">
                ข้าว และ น้ำ | SLA: 5 นาที
              </p>
            </div>
          </div>
          
          {/* Summary stats */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {getTicketsByStatus('NEW').length}
              </div>
              <div className="text-xs text-gray-600">คิวใหม่</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getTicketsByStatus('IN_PROGRESS').length}
              </div>
              <div className="text-xs text-gray-600">กำลังทำ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getTicketsByStatus('READY').length}
              </div>
              <div className="text-xs text-gray-600">พร้อม</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket tabs */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger 
              id="tabNew"
              value="NEW" 
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
            >
              ใหม่ ({getTicketsByStatus('NEW').length})
            </TabsTrigger>
            <TabsTrigger 
              id="tabInProgress"
              value="IN_PROGRESS"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              กำลังทำ ({getTicketsByStatus('IN_PROGRESS').length})
            </TabsTrigger>
            <TabsTrigger 
              id="tabReady"
              value="READY"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              พร้อม ({getTicketsByStatus('READY').length})
            </TabsTrigger>
          </TabsList>

          {/* NEW tickets */}
          <TabsContent value="NEW">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getTicketsByStatus('NEW').length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>ไม่มีคิวใหม่</p>
                </div>
              ) : (
                getTicketsByStatus('NEW').map(renderTicketCard)
              )}
            </div>
          </TabsContent>

          {/* IN_PROGRESS tickets */}
          <TabsContent value="IN_PROGRESS">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getTicketsByStatus('IN_PROGRESS').length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Play className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>ไม่มีคิวที่กำลังทำ</p>
                </div>
              ) : (
                getTicketsByStatus('IN_PROGRESS').map(renderTicketCard)
              )}
            </div>
          </TabsContent>

          {/* READY tickets */}
          <TabsContent value="READY">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getTicketsByStatus('READY').length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>ไม่มีคิวที่พร้อม</p>
                </div>
              ) : (
                getTicketsByStatus('READY').map(renderTicketCard)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}