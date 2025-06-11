
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { treatmentPricingFirebaseService } from '../../services/treatmentPricingFirebaseService';

interface Payment {
  id: string;
  patientName: string;
  treatmentName: string;
  amount: number;
  amountPaid: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  paymentMethod: string;
  insuranceProvider?: string;
  date: string;
  notes: string;
}

interface PaymentTableProps {
  payments: Payment[];
}

const PaymentTable: React.FC<PaymentTableProps> = ({ payments }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsuranceProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'nhif': return 'bg-blue-100 text-blue-800';
      case 'jubilee': return 'bg-purple-100 text-purple-800';
      case 'ga insurance': return 'bg-orange-100 text-orange-800';
      case 'mo insurance': return 'bg-teal-100 text-teal-800';
      case 'cash': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number): string => {
    if (price === 0) {
      return 'No charge';
    }
    return treatmentPricingFirebaseService.formatPrice(price);
  };

  return (
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
            <TableHead>Insurance Provider</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                No payments found
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
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
                <TableCell>
                  <Badge className={getInsuranceProviderColor(payment.paymentMethod)}>
                    {payment.paymentMethod === 'Cash' ? 'Cash' : payment.insuranceProvider || payment.paymentMethod}
                  </Badge>
                </TableCell>
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
  );
};

export default PaymentTable;
