import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { paymentService, Payment } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseAppointmentService } from '../../services/supabaseAppointmentService';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: Payment[];
  onPaymentRecorded: () => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  payments,
  onPaymentRecorded
}) => {
  const [selectedPayment, setSelectedPayment] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { userProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPayment || !amountPaid || !paymentMethod || !userProfile) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(amountPaid);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      console.log('🔥 RecordPaymentModal: Recording payment for ID:', selectedPayment);
      console.log('🔥 RecordPaymentModal: Amount to record:', amount, 'Payment method:', paymentMethod);
      
      const updatedPayment = await paymentService.recordPayment(
        selectedPayment,
        Math.round(amount),
        paymentMethod,
        userProfile.name || userProfile.email,
        notes
      );

      console.log('✅ RecordPaymentModal: Payment recorded successfully:', updatedPayment);
      
      // Check if payment is complete and checkout was triggered
      if (updatedPayment.payment_status === 'paid') {
        console.log('✅ RecordPaymentModal: Payment is complete, checkout process should have been triggered');
        toast.success("Payment has been successfully recorded and patient checked out");
        // Update appointment status to 'Completed' if appointment_id exists
        if (updatedPayment.appointment_id) {
          try {
            await supabaseAppointmentService.updateAppointment(updatedPayment.appointment_id, { status: 'Completed' });
            console.log('✅ Appointment status updated to Completed');
          } catch (err) {
            console.error('❌ Failed to update appointment status:', err);
          }
        }
      } else {
        console.log('✅ RecordPaymentModal: Payment recorded but not complete yet');
        toast.success("Payment has been successfully recorded");
      }

      resetForm();
      onPaymentRecorded();
    } catch (error) {
      console.error('❌ RecordPaymentModal: Error recording payment:', error);
      toast.error("Failed to record payment: " + (error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPayment('');
    setAmountPaid('');
    setPaymentMethod('cash');
    setNotes('');
  };

  const pendingPayments = payments.filter(p => p.payment_status === 'pending' || p.payment_status === 'partial');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="payment">Select Payment</Label>
            <Select value={selectedPayment} onValueChange={setSelectedPayment}>
              <SelectTrigger>
                <SelectValue placeholder="Select a payment to record" />
              </SelectTrigger>
              <SelectContent>
                {pendingPayments.map((payment) => (
                  <SelectItem key={payment.id} value={payment.id}>
                    {payment.patient_name} - {payment.treatment_name} (Balance: {paymentService.formatPrice(payment.total_amount - payment.amount_paid)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="amount">Amount Paid</Label>
            <Input
              id="amount"
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="1000"
            />
          </div>
          
          <div>
            <Label htmlFor="method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordPaymentModal;
