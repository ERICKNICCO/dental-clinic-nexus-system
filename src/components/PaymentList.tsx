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
import { Search, Plus, CreditCard, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAllTreatmentNotes } from '../hooks/useAllTreatmentNotes';
import { usePatients } from '../hooks/usePatients';
import { treatmentPricingFirebaseService } from '../services/treatmentPricingFirebaseService';
import RecordPaymentModal from './payments/RecordPaymentModal';

const paymentStatuses = ["All", "Paid", "Partial", "Pending"];
const paymentMethods = ["All", "Cash", "Card", "Bank Transfer"];

interface Payment {
  id: string;
  patientName: string;
  treatmentName: string;
  amount: number;
  amountPaid: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  paymentMethod: string;
  date: string;
  notes: string;
}

const PaymentList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedMethod, setSelectedMethod] = useState("All");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [treatmentPricing, setTreatmentPricing] = useState([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);

  const { allNotes, loading: notesLoading } = useAllTreatmentNotes();
  const { patients, loading: patientsLoading } = usePatients();

  // Load treatment pricing from Firebase
  useEffect(() => {
    const loadTreatmentPricing = async () => {
      try {
        setPricingLoading(true);
        const pricing = await treatmentPricingFirebaseService.getAllTreatmentPricing();
        setTreatmentPricing(pricing);
      } catch (error) {
        console.error('Error loading treatment pricing:', error);
      } finally {
        setPricingLoading(false);
      }
    };

    loadTreatmentPricing();
  }, []);

  // Helper function to find treatment price
  const findTreatmentPrice = (procedureName: string) => {
    // Try exact match first
    let pricingData = treatmentPricing.find(p => p.name === procedureName);
    if (pricingData) {
      return pricingData.price;
    }
    
    // Try case-insensitive match
    pricingData = treatmentPricing.find(p => p.name.toLowerCase() === procedureName.toLowerCase());
    if (pricingData) {
      return pricingData.price;
    }
    
    // Try partial match
    pricingData = treatmentPricing.find(p => 
      p.name.toLowerCase().includes(procedureName.toLowerCase()) ||
      procedureName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (pricingData) {
      return pricingData.price;
    }
    
    return 0;
  };

  // Helper function to find patient name by ID
  const findPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : 'Unknown Patient';
  };

  // Convert treatment notes to payments
  useEffect(() => {
    if (!notesLoading && !patientsLoading && !pricingLoading) {
      const paymentsFromTreatments = allNotes.map(note => {
        const amount = findTreatmentPrice(note.procedure);
        const patientName = findPatientName(note.patientId);
        
        // For demo purposes, randomly assign payment status
        const statuses: ('paid' | 'partial' | 'pending')[] = ['paid', 'partial', 'pending'];
        const methods = ['cash', 'card', ''];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const randomMethod = methods[Math.floor(Math.random() * methods.length)];
        
        let amountPaid = 0;
        if (randomStatus === 'paid') {
          amountPaid = amount;
        } else if (randomStatus === 'partial') {
          amountPaid = Math.floor(amount * 0.5); // 50% paid
        }

        return {
          id: note.id,
          patientName: patientName,
          treatmentName: note.procedure,
          amount: amount,
          amountPaid: amountPaid,
          paymentStatus: randomStatus,
          paymentMethod: randomMethod,
          date: note.date,
          notes: note.notes || 'Treatment completed'
        };
      });

      setPayments(paymentsFromTreatments);
    }
  }, [allNotes, patients, treatmentPricing, notesLoading, patientsLoading, pricingLoading]);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.treatmentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "All" || payment.paymentStatus === selectedStatus.toLowerCase();
    const matchesMethod = selectedMethod === "All" || payment.paymentMethod === selectedMethod.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const pendingPayments = payments.filter(payment => payment.paymentStatus === 'pending');
  const partialPayments = payments.filter(payment => payment.paymentStatus === 'partial');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number): string => {
    if (price === 0) {
      return 'No charge';
    }
    return treatmentPricingFirebaseService.formatPrice(price);
  };

  const handlePaymentRecorded = () => {
    // Refresh the payments data
    // In a real app, you would refetch from the database
  };

  if (notesLoading || patientsLoading || pricingLoading) {
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
        <Button 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setIsRecordPaymentModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Record Payment
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingPayments.length})</TabsTrigger>
          <TabsTrigger value="partial">Partial ({partialPayments.length})</TabsTrigger>
        </TabsList>
        
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
                      <TableCell className="font-medium">{payment.patientName}</TableCell>
                      <TableCell>{payment.treatmentName}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(payment.amount)}</TableCell>
                      <TableCell className="font-semibold text-green-600">{formatPrice(payment.amountPaid)}</TableCell>
                      <TableCell className="font-semibold text-red-600">{formatPrice(payment.amount - payment.amountPaid)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.paymentStatus)}>
                          {payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.paymentMethod || '-'}</TableCell>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="mr-2">
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          <div className="bg-white rounded-md shadow">
            <Table>
              <TableCaption>Payments pending collection</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No pending payments
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.patientName}</TableCell>
                      <TableCell>{payment.treatmentName}</TableCell>
                      <TableCell className="font-semibold text-red-600">{formatPrice(payment.amount)}</TableCell>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
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
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partialPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No partial payments
                    </TableCell>
                  </TableRow>
                ) : (
                  partialPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.patientName}</TableCell>
                      <TableCell>{payment.treatmentName}</TableCell>
                      <TableCell className="font-semibold text-green-600">{formatPrice(payment.amountPaid)}</TableCell>
                      <TableCell className="font-semibold text-red-600">{formatPrice(payment.amount - payment.amountPaid)}</TableCell>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
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
      </Tabs>

      <RecordPaymentModal
        isOpen={isRecordPaymentModalOpen}
        onClose={() => setIsRecordPaymentModalOpen(false)}
        payments={payments}
        onPaymentRecorded={handlePaymentRecorded}
      />
    </div>
  );
};

export default PaymentList;
