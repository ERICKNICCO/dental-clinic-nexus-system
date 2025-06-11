
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentFilters from './payments/PaymentFilters';
import PaymentTable from './payments/PaymentTable';
import PendingPaymentsTable from './payments/PendingPaymentsTable';
import PartialPaymentsTable from './payments/PartialPaymentsTable';
import RecordPaymentModal from './payments/RecordPaymentModal';
import { usePaymentData } from '../hooks/usePaymentData';
import { useAutoPatientCreation } from '../hooks/useAutoPatientCreation';

const PaymentList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedMethod, setSelectedMethod] = useState("All");
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);

  const { payments, loading } = usePaymentData();
  
  // Initialize auto-patient creation
  useAutoPatientCreation();

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.treatmentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "All" || payment.paymentStatus === selectedStatus.toLowerCase();
    const matchesMethod = selectedMethod === "All" || 
      payment.paymentMethod.toLowerCase() === selectedMethod.toLowerCase() ||
      payment.insuranceProvider?.toLowerCase() === selectedMethod.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const pendingPayments = payments.filter(payment => payment.paymentStatus === 'pending');
  const partialPayments = payments.filter(payment => payment.paymentStatus === 'partial');

  const handlePaymentRecorded = () => {
    // Refresh the payments data
    // In a real app, you would refetch from the database
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
      <PaymentFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedMethod={selectedMethod}
        setSelectedMethod={setSelectedMethod}
        onRecordPayment={() => setIsRecordPaymentModalOpen(true)}
      />

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingPayments.length})</TabsTrigger>
          <TabsTrigger value="partial">Partial ({partialPayments.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <PaymentTable payments={filteredPayments} />
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          <PendingPaymentsTable payments={pendingPayments} />
        </TabsContent>

        <TabsContent value="partial" className="space-y-4">
          <PartialPaymentsTable payments={partialPayments} />
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
