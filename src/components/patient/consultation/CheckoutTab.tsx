
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { CreditCard, Receipt, CheckCircle, Clock } from 'lucide-react';
import { paymentService, Payment } from '../../../services/paymentService';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

interface CheckoutTabProps {
  patientId: string;
  patientName: string;
  consultationData: any;
  onPaymentComplete: () => void;
}

const CheckoutTab: React.FC<CheckoutTabProps> = ({
  patientId,
  patientName,
  consultationData,
  onPaymentComplete
}) => {
  const { userProfile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [amountToCollect, setAmountToCollect] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPayments();
  }, [patientId]);

  const loadPayments = async () => {
    try {
      const patientPayments = await paymentService.getPaymentsByPatient(patientId);
      setPayments(patientPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const createPaymentFromConsultation = async () => {
    if (!consultationData.estimatedCost || !consultationData.diagnosis) {
      toast.error('Please complete diagnosis and treatment cost estimation first');
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        patient_id: patientId,
        patient_name: patientName,
        treatment_name: consultationData.diagnosis,
        consultation_id: consultationData.id || 'consultation-' + Date.now(),
        total_amount: Math.round(consultationData.estimatedCost * 100), // Convert to cents
        amount_paid: 0,
        payment_status: 'pending' as const,
        payment_method: 'cash' as const,
        notes: `Created from consultation - ${consultationData.treatmentPlan || ''}`
      };

      await paymentService.createPayment(paymentData);
      await loadPayments();
      toast.success('Payment record created successfully');
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to create payment record');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCollection = async () => {
    if (!selectedPayment || !amountToCollect || !userProfile) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(amountToCollect);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await paymentService.recordPayment(
        selectedPayment,
        Math.round(amount * 100), // Convert to cents
        paymentMethod,
        userProfile.name || userProfile.email,
        notes
      );

      await loadPayments();
      setSelectedPayment('');
      setAmountToCollect('');
      setNotes('');
      toast.success('Payment recorded successfully');
      onPaymentComplete();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pending': return <CreditCard className="h-4 w-4 text-red-600" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const pendingPayments = payments.filter(p => p.payment_status !== 'paid');

  return (
    <div className="space-y-6">
      {/* Create Payment from Consultation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Create Payment Record
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {consultationData.estimatedCost && consultationData.diagnosis ? (
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p><strong>Treatment:</strong> {consultationData.diagnosis}</p>
                <p><strong>Estimated Cost:</strong> Tsh {consultationData.estimatedCost?.toLocaleString()}</p>
                {consultationData.treatmentPlan && (
                  <p><strong>Treatment Plan:</strong> {consultationData.treatmentPlan}</p>
                )}
              </div>
              <Button 
                onClick={createPaymentFromConsultation}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creating...' : 'Create Payment Record'}
              </Button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              Complete diagnosis and treatment cost estimation to create payment record
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Collection */}
      {pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Collect Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="payment">Select Payment</Label>
              <Select value={selectedPayment} onValueChange={setSelectedPayment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a payment to collect" />
                </SelectTrigger>
                <SelectContent>
                  {pendingPayments.map((payment) => (
                    <SelectItem key={payment.id} value={payment.id}>
                      {payment.treatment_name} - Balance: {paymentService.formatPrice(payment.total_amount - payment.amount_paid)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount to Collect</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amountToCollect}
                  onChange={(e) => setAmountToCollect(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="1000"
                />
              </div>
              
              <div>
                <Label htmlFor="method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <Button 
              onClick={handlePaymentCollection}
              disabled={loading || !selectedPayment || !amountToCollect}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No payment records found
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payment.payment_status)}
                      <span className="font-medium">{payment.treatment_name}</span>
                    </div>
                    <Badge className={getStatusColor(payment.payment_status)}>
                      {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Total:</strong> {paymentService.formatPrice(payment.total_amount)}</p>
                      <p><strong>Paid:</strong> {paymentService.formatPrice(payment.amount_paid)}</p>
                      <p><strong>Balance:</strong> {paymentService.formatPrice(payment.total_amount - payment.amount_paid)}</p>
                    </div>
                    <div>
                      <p><strong>Method:</strong> {payment.payment_method}</p>
                      {payment.payment_date && <p><strong>Date:</strong> {payment.payment_date}</p>}
                      {payment.collected_by && <p><strong>Collected by:</strong> {payment.collected_by}</p>}
                    </div>
                  </div>
                  
                  {payment.notes && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-sm text-gray-600">{payment.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutTab;
