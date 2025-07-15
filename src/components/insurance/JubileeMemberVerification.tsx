import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CheckCircle, XCircle, User, Phone, Building, Calendar } from 'lucide-react';
import { jubileeInsuranceService, JubileeMemberDetails, JubileeVerificationResponse } from '../../services/jubileeInsuranceService';

interface JubileeMemberVerificationProps {
  onMemberVerified?: (memberData: any) => void;
  initialMemberNo?: string;
}

const JubileeMemberVerification: React.FC<JubileeMemberVerificationProps> = ({
  onMemberVerified,
  initialMemberNo = ''
}) => {
  const [memberNo, setMemberNo] = useState(initialMemberNo);
  const [loading, setLoading] = useState(false);
  const [memberDetails, setMemberDetails] = useState<JubileeMemberDetails | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<JubileeVerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyMember = async () => {
    if (!memberNo || memberNo.length !== 15) {
      setError('Please enter a valid 15-digit member number');
      return;
    }

    setLoading(true);
    setError(null);
    setMemberDetails(null);
    setVerificationStatus(null);

    try {
      // First get member details
      const detailsResponse = await jubileeInsuranceService.getMemberDetails(memberNo);
      
      if (detailsResponse.Status === 'ERROR') {
        setError(typeof detailsResponse.Description === 'string' ? detailsResponse.Description : 'Failed to get member details');
        return;
      }

      setMemberDetails(detailsResponse);

      // Then check verification status
      const verificationResponse = await jubileeInsuranceService.checkMemberVerification(memberNo);
      setVerificationStatus(verificationResponse);

      // Call callback if member is verified
      if (verificationResponse.Status === 'OK' && onMemberVerified) {
        onMemberVerified({
          memberDetails: detailsResponse.Description,
          verification: verificationResponse,
        });
      }

    } catch (err) {
      console.error('Jubilee verification error:', err);
      setError('Failed to verify member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-orange-600" />
          Jubilee Insurance Member Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="memberNo">Member Number (15 digits)</Label>
            <Input
              id="memberNo"
              value={memberNo}
              onChange={(e) => setMemberNo(e.target.value)}
              placeholder="Enter 15-digit member number"
              maxLength={15}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleVerifyMember}
              disabled={loading || !memberNo}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
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

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {memberDetails && memberDetails.Status === 'OK' && typeof memberDetails.Description === 'object' && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Member Found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Name:</span>
                  <span>{memberDetails.Description.MemberName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Phone:</span>
                  <span>{memberDetails.Description.Phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Company:</span>
                  <span>{memberDetails.Description.Company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">DOB:</span>
                  <span>{memberDetails.Description.Dob}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge 
                  variant={memberDetails.Description.ActiveStatus === 'Active' ? 'default' : 'destructive'}
                  className={memberDetails.Description.ActiveStatus === 'Active' ? 'bg-green-100 text-green-800' : ''}
                >
                  {memberDetails.Description.ActiveStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {verificationStatus && (
          <Card className={verificationStatus.Status === 'OK' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {verificationStatus.Status === 'OK' ? (
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {verificationStatus.Status === 'OK' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="font-medium">Authorization No:</span>
                      <span className="ml-2">{verificationStatus.AuthorizationNo}</span>
                    </div>
                    <div>
                      <span className="font-medium">Daily Limit:</span>
                      <span className="ml-2 font-bold text-green-600">
                        {verificationStatus.DailLimit?.toLocaleString()} Tsh
                      </span>
                    </div>
                  </div>
                  
                  {verificationStatus.Benefits && verificationStatus.Benefits.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Available Benefits:</h4>
                      <div className="space-y-2">
                        {verificationStatus.Benefits.map((benefit, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                            <span className="text-sm">{benefit.BenefitName}</span>
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              {benefit.BenefitBalance}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Member is verified and eligible for services. {verificationStatus.Description}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {verificationStatus.Description}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default JubileeMemberVerification;