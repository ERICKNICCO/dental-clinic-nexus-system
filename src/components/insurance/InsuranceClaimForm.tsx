
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { FileText, Send } from 'lucide-react';
import DigitalSignaturePad from './DigitalSignaturePad';
import { insuranceClaimService } from '../../services/insuranceClaimService';
import { toast } from 'sonner';

interface InsuranceClaimFormProps {
  patientId: string;
  patientName: string;
  consultationId: string;
  appointmentId?: string;
  insuranceProvider: string;
  treatmentDetails: {
    diagnosis: string;
    treatment_plan: string;
    procedures: string[];
    total_amount: number;
  };
  onClaimSubmitted: () => void;
}

const InsuranceClaimForm: React.FC<InsuranceClaimFormProps> = ({
  patientId,
  patientName,
  consultationId,
  appointmentId,
  insuranceProvider,
  treatmentDetails,
  onClaimSubmitted
}) => {
  const [signature, setSignature] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitClaim = async () => {
    if (!signature.trim()) {
      toast.error('Patient signature is required');
      return;
    }

    setLoading(true);
    try {
      const claimId = await insuranceClaimService.createClaim({
        patient_id: patientId,
        patient_name: patientName,
        consultation_id: consultationId,
        appointment_id: appointmentId,
        insurance_provider: insuranceProvider,
        treatment_details: treatmentDetails,
        patient_signature: signature,
        claim_status: 'draft'
      });

      // Submit the claim
      await insuranceClaimService.submitClaim(claimId);
      
      toast.success('Insurance claim submitted successfully');
      onClaimSubmitted();
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error('Failed to submit insurance claim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {insuranceProvider} Insurance Claim Form
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Patient Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Patient Name</Label>
              <p className="font-medium">{patientName}</p>
            </div>
            <div>
              <Label>Insurance Provider</Label>
              <Badge variant="outline">{insuranceProvider}</Badge>
            </div>
          </div>

          {/* Treatment Details */}
          <div className="space-y-3">
            <div>
              <Label>Diagnosis</Label>
              <p className="text-sm bg-gray-50 p-2 rounded">{treatmentDetails.diagnosis}</p>
            </div>
            <div>
              <Label>Treatment Plan</Label>
              <p className="text-sm bg-gray-50 p-2 rounded">{treatmentDetails.treatment_plan}</p>
            </div>
            <div>
              <Label>Total Amount</Label>
              <p className="font-semibold text-lg">
                {new Intl.NumberFormat('en-TZ', {
                  style: 'decimal',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(treatmentDetails.total_amount)} Tsh
              </p>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Any additional information for the insurance claim..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Digital Signature */}
      <DigitalSignaturePad onSignatureChange={setSignature} />

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmitClaim}
          disabled={loading || !signature}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {loading ? 'Submitting Claim...' : 'Submit Insurance Claim'}
        </Button>
      </div>
    </div>
  );
};

export default InsuranceClaimForm;
