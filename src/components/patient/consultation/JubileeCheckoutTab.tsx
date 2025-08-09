import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { useToast } from '../../ui/use-toast';
import { 
  CreditCard, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Calculator,
  Receipt,
  Users 
} from 'lucide-react';
import { Consultation } from '../../../types/consultation';
import { copaymentService, CopaymentCalculation } from '../../../services/copaymentService';
import { jubileeInsuranceService } from '../../../services/jubileeInsuranceService';
import JubileeMemberVerification from '../../insurance/JubileeMemberVerification';

interface JubileeCheckoutTabProps {
  consultation: Consultation;
  patientType: string;
  patientInsurance: string;
  onPaymentComplete: (paymentData: any) => void;
}

const JubileeCheckoutTab: React.FC<JubileeCheckoutTabProps> = ({
  consultation,
  patientType,
  patientInsurance,
  onPaymentComplete
}) => {
  const [memberVerification, setMemberVerification] = useState<any>(null);
  const [copaymentCalculation, setCopaymentCalculation] = useState<CopaymentCalculation | null>(null);
  const [isProcessingClaim, setIsProcessingClaim] = useState(false);
  const [authorizationNumber, setAuthorizationNumber] = useState('');
  const [step, setStep] = useState<'verify' | 'calculate' | 'authorize' | 'payment'>('verify');
  const { toast } = useToast();

  const treatments = consultation.treatment_items || [];
  const totalAmount = consultation.estimated_cost || 0;

  useEffect(() => {
    if (memberVerification?.isValid && treatments.length > 0) {
      const calculation = copaymentService.calculateCopayment(
        treatments.map(item => ({ ...item, quantity: 1 })),
        'JUBILEE',
        {
          copaymentPercentage: memberVerification.benefits?.copaymentPercentage || 10,
          deductible: memberVerification.benefits?.deductible || 5000
        }
      );
      setCopaymentCalculation(calculation);
      setStep('calculate');
    }
  }, [memberVerification, treatments]);

  const handleMemberVerification = (verification: any) => {
    setMemberVerification(verification);
    if (verification?.isValid) {
      setStep('calculate');
    }
  };

  const handleGetAuthorization = async () => {
    if (!memberVerification?.isValid || !treatments.length) {
      toast({
        title: "Error",
        description: "Member verification required",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingClaim(true);
    try {
      const authRequest = {
        memberNumber: memberVerification.memberDetails.memberNumber,
        treatments: treatments.map(t => ({
          code: `JUB_${t.name.replace(/\s+/g, '_').toUpperCase()}`,
          name: t.name,
          amount: t.cost,
          quantity: 1
        })),
        providerDetails: {
          name: 'SD Dental Clinic',
          registrationNumber: 'SDC001'
        }
      };

      const authResponse = await jubileeInsuranceService.getTreatmentAuthorization(authRequest);
      
      if (authResponse.isApproved) {
        setAuthorizationNumber(authResponse.authorizationNumber || '');
        setStep('authorize');
        toast({
          title: "Authorization Approved",
          description: `Authorization number: ${authResponse.authorizationNumber}`,
        });
      } else {
        toast({
          title: "Authorization Denied",
          description: "Jubilee insurance authorization was denied",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error getting Jubilee authorization:', error);
      toast({
        title: "Error",
        description: "Failed to get authorization from Jubilee",
        variant: "destructive"
      });
    } finally {
      setIsProcessingClaim(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!authorizationNumber || !memberVerification) {
      toast({
        title: "Error",
        description: "Authorization required before submitting claim",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingClaim(true);
    try {
      const claimData = {
        memberNumber: memberVerification.memberDetails.memberNumber,
        authorizationNumber,
        treatments: treatments.map(t => ({
          code: `JUB_${t.name.replace(/\s+/g, '_').toUpperCase()}`,
          name: t.name,
          amount: t.cost,
          date: new Date().toISOString()
        })),
        receipts: [], // Would include actual receipt files
        invoiceNumber: `INV-${Date.now()}`
      };

      const claimResponse = await jubileeInsuranceService.submitClaim(claimData);
      
      const paymentData = {
        totalAmount,
        insuranceCovered: copaymentCalculation?.insuranceCovered || 0,
        patientCopayment: copaymentCalculation?.patientCopayment || totalAmount,
        claimNumber: claimResponse.claimNumber,
        authorizationNumber,
        insuranceProvider: 'JUBILEE'
      };

      onPaymentComplete(paymentData);
      setStep('payment');

      toast({
        title: "Claim Submitted",
        description: `Claim number: ${claimResponse.claimNumber}`,
      });
    } catch (error) {
      console.error('Error submitting Jubilee claim:', error);
      toast({
        title: "Error",
        description: "Failed to submit claim to Jubilee",
        variant: "destructive"
      });
    } finally {
      setIsProcessingClaim(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' Tsh';
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {['verify', 'calculate', 'authorize', 'payment'].map((stepName, index) => (
          <div key={stepName} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === stepName ? 'bg-orange-600 text-white' : 
              ['verify', 'calculate', 'authorize', 'payment'].indexOf(step) > index ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {['verify', 'calculate', 'authorize', 'payment'].indexOf(step) > index ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < 3 && (
              <div className={`w-16 h-1 mx-2 ${
                ['verify', 'calculate', 'authorize', 'payment'].indexOf(step) > index ? 'bg-green-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Member Verification */}
      {step === 'verify' && (
        <JubileeMemberVerification
          onVerificationComplete={handleMemberVerification}
          patientName={consultation.patient_id} // Would need patient name from context
          patientDob=""
          patientId=""
        />
      )}

      {/* Step 2: Copayment Calculation */}
      {(step === 'calculate' || step === 'authorize' || step === 'payment') && copaymentCalculation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Jubilee Insurance Copayment Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(copaymentCalculation.breakdown.subtotal)}</span>
                </div>
                {copaymentCalculation.deductibleAmount && copaymentCalculation.deductibleAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Deductible:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(copaymentCalculation.deductibleAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Jubilee Coverage:</span>
                  <span className="font-medium text-green-600">{formatCurrency(copaymentCalculation.breakdown.insuranceAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Your Copayment ({copaymentCalculation.copaymentPercentage}%):</span>
                  <span className="font-medium text-red-600">{formatCurrency(copaymentCalculation.breakdown.copaymentAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total You Pay:</span>
                  <span>{formatCurrency(copaymentCalculation.breakdown.patientOwes)}</span>
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Amount You Pay</div>
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(copaymentCalculation.patientCopayment)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Includes deductible + copayment
                  </div>
                </div>
              </div>
            </div>

            {step === 'calculate' && (
              <div className="pt-4">
                <Button 
                  onClick={handleGetAuthorization}
                  disabled={isProcessingClaim}
                  className="w-full"
                >
                  {isProcessingClaim ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Authorization...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Get Jubilee Authorization
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Authorization */}
      {(step === 'authorize' || step === 'payment') && authorizationNumber && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Authorization Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">Treatment Authorized</div>
                  <div className="text-sm text-green-600">Authorization #: {authorizationNumber}</div>
                </div>
              </div>
            </div>

            {memberVerification?.memberDetails?.dependents && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Family Coverage</span>
                </div>
                <div className="text-xs text-blue-600">
                  This authorization covers the primary member and {memberVerification.memberDetails.dependents.length} dependents
                </div>
              </div>
            )}

            {step === 'authorize' && (
              <Button 
                onClick={handleSubmitClaim}
                disabled={isProcessingClaim}
                className="w-full"
              >
                {isProcessingClaim ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Claim...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-4 w-4" />
                    Submit Claim to Jubilee
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Payment */}
      {step === 'payment' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Collect Patient Copayment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold">Patient Copayment</div>
                <div className="text-3xl font-bold text-orange-600">
                  {formatCurrency(copaymentCalculation?.patientCopayment || 0)}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Jubilee insurance covers {formatCurrency(copaymentCalculation?.insuranceCovered || 0)}
                </div>
                {copaymentCalculation?.deductibleAmount && (
                  <div className="text-xs text-gray-500">
                    (Includes {formatCurrency(copaymentCalculation.deductibleAmount)} deductible)
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <select className="w-full p-2 border rounded">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile">Mobile Money</option>
                </select>
              </div>
              <div>
                <Label htmlFor="amountReceived">Amount Received</Label>
                <Input
                  id="amountReceived"
                  type="number"
                  placeholder="0"
                />
              </div>
            </div>

            <Button className="w-full">
              <CreditCard className="mr-2 h-4 w-4" />
              Complete Payment Collection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default JubileeCheckoutTab;