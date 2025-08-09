import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { gaInsuranceService, GAVerificationResponse } from '../../services/gaInsuranceService';
import { useToast } from '../ui/use-toast';

interface GAMemberVerificationProps {
  onVerificationComplete: (verification: GAVerificationResponse | null) => void;
  patientName?: string;
  patientDob?: string;
  patientId?: string;
}

const GAMemberVerification: React.FC<GAMemberVerificationProps> = ({
  onVerificationComplete,
  patientName = '',
  patientDob = '',
  patientId = ''
}) => {
  const [memberNumber, setMemberNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verification, setVerification] = useState<GAVerificationResponse | null>(null);
  const { toast } = useToast();

  const handleVerifyMember = async () => {
    if (!memberNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a GA member number",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    try {
      const result = await gaInsuranceService.verifyMember({
        memberNumber: memberNumber.trim(),
        patientDetails: {
          name: patientName,
          dateOfBirth: patientDob,
          idNumber: patientId
        }
      });

      setVerification(result);
      onVerificationComplete(result);

      if (result.isValid) {
        toast({
          title: "Success",
          description: "GA member verification successful",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Member not found or inactive",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying GA member:', error);
      toast({
        title: "Error",
        description: "Failed to verify GA member. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' Tsh';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">GA</span>
          </div>
          GA Insurance Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="memberNumber">GA Member Number</Label>
            <Input
              id="memberNumber"
              placeholder="Enter GA member number (e.g., GA12345678)"
              value={memberNumber}
              onChange={(e) => setMemberNumber(e.target.value)}
              disabled={isVerifying}
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleVerifyMember}
              disabled={isVerifying || !memberNumber.trim()}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Member'
              )}
            </Button>
          </div>
        </div>

        {verification && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              {verification.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-semibold ${verification.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {verification.isValid ? 'Verification Successful' : 'Verification Failed'}
              </span>
            </div>

            {verification.isValid && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Member Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium">{verification.memberDetails.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Member #:</span>
                      <span className="text-sm font-medium">{verification.memberDetails.memberNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Scheme:</span>
                      <span className="text-sm font-medium">{verification.memberDetails.scheme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className={getStatusColor(verification.memberDetails.status)}>
                        {verification.memberDetails.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Benefit Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dental Coverage:</span>
                      <Badge className={verification.benefits.dentalCoverage ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {verification.benefits.dentalCoverage ? 'Covered' : 'Not Covered'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Annual Limit:</span>
                      <span className="text-sm font-medium">{formatCurrency(verification.benefits.annualLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Used Amount:</span>
                      <span className="text-sm font-medium">{formatCurrency(verification.benefits.usedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Remaining:</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(verification.benefits.remainingAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Copayment:</span>
                      <span className="text-sm font-medium">{verification.benefits.copaymentPercentage}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {verification.error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">{verification.error}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GAMemberVerification;