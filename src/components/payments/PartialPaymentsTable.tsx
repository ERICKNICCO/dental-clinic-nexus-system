
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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

interface PartialPaymentsTableProps {
  payments: Payment[];
}

const PartialPaymentsTable: React.FC<PartialPaymentsTableProps> = ({ payments }) => {
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
        <TableCaption>Payments with outstanding balance</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Treatment</TableHead>
            <TableHead>Amount Paid</TableHead>
            <TableHead>Balance Due</TableHead>
            <TableHead>Insurance Provider</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No partial payments
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.patientName}</TableCell>
                <TableCell>{payment.treatmentName}</TableCell>
                <TableCell className="font-semibold text-green-600">{formatPrice(payment.amountPaid)}</TableCell>
                <TableCell className="font-semibold text-red-600">{formatPrice(payment.amount - payment.amountPaid)}</TableCell>
                <TableCell>
                  <Badge className={getInsuranceProviderColor(payment.paymentMethod)}>
                    {payment.paymentMethod === 'Cash' ? 'Cash' : payment.insuranceProvider || payment.paymentMethod}
                  </Badge>
                </TableCell>
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
  );
};

export default PartialPaymentsTable;
