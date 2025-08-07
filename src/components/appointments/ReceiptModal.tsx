import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Appointment } from '../../types/appointment';
import { useReactToPrint } from 'react-to-print';
import { paymentService, Payment } from '../../services/paymentService';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, appointment }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayment = async () => {
      setLoading(true);
      const pay = await paymentService.getPaymentByAppointmentId(appointment.id);
      setPayment(pay);
      setLoading(false);
    };
    if (isOpen) fetchPayment();
  }, [isOpen, appointment.id]);

    const handlePrint = useReactToPrint({
      contentRef: printRef,
    documentTitle: `Receipt-${appointment.patient?.name || ''}-${appointment.date}`,
  });

  const clinicName = 'SD Dental Clinic';
  const clinicAddress = 'Your Clinic Address';
  const clinicPhone = 'Your Clinic Phone';
  const logoUrl = '/lovable-uploads/7894f073-6ef4-4509-aa4c-9dc1418c0e33.png';
  const today = new Date();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Print Receipt</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end mb-2">
          <Button type="button" variant="outline" onClick={handlePrint} disabled={loading}>
            Print
          </Button>
        </div>
        <div ref={printRef} className="p-6 bg-white rounded shadow text-gray-900 min-w-[350px]">
          <div className="flex items-center justify-center mb-4">
            <img src={logoUrl} alt="Clinic Logo" className="h-12 mr-3" />
            <div>
              <div className="text-xl font-bold">{clinicName}</div>
              <div className="text-xs text-gray-600">{clinicAddress}</div>
              <div className="text-xs text-gray-600">{clinicPhone}</div>
            </div>
          </div>
          <hr className="my-2" />
          <div className="mb-2">
            <div className="font-semibold">Receipt</div>
            <div className="text-xs text-gray-500">{today.toLocaleString()}</div>
          </div>
          <div className="mb-2">
            <div><span className="font-medium">Patient:</span> {appointment.patient?.name}</div>
            <div><span className="font-medium">Phone:</span> {appointment.patient?.phone}</div>
          </div>
          <div className="mb-2">
            <div><span className="font-medium">Treatment:</span> {appointment.treatment}</div>
            <div><span className="font-medium">Dentist:</span> {appointment.dentist}</div>
            <div><span className="font-medium">Date:</span> {appointment.date} {appointment.time}</div>
          </div>
          <div className="mb-2">
            <div><span className="font-medium">Amount Paid:</span> <span className="text-green-700 font-bold">{loading ? 'Loading...' : payment ? `${payment.amount_paid} Tsh` : 'N/A'}</span></div>
            <div><span className="font-medium">Payment Method:</span> Cash</div>
          </div>
          <hr className="my-2" />
          <div className="text-center text-lg font-semibold text-green-700 mb-2">PAID</div>
          <div className="text-center text-sm text-gray-700">Thank you for choosing {clinicName}!</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptModal; 