import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseConsultationService } from '../../services/supabaseConsultationService';

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentCreated: () => void;
  selectedAppointment: string;
}

const CreatePaymentModal: React.FC<CreatePaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentCreated,
  selectedAppointment
}) => {
  const [patientName, setPatientName] = useState('');
  const [treatmentName, setTreatmentName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'insurance'>('cash');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { userProfile } = useAuth();
  const [consultation, setConsultation] = useState(null);
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    async function fetchConsultation() {
      setAutoFilled(false);
      if (selectedAppointment) {
        const latestConsultation = await supabaseConsultationService.getLatestConsultationByAppointmentId(selectedAppointment);
        if (latestConsultation) {
          setConsultation(latestConsultation);
          // Compose treatment name and total from consultation
          const items = Array.isArray(latestConsultation.treatment_items) ? latestConsultation.treatment_items : [];
          const treatmentNameStr = items.length > 0
            ? items.map(item => `${item.name} - TSh ${item.cost.toLocaleString()}${item.duration ? ` (${item.duration})` : ''}`).join(' • ')
            : latestConsultation.diagnosis || 'General consultation';
          const total = items.reduce((sum, item) => sum + (item.cost || 0), 0);
          setTreatmentName(treatmentNameStr);
          setTotalAmount(total.toString());
          setAutoFilled(true);
        } else {
          setConsultation(null);
          setAutoFilled(false);
        }
      }
    }
    fetchConsultation();
  }, [selectedAppointment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientName || !treatmentName || !totalAmount || !userProfile) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (paymentMethod === 'insurance' && !insuranceProvider) {
      toast.error('Please select an insurance provider');
      return;
    }

    setLoading(true);
    try {
      // Remove duration in parentheses from treatmentName
      const cleanedTreatmentName = treatmentName.replace(/\s*\([^)]*min\)/gi, '').trim();
      const paymentData = {
        patient_id: `manual-${Date.now()}`, // Generate a temporary ID for manual entries
        patient_name: patientName,
        treatment_name: cleanedTreatmentName,
        total_amount: Math.round(amount * 100), // Convert to cents
        amount_paid: 0,
        payment_status: 'pending' as const,
        payment_method: paymentMethod,
        insurance_provider: paymentMethod === 'insurance' ? insuranceProvider : undefined,
        collected_by: userProfile.name || userProfile.email,
        notes: notes || undefined,
        appointment_id: selectedAppointment
      };

      await paymentService.createPayment(paymentData);

      toast.success('Payment record created successfully');

      // Reset form
      setPatientName('');
      setTreatmentName('');
      setTotalAmount('');
      setPaymentMethod('cash');
      setInsuranceProvider('');
      setNotes('');
      
      onPaymentCreated();
      onClose();
    } catch (error) {
      console.error('Error creating payment record:', error);
      toast.error('Failed to create payment record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Payment Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patientName">Patient Name</Label>
            <Input
              id="patientName"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="treatmentName">Treatment</Label>
            <Input
              id="treatmentName"
              value={treatmentName}
              onChange={(e) => setTreatmentName(e.target.value)}
              placeholder="Enter treatment name"
              required
              readOnly={!!consultation}
            />
          </div>
          
          <div>
            <Label htmlFor="totalAmount">Total Amount</Label>
            <Input
              id="totalAmount"
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="Enter total amount"
              min="0"
              step="1000"
              required
              readOnly={!!consultation}
            />
          </div>
          
          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(value: 'cash' | 'insurance') => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'insurance' && (
            <div>
              <Label htmlFor="insuranceProvider">Insurance Provider</Label>
              <Select value={insuranceProvider} onValueChange={setInsuranceProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select insurance provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NHIF">NHIF (National Health Insurance Fund)</SelectItem>
                  <SelectItem value="Jubilee">Jubilee Insurance</SelectItem>
                  <SelectItem value="AAR">AAR Insurance</SelectItem>
                  <SelectItem value="Britam">Britam Insurance</SelectItem>
                  <SelectItem value="Madison">Madison Insurance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
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
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Creating...' : 'Create Payment Record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePaymentModal;
