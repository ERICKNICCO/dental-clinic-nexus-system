import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, CreditCard, Filter, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { paymentService, Payment } from '../services/paymentService';
import RecordPaymentModal from './payments/RecordPaymentModal';
import CreatePaymentModal from './payments/CreatePaymentModal';
import ClaimFormModal from './payments/ClaimFormModal';
import { supabaseConsultationService } from '../services/supabaseConsultationService';
import _ from 'lodash';
import { toSentenceCase } from '@/lib/utils';
import { useAppointments } from '../hooks/useAppointments';

const paymentStatuses = ["All", "Paid", "Partial", "Pending"];
const paymentMethods = ["All", "Cash", "Card", "Bank Transfer", "Insurance"];

const PaymentList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedMethod, setSelectedMethod] = useState("All");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [isCreatePaymentModalOpen, setIsCreatePaymentModalOpen] = useState(false);
  const [selectedPaymentForModal, setSelectedPaymentForModal] = useState<Payment | null>(null);
  const [isClaimFormModalOpen, setIsClaimFormModalOpen] = useState(false);
  const [consultationTreatments, setConsultationTreatments] = useState<Record<string, { name: string; cost: number }[]>>({});
  const { refreshAppointments } = useAppointments();

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    async function fetchConsultationTreatments() {
      const paymentsWithConsultation = payments.filter(p => p.consultation_id);
      const uniqueConsultationIds = Array.from(new Set(paymentsWithConsultation.map(p => p.consultation_id)));
      if (uniqueConsultationIds.length === 0) {
        setConsultationTreatments({});
        return;
      }
      const results = await Promise.all(
        uniqueConsultationIds.map(async (id): Promise<[string, { name: string; cost: number }[]]> => {
          if (!id) return [id as string, []];
          const consultation = await supabaseConsultationService.getConsultation(id as string);
          const items = (consultation?.treatment_items || []).map(item => ({ name: item.name, cost: item.cost }));
          return [id as string, items];
        })
      );
      const treatmentsMap: Record<string, { name: string; cost: number }[]> = {};
      (results as [string, { name: string; cost: number }[]][]).forEach(([id, items]) => {
        if (id) treatmentsMap[id] = items;
      });
      setConsultationTreatments(treatmentsMap);
    }
    fetchConsultationTreatments();
  }, [payments]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const allPayments = await paymentService.getAllPayments();
      setPayments(allPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.treatment_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "All" || payment.payment_status === selectedStatus.toLowerCase();
    const matchesMethod = selectedMethod === "All" || 
      payment.payment_method.toLowerCase() === selectedMethod.toLowerCase().replace(' ', '_');
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const pendingPayments = payments.filter(payment => payment.payment_status !== 'claim_submitted' && (payment.payment_status === 'pending' || payment.payment_status === 'partial'));
  const partialPayments = payments.filter(payment => payment.payment_status === 'partial');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-red-100 text-red-800';
      case 'claim_submitted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'bank_transfer': return 'bg-purple-100 text-purple-800';
      case 'insurance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePaymentRecorded = async () => {
    await refreshAppointments();
    loadPayments();
    setIsRecordPaymentModalOpen(false);
    setSelectedPaymentForModal(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-center h-64">
          <span className="ml-2">Loading payment data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{pendingPayments.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting collection</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partial Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{partialPayments.length}</div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">All payment records</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search payments..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {paymentStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMethod} onValueChange={setSelectedMethod}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsCreatePaymentModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Payment Record
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setIsRecordPaymentModalOpen(true)}
          >
            <CreditCard className="mr-2 h-4 w-4" /> Collect Payment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending Collection ({pendingPayments.length})</TabsTrigger>
          <TabsTrigger value="partial">Partial Payments ({partialPayments.length})</TabsTrigger>
          <TabsTrigger value="all">All Payments ({payments.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          <div className="bg-white rounded-md shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No pending payments
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.patient_name.toUpperCase()}</TableCell>
                      <TableCell>
                        <ul className="list-disc list-inside space-y-1">
                          {payment.treatment_name
                            ? payment.treatment_name.split(' • ').map((t, idx) => {
                                const cleaned = t.replace(/\s*\([^)]*min\)/gi, '').trim();
                                return <li key={idx}>{toSentenceCase(cleaned)}</li>;
                              })
                            : <li>-</li>
                          }
                        </ul>
                      </TableCell>
                      <TableCell className="font-semibold">{paymentService.formatPrice(payment.total_amount)}</TableCell>
                      <TableCell className="font-semibold text-green-600">{paymentService.formatPrice(payment.amount_paid)}</TableCell>
                      <TableCell className="font-semibold text-red-600">{paymentService.formatPrice(payment.total_amount - payment.amount_paid)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.payment_status)}>
                          {payment.payment_status === 'claim_submitted' ? 'Claimed' : payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getMethodColor(payment.payment_method)}>
                          {payment.payment_method.replace('_', ' ').charAt(0).toUpperCase() + payment.payment_method.replace('_', ' ').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            setSelectedPaymentForModal(payment);
                            setIsRecordPaymentModalOpen(true);
                          }}
                        >
                          Collect Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="partial" className="space-y-4">
          <div className="bg-white rounded-md shadow">
            <Table>
              <TableCaption>Payments with outstanding balance</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Balance Due</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Insurance Provider</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partialPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No partial payments
                    </TableCell>
                  </TableRow>
                ) : (
                  partialPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.patient_name.toUpperCase()}</TableCell>
                      <TableCell>
                        <ul className="list-disc list-inside space-y-1">
                          {payment.treatment_name
                            ? payment.treatment_name.split(' • ').map((t, idx) => {
                                const cleaned = t.replace(/\s*\([^)]*min\)/gi, '').trim();
                                return <li key={idx}>{toSentenceCase(cleaned)}</li>;
                              })
                            : <li>-</li>
                          }
                        </ul>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">{paymentService.formatPrice(payment.amount_paid)}</TableCell>
                      <TableCell className="font-semibold text-red-600">{paymentService.formatPrice(payment.total_amount - payment.amount_paid)}</TableCell>
                      <TableCell>
                        <Badge className={getMethodColor(payment.payment_method)}>
                          {payment.payment_method.replace('_', ' ').charAt(0).toUpperCase() + payment.payment_method.replace('_', ' ').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.insurance_provider ? (
                          <Badge variant="outline">{payment.insurance_provider}</Badge>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700"
                          onClick={() => {
                            setSelectedPaymentForModal(payment);
                            setIsRecordPaymentModalOpen(true);
                          }}
                        >
                          Collect Balance
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          <div className="bg-white rounded-md shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.patient_name.toUpperCase()}</TableCell>
                      <TableCell>
                        <ul className="list-disc list-inside space-y-1">
                          {payment.treatment_name
                            ? payment.treatment_name.split(' • ').map((t, idx) => {
                                const cleaned = t.replace(/\s*\([^)]*min\)/gi, '').trim();
                                return <li key={idx}>{toSentenceCase(cleaned)}</li>;
                              })
                            : <li>-</li>
                          }
                        </ul>
                      </TableCell>
                      <TableCell className="font-semibold">{paymentService.formatPrice(payment.total_amount)}</TableCell>
                      <TableCell className="font-semibold text-green-600">{paymentService.formatPrice(payment.amount_paid)}</TableCell>
                      <TableCell className="font-semibold text-red-600">{paymentService.formatPrice(payment.total_amount - payment.amount_paid)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.payment_status)}>
                          {payment.payment_status === 'claim_submitted' ? 'Claimed' : payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getMethodColor(payment.payment_method)}>
                          {payment.payment_method.replace('_', ' ').charAt(0).toUpperCase() + payment.payment_method.replace('_', ' ').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="mr-2">
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <RecordPaymentModal
        isOpen={isRecordPaymentModalOpen}
        onClose={() => {
          setIsRecordPaymentModalOpen(false);
          setSelectedPaymentForModal(null);
        }}
        payments={selectedPaymentForModal ? [selectedPaymentForModal] : payments.filter(p => p.payment_status === 'pending' || p.payment_status === 'partial')}
        onPaymentRecorded={handlePaymentRecorded}
      />

      <CreatePaymentModal
        isOpen={isCreatePaymentModalOpen}
        onClose={() => setIsCreatePaymentModalOpen(false)}
        onPaymentCreated={handlePaymentRecorded}
        selectedAppointment=""
      />

      {isClaimFormModalOpen && (
        <ClaimFormModal
          isOpen={isClaimFormModalOpen}
          onClose={() => {
            setIsClaimFormModalOpen(false);
            setSelectedPaymentForModal(null);
          }}
          payment={selectedPaymentForModal}
          onClaimFormSigned={handlePaymentRecorded}
        />
      )}
    </div>
  );
};

export default PaymentList;
