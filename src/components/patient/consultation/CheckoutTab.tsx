import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { AlertCircle, CheckCircle, CreditCard, DollarSign, Lock, FileText } from 'lucide-react';
import { paymentService } from '../../../services/paymentService';
import { paymentUtils } from '../../../utils/paymentUtils';
import { treatmentPricingService } from '../../../services/treatmentPricingService';
import { supabaseAppointmentService } from '../../../services/supabaseAppointmentService';
import { supabaseConsultationService } from '../../../services/supabaseConsultationService';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';
import { Consultation } from '../../../types/consultation';
import InsuranceClaimForm from '../../insurance/InsuranceClaimForm';

interface CheckoutTabProps {
  patientId: string;
  patientName: string;
  consultationData: Consultation;
  onPaymentComplete: () => void;
  selectedAppointment: string;
  patientType?: 'cash' | 'insurance';
  patientInsurance?: string;
}

const CheckoutTab: React.FC<CheckoutTabProps> = ({
  patientId,
  patientName,
  consultationData,
  onPaymentComplete,
  selectedAppointment,
  patientType = 'cash',
  patientInsurance
}) => {
  const { userProfile } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'insurance'>(patientType);
  const [insuranceProvider, setInsuranceProvider] = useState(patientInsurance || '');
  const [amountPaid, setAmountPaid] = useState('');
  const [collectedBy, setCollectedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInsuranceClaim, setShowInsuranceClaim] = useState(false);
  const [consultationFee, setConsultationFee] = useState<number>(30000);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Check if diagnosis and treatment are complete
  const isDiagnosisComplete = consultationData.diagnosis && consultationData.diagnosis.trim() !== '';
  const isTreatmentComplete = consultationData.treatment_plan && consultationData.treatment_plan.trim() !== '';
  
  // More robust check for estimated cost
  const estimatedCost = consultationData.estimated_cost;
  const hasEstimatedCost = estimatedCost && (typeof estimatedCost === 'string' ? parseFloat(estimatedCost) > 0 : estimatedCost > 0);
  const totalAmount = hasEstimatedCost ? (typeof estimatedCost === 'string' ? Math.round(parseFloat(estimatedCost)) : estimatedCost) : 0;
  
  console.log('CheckoutTab - consultationData:', consultationData);
  console.log('CheckoutTab - patientType:', patientType, 'patientInsurance:', patientInsurance);
  
  const isReadyForPayment = isDiagnosisComplete && isTreatmentComplete && hasEstimatedCost;
  const isAdmin = userProfile?.role === 'admin';
  const isInsurancePatient = patientType === 'insurance' && patientInsurance;

  // Always use a safe array for treatment items
  let items: any[] = [];
  if (Array.isArray(consultationData.treatment_items)) {
    items = consultationData.treatment_items;
  } else if (typeof consultationData.treatment_items === 'string') {
    try {
      items = JSON.parse(consultationData.treatment_items);
    } catch {
      items = [];
    }
  }
  // Always include CONSULTATION fee if not present
  const hasConsultation = items.some(item => item.name && item.name.toLowerCase().includes('consultation'));
  if (!hasConsultation) {
    items = [
      { name: 'CONSULTATION', cost: consultationFee, duration: 10 },
      ...items
    ];
  }

  // Helper to parse treatment plan text into array of { name, cost, duration }
  function parseTreatmentPlan(plan: string): { name: string; cost: number; duration?: number }[] {
    if (!plan) return [];
    // Match lines like: • Extraction-permanent tooth - TSh 40,000 (90 min)
    const lines = plan.split('\n').map(l => l.trim()).filter(l => l.startsWith('•'));
    return lines.map(line => {
      // Remove bullet
      let rest = line.replace(/^•\s*/, '');
      // Extract name, cost, duration
      const match = rest.match(/^(.*?)\s*-\s*TSh\s*([\d,]+)(?:\s*\((\d+)\s*min\))?/i);
      if (match) {
        const name = match[1].trim();
        const cost = parseInt(match[2].replace(/,/g, ''));
        const duration = match[3] ? parseInt(match[3]) : undefined;
        return { name, cost, duration };
      } else {
        return { name: rest, cost: 0 };
      }
    });
  }

  // Use parsed treatments from treatment plan text for summary
  const parsedTreatments = parseTreatmentPlan(consultationData.treatment_plan || '');
  const treatmentsTotal = parsedTreatments.reduce((sum, item) => sum + (item.cost || 0), 0);
  const subtotal = treatmentsTotal;
  const discountAmount = subtotal * (discountPercent / 100);
  const finalTotal = Math.max(0, Math.round(subtotal - discountAmount));

  const handleCheckoutProcess = async () => {
    try {
      console.log('🔥 CheckoutTab: Starting checkout process for appointment:', selectedAppointment);
      
      // Update appointment status to completed
      if (selectedAppointment) {
        console.log('🔥 CheckoutTab: Updating appointment status to Completed for ID:', selectedAppointment);
        await supabaseAppointmentService.updateAppointment(selectedAppointment, { 
          status: 'Completed' 
        });
        console.log('✅ CheckoutTab: Appointment status updated successfully');
      }

      // Complete consultation if consultation_id exists
      if (consultationData.id) {
        console.log('🔥 CheckoutTab: Completing consultation for ID:', consultationData.id);
        await supabaseConsultationService.completeConsultation(consultationData.id, {});
        console.log('✅ CheckoutTab: Consultation completed successfully');
      } else if (patientId) {
        // Try to find and complete active consultation by patient_id
        try {
          console.log('🔥 CheckoutTab: Looking for active consultation for patient:', patientId);
          const activeConsultation = await supabaseConsultationService.getActiveConsultation(patientId);
          if (activeConsultation) {
            console.log('🔥 CheckoutTab: Found active consultation, completing:', activeConsultation.id);
            await supabaseConsultationService.completeConsultation(activeConsultation.id, {});
            console.log('✅ CheckoutTab: Active consultation completed successfully');
          }
        } catch (consultationError) {
          console.warn('⚠️ CheckoutTab: Could not complete consultation:', consultationError);
        }
      }

      toast.success('Patient has been checked out successfully');
    } catch (error) {
      console.error('❌ CheckoutTab: Error during checkout:', error);
      toast.error('Failed to check out patient');
      throw error;
    }
  };

  const handleInsuranceClaimSubmitted = async () => {
    try {
      await handleCheckoutProcess();
      onPaymentComplete();
    } catch (error) {
      console.error('Failed to complete after insurance claim:', error);
    }
  };

  const handleCreatePaymentRecord = async () => {
    if (!isAdmin) {
      toast.error('Only administrators can create payment records');
      return;
    }

    if (!isReadyForPayment) {
      toast.error('Please complete diagnosis and treatment cost estimation first');
      return;
    }

    if (!collectedBy.trim()) {
      toast.error('Please enter who is collecting the payment');
      return;
    }

    if (paymentMethod === 'insurance' && !insuranceProvider.trim()) {
      toast.error('Please select an insurance provider');
      return;
    }

    setLoading(true);
    try {
      // Prevent duplicate payment records for the same consultation
      const existingPayments = await paymentService.getAllPayments();
      const alreadyExists = existingPayments.some(p => p.consultation_id === consultationData.id);
      if (alreadyExists) {
        toast.error('A payment record already exists for this consultation.');
        setLoading(false);
        return;
      }
      // Validate and correct patient ID
      const validatedPatientId = await paymentUtils.validateAndCorrectPatientId(patientName, patientId);
      console.log('✅ CheckoutTab: Validated patient ID:', validatedPatientId);

      // Validate appointment ID if provided
      let validatedAppointmentId = selectedAppointment;
      if (selectedAppointment) {
        console.log('🔥 CheckoutTab: Validating appointment ID:', selectedAppointment);
        // Check if appointment_id is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(selectedAppointment)) {
          console.warn('⚠️ CheckoutTab: Invalid appointment_id format, searching by patient name');
          const foundAppointmentId = await paymentUtils.findAppointmentIdByPatientName(patientName);
          if (foundAppointmentId) {
            validatedAppointmentId = foundAppointmentId;
            console.log('✅ CheckoutTab: Found valid appointment ID:', validatedAppointmentId);
          } else {
            console.warn('⚠️ CheckoutTab: Could not find valid appointment ID');
            validatedAppointmentId = undefined;
          }
        }
      }

      // Compose treatment_name from all treatment items (name, price, duration)
      let treatmentName = '';
      if (items.length > 0) {
        treatmentName = items.map(item =>
          `${item.name} - TSh ${item.cost.toLocaleString()}${item.duration ? ` (${item.duration})` : ''}`
        ).join(' • ');
      } else {
        treatmentName = consultationData.diagnosis || 'General consultation';
      }
      const paymentData = {
        patient_id: validatedPatientId,
        patient_name: patientName,
        treatment_name: treatmentName,
        total_amount: finalTotal,
        amount_paid: 0, // Initially no payment made
        payment_status: 'pending' as const,
        payment_method: paymentMethod,
        insurance_provider: paymentMethod === 'insurance' ? insuranceProvider : undefined,
        collected_by: collectedBy,
        notes: notes || undefined,
        appointment_id: validatedAppointmentId,
        consultation_id: consultationData.id
      };

      console.log("✅ CheckoutTab: Creating payment record with validated data:", paymentData);
      await paymentService.createPayment(paymentData);
      toast.success('Payment record created successfully');
      onPaymentComplete();
    } catch (error) {
      console.error('Failed to create payment record:', error);
      toast.error('Failed to create payment record');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!isAdmin) {
      toast.error('Only administrators can record payments');
      return;
    }

    if (!amountPaid || parseFloat(amountPaid) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (!collectedBy.trim()) {
      toast.error('Please enter who is collecting the payment');
      return;
    }

    if (paymentMethod === 'insurance' && !insuranceProvider.trim()) {
      toast.error('Please select an insurance provider');
      return;
    }

    setLoading(true);
    try {
      // Prevent duplicate payment records for the same consultation
      const existingPayments = await paymentService.getAllPayments();
      const alreadyExists = existingPayments.some(p => p.consultation_id === consultationData.id);
      if (alreadyExists) {
        toast.error('A payment record already exists for this consultation.');
        setLoading(false);
        return;
      }
      const paymentAmount = Math.round(parseFloat(amountPaid) * 100); // Convert to cents
      
      // Validate and correct patient ID
      const validatedPatientId = await paymentUtils.validateAndCorrectPatientId(patientName, patientId);
      console.log('✅ CheckoutTab: Validated patient ID for payment:', validatedPatientId);

      // Validate appointment ID if provided
      let validatedAppointmentId = selectedAppointment;
      if (selectedAppointment) {
        console.log('🔥 CheckoutTab: Validating appointment ID for payment:', selectedAppointment);
        // Check if appointment_id is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(selectedAppointment)) {
          console.warn('⚠️ CheckoutTab: Invalid appointment_id format for payment, searching by patient name');
          const foundAppointmentId = await paymentUtils.findAppointmentIdByPatientName(patientName);
          if (foundAppointmentId) {
            validatedAppointmentId = foundAppointmentId;
            console.log('✅ CheckoutTab: Found valid appointment ID for payment:', validatedAppointmentId);
          } else {
            console.warn('⚠️ CheckoutTab: Could not find valid appointment ID for payment');
            validatedAppointmentId = undefined;
          }
        }
      }
      
      const paymentData = {
        patient_id: validatedPatientId,
        patient_name: patientName,
        treatment_name: consultationData.diagnosis || 'General consultation',
        total_amount: finalTotal,
        amount_paid: paymentAmount,
        payment_status: paymentAmount >= finalTotal ? 'paid' as const : 'partial' as const,
        payment_method: paymentMethod,
        insurance_provider: paymentMethod === 'insurance' ? insuranceProvider : undefined,
        collected_by: collectedBy,
        notes: notes || undefined,
        appointment_id: validatedAppointmentId,
        consultation_id: consultationData.id
      };

      console.log("🔥 CheckoutTab: Recording payment with validated data:", paymentData);
      const createdPayment = await paymentService.createPayment(paymentData);
      
      // If payment is complete, the paymentService will automatically handle checkout
      // through the handleCheckoutProcess method
      if (paymentAmount >= finalTotal) {
        console.log('🔥 CheckoutTab: Payment is complete, checkout should be handled automatically');
      }
      
      toast.success('Payment recorded successfully');
      onPaymentComplete();
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWithoutPayment = async () => {
    if (!isAdmin) {
      toast.error('Only administrators can complete consultations');
      return;
    }

    setLoading(true);
    try {
      await handleCheckoutProcess();
      onPaymentComplete();
    } catch (error) {
      console.error('Failed to complete consultation:', error);
      toast.error('Failed to complete consultation');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentTypeDisplay = () => {
    if (patientType === 'insurance' && patientInsurance) {
      return patientInsurance.toUpperCase();
    }
    return 'CASH';
  };

  // Helper function to get procedures as string array
  const getProceduresArray = () => {
    try {
      const treatmentItems = consultationData.treatment_items;
      if (typeof treatmentItems === 'string') {
        const parsed = JSON.parse(treatmentItems);
        return Array.isArray(parsed) ? parsed.map((item: any) => item.name || 'Unknown') : [];
      } else if (Array.isArray(treatmentItems)) {
        return treatmentItems.map((item: any) => item.name || 'Unknown');
      }
      return [];
    } catch (error) {
      console.error('Error parsing treatment items:', error);
      return [];
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Completion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Consultation Completion Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Diagnosis completed</span>
            {isDiagnosisComplete ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Incomplete
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span>Treatment plan created</span>
            {isTreatmentComplete ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Incomplete
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span>Treatment cost estimated</span>
            {hasEstimatedCost ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                {treatmentPricingService.formatPrice(totalAmount)}
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                No cost estimated
              </Badge>
            )}
          </div>

          {!isReadyForPayment && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Complete the following to process checkout:</p>
                  <ul className="mt-1 space-y-1">
                    {!isDiagnosisComplete && <li>• Fill in diagnosis in the Diagnosis tab</li>}
                    {!isTreatmentComplete && <li>• Create treatment plan in the Treatment tab</li>}
                    {!hasEstimatedCost && <li>• Add treatment items with costs in the Treatment tab</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Type Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-800">
            Patient Payment Type: {getPaymentTypeDisplay()}
          </span>
        </div>
        <p className="text-sm text-blue-600 mt-1">
          {isInsurancePatient ? 
            'Insurance claim will be submitted to the insurance provider' : 
            'Direct payment collection required'
          }
        </p>
      </div>

      {/* Admin Access Control Notice */}
      {!isAdmin && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Lock className="h-5 w-5 text-blue-600" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Administrator Access Required</p>
                <p>Only administrators can process payments and insurance claims.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insurance Claim Form or Cash Payment Form */}
      {isAdmin && isReadyForPayment && (
        <>
          {isInsurancePatient ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Insurance Claim Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showInsuranceClaim ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      This patient has {patientInsurance} insurance. Click below to generate and submit an insurance claim form.
                    </p>
                    <Button
                      onClick={() => setShowInsuranceClaim(true)}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Process Insurance Claim
                    </Button>
                  </div>
                ) : (
                  <InsuranceClaimForm
                    patientId={patientId}
                    patientName={patientName}
                    consultationId={consultationData.id || ''}
                    appointmentId={selectedAppointment}
                    insuranceProvider={patientInsurance || ''}
                    treatmentDetails={{
                      diagnosis: consultationData.diagnosis || '',
                      treatment_plan: consultationData.treatmentPlan || '',
                      procedures: getProceduresArray(),
                      total_amount: totalAmount
                    }}
                    onClaimSubmitted={handleInsuranceClaimSubmitted}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Cash Payment Collection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="collectedBy">Collected By</Label>
                    <Input
                      id="collectedBy"
                      placeholder="Staff member name"
                      value={collectedBy}
                      onChange={(e) => setCollectedBy(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="amountPaid">Amount Paid</Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      placeholder="0.00"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Payment notes or comments"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-lg font-semibold">
                      Total Amount: {treatmentPricingService.formatPrice(totalAmount)}
                    </p>
                    {amountPaid && (
                      <p className="text-sm text-gray-600">
                        Amount to pay: {treatmentPricingService.formatPrice(Math.round(parseFloat(amountPaid) * 100))}
                      </p>
                    )}
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleCreatePaymentRecord}
                      disabled={loading || !collectedBy.trim()}
                    >
                      Create Payment Record Only
                    </Button>
                    <Button
                      onClick={handleRecordPayment}
                      disabled={loading || !amountPaid || !collectedBy.trim()}
                      className="flex items-center gap-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      {loading ? 'Processing...' : 'Record Payment & Complete'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Complete without payment option */}
      {isAdmin && (
        <div className="pt-4 border-t">
          <Button
            onClick={handleCompleteWithoutPayment}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Processing...' : 'Complete Consultation Without Payment'}
          </Button>
        </div>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No payment records found</p>
        </CardContent>
      </Card>

      {/* Editable Consultation Fee and Discount Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Payment Adjustments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="discountPercent">Discount (%)</Label>
              <Input
                id="discountPercent"
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={e => setDiscountPercent(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            {/* Treatment breakdown from treatment plan */}
            {parsedTreatments.length > 0 ? (
              <div className="space-y-1 mb-2">
                {parsedTreatments.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    <span>{treatmentPricingService.formatPrice(item.cost)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No treatments added</div>
            )}
            <div className="flex items-center justify-between">
              <span>Treatments Total:</span>
              <span>{treatmentPricingService.formatPrice(treatmentsTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Discount ({discountPercent}%):</span>
              <span>-{treatmentPricingService.formatPrice(Math.round(discountAmount))}</span>
            </div>
            <div className="flex items-center justify-between font-bold border-t pt-2 mt-2">
              <span>Final Total:</span>
              <span className="text-green-600">{treatmentPricingService.formatPrice(finalTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutTab;
