import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { useReactToPrint } from 'react-to-print';
import { Payment } from '../../services/paymentService';
import { Receipt, Printer } from 'lucide-react';

interface TreatmentItem {
  name: string;
  cost: number;
  quantity?: number;
}

interface CashPaymentReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  treatmentItems?: TreatmentItem[];
}

const CashPaymentReceipt: React.FC<CashPaymentReceiptProps> = ({ 
  isOpen, 
  onClose, 
  payment, 
  treatmentItems = [] 
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [currentDate] = useState(new Date());

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt-${payment?.patient_name?.replace(/\s+/g, '-') || 'Unknown'}-${payment?.payment_date || 'Unknown'}`,
    onAfterPrint: () => {
      console.log('Receipt printed successfully');
    },
    onPrintError: (error) => {
      console.error('Print error:', error);
    }
  });

  // Clinic branding information
  const clinicInfo = {
    name: 'SD Dental Clinic',
    address: 'Masaki Area, Dar es Salaam, Tanzania',
    phone: '+255 123 456 789',
    email: 'info@sddental.com',
    logo: '/lovable-uploads/7894f073-6ef4-4509-aa4c-9dc1418c0e33.png'
  };

  // Calculate totals and breakdown with safety checks
  const calculateBreakdown = () => {
    if (!payment) {
      return {
        subtotal: 0,
        discountAmount: 0,
        discountPercent: 0,
        finalTotal: 0,
        amountPaid: 0,
        balance: 0
      };
    }

    const subtotal = payment.total_amount || 0;
    const discountAmount = payment.discount_amount || 0;
    const discountPercent = payment.discount_percent || 0;
    const finalTotal = payment.final_total || subtotal - discountAmount;
    
    return {
      subtotal,
      discountAmount,
      discountPercent,
      finalTotal,
      amountPaid: payment.amount_paid || 0,
      balance: finalTotal - (payment.amount_paid || 0)
    };
  };

  const breakdown = calculateBreakdown();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Cash Payment Receipt
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-end gap-2 mb-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
        </div>

        {/* Printable Receipt Content */}
        <div ref={printRef} className="bg-white p-8 font-sans text-gray-900 print-receipt">
          {/* Header with Logo and Clinic Info */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img 
                src={clinicInfo.logo} 
                alt="SD Dental Clinic Logo" 
                className="h-16 w-16 mr-4"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-2xl font-bold text-blue-800 mb-1">{clinicInfo.name}</h1>
                <p className="text-sm text-gray-600">{clinicInfo.address}</p>
                <p className="text-sm text-gray-600">{clinicInfo.phone} | {clinicInfo.email}</p>
              </div>
            </div>
            <div className="border-b-2 border-blue-800 w-full"></div>
          </div>

          {/* Receipt Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">PAYMENT RECEIPT</h2>
            <p className="text-sm text-gray-600">Receipt No: RCP-{payment?.id?.substring(0, 8)?.toUpperCase() || 'N/A'}</p>
            <p className="text-sm text-gray-600">Date: {currentDate.toLocaleDateString('en-GB')} {currentDate.toLocaleTimeString()}</p>
          </div>

          {/* Patient Information */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Patient Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {payment?.patient_name?.toUpperCase() || 'N/A'}</div>
                <div><span className="font-medium">Patient ID:</span> {payment?.patient_id || 'N/A'}</div>
                <div><span className="font-medium">Payment Date:</span> {payment?.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-GB') : 'N/A'}</div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Payment Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Payment Method:</span> {payment?.payment_method?.replace('_', ' ')?.toUpperCase() || 'N/A'}</div>
                <div><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    payment?.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                    payment?.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {payment?.payment_status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
                {payment?.collected_by && (
                  <div><span className="font-medium">Collected By:</span> {payment.collected_by}</div>
                )}
              </div>
            </div>
          </div>

          {/* Treatment Details */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Treatment Details</h3>
            <div className="border border-gray-300 rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 font-medium">Treatment</th>
                    <th className="text-center p-3 font-medium">Qty</th>
                    <th className="text-right p-3 font-medium">Cost (TSH)</th>
                  </tr>
                </thead>
                <tbody>
                  {treatmentItems.length > 0 ? (
                    treatmentItems.map((item, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="p-3">{item.name}</td>
                        <td className="p-3 text-center">{item.quantity || 1}</td>
                        <td className="p-3 text-right font-medium">{(item.cost * (item.quantity || 1)).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-gray-200">
                      <td className="p-3">{payment?.treatment_name || 'N/A'}</td>
                      <td className="p-3 text-center">1</td>
                      <td className="p-3 text-right font-medium">{(payment?.total_amount || 0).toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Payment Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>TSH {breakdown.subtotal.toLocaleString()}</span>
                </div>
                
                {breakdown.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount ({breakdown.discountPercent}%):</span>
                    <span>-TSH {breakdown.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>TSH {breakdown.finalTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Amount Paid:</span>
                    <span>TSH {breakdown.amountPaid.toLocaleString()}</span>
                  </div>
                  
                  {breakdown.balance > 0 && (
                    <div className="flex justify-between text-red-600 font-semibold">
                      <span>Balance Due:</span>
                      <span>TSH {breakdown.balance.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {breakdown.balance === 0 && (
                    <div className="text-center mt-3 p-2 bg-green-100 text-green-800 rounded font-bold">
                      FULLY PAID
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {payment?.notes && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">Notes</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{payment.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 mt-8 pt-4 border-t border-gray-300">
            <p className="mb-2">Thank you for choosing {clinicInfo.name}!</p>
            <p className="text-xs">For any queries regarding this receipt, please contact us at {clinicInfo.phone}</p>
            <p className="text-xs mt-2 text-gray-500">This is a computer-generated receipt.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CashPaymentReceipt;