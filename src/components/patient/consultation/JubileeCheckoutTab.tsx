import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Loader2, CheckCircle, XCircle, DollarSign, FileText } from 'lucide-react';
import { jubileeInsuranceService } from '../../../services/jubileeInsuranceService';
import TreatmentCostDisplay from './TreatmentCostDisplay';

interface JubileeCheckoutTabProps {
  memberNo: string;
  authorizationNo?: string;
  selectedTreatments: any[];
  totalAmount: number;
  onPreAuthRequired: (required: boolean) => void;
  onItemsVerified: (verified: boolean) => void;
}

const JubileeCheckoutTab: React.FC<JubileeCheckoutTabProps> = ({
  memberNo,
  authorizationNo,
  selectedTreatments,
  totalAmount,
  onPreAuthRequired,
  onItemsVerified
}) => {
  const [verifyingItems, setVerifyingItems] = useState(false);
  const [itemsVerification, setItemsVerification] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestingPreAuth, setRequestingPreAuth] = useState(false);
  const [preAuthStatus, setPreAuthStatus] = useState<any>(null);

  const handleVerifyItems = async () => {
    if (!memberNo || selectedTreatments.length === 0) {
      setError('Member number and treatments are required');
      return;
    }

    setVerifyingItems(true);
    setError(null);

    try {
      const verifyPayload = {
        BenefitCode: '7927', // Default benefit code for outpatient
        MemberNo: memberNo,
        VerifyItems: selectedTreatments.map(treatment => ({
          ItemId: treatment.id,
          ItemQuantity: '1',
          ItemPrice: treatment.basePrice.toString()
        })),
        Amount: totalAmount.toString(),
        Procedured: 'JIC0333' // Default procedure code
      };

      const response = await jubileeInsuranceService.verifyItems(verifyPayload);
      setItemsVerification(response);
      
      if (response.Status === 'OK') {
        onItemsVerified(true);
        // Check if pre-authorization is needed for dental/optical
        const needsPreAuth = selectedTreatments.some(t => 
          t.category?.toLowerCase().includes('dental') || 
          t.category?.toLowerCase().includes('optical')
        );
        onPreAuthRequired(needsPreAuth);
      } else {
        onItemsVerified(false);
        setError(response.Description);
      }

    } catch (err) {
      console.error('Items verification error:', err);
      setError('Failed to verify items. Please try again.');
      onItemsVerified(false);
    } finally {
      setVerifyingItems(false);
    }
  };

  const handleRequestPreAuth = async () => {
    if (!memberNo || !authorizationNo) {
      setError('Member number and authorization number are required for pre-authorization');
      return;
    }

    setRequestingPreAuth(true);
    setError(null);

    try {
      const preAuthPayload = {
        entities: [{
          ClaimYear: new Date().getFullYear().toString(),
          ClaimMonth: (new Date().getMonth() + 1).toString().padStart(2, '0'),
          CardNo: memberNo,
          FirstName: selectedTreatments[0]?.patientName?.split(' ')[0] || 'Patient',
          LastName: selectedTreatments[0]?.patientName?.split(' ').slice(1).join(' ') || 'Name',
          Gender: 'Male', // This should come from patient data
          DateOfBirth: '1990-01-01', // This should come from patient data
          Age: '34', // This should be calculated
          TelephoneNo: '0700000000', // This should come from patient data
          PatientFileNo: 'PAT001', // This should come from patient data
          AuthorizationNo: authorizationNo,
          AttendanceDate: new Date().toISOString().split('T')[0],
          PatientTypeCode: 'OP',
          DateAdmitted: null,
          DateDischarged: null,
          PractitionerNo: 'DENT001', // This should come from doctor data
          CreatedBy: 'Dental System',
          DateCreated: new Date().toISOString().split('T')[0],
          LastModifiedBy: 'Dental System',
          LastModified: new Date().toISOString().split('T')[0],
          FolioDiseases: [{
            DiseaseCode: 'K02', // Dental caries code
            Remarks: null,
            CreatedBy: 'Dental System',
            DateCreated: new Date().toISOString().split('T')[0],
            LastModifiedBy: 'Dental System',
            LastModified: new Date().toISOString().split('T')[0]
          }],
          FolioItems: selectedTreatments.map(treatment => ({
            ItemCode: treatment.id,
            ItemQuantity: '1',
            UnitPrice: treatment.basePrice.toString(),
            AmountClaimed: treatment.basePrice.toString(),
            CreatedBy: 'Dental System',
            DateCreated: new Date().toISOString().split('T')[0],
            LastModifiedBy: 'Dental System',
            LastModified: new Date().toISOString().split('T')[0]
          })),
          QualificationID: '1',
          AmountClaimed: totalAmount,
          jubileeProcedure: 'JIC0333',
          jubileeBenefits: '7927',
          BillNo: `BILL${Date.now()}`,
          ProviderID: '123456' // This should come from provider configuration
        }]
      };

      const response = await jubileeInsuranceService.requestPreauthorization(preAuthPayload);
      setPreAuthStatus(response);
      
      if (response.Status === 'OK') {
        // Pre-authorization successful
        onPreAuthRequired(false);
      } else {
        setError(response.Description);
      }

    } catch (err) {
      console.error('Pre-authorization error:', err);
      setError('Failed to request pre-authorization. Please try again.');
    } finally {
      setRequestingPreAuth(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            Jubilee Insurance Checkout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Member Number:</span>
              <span className="ml-2">{memberNo}</span>
            </div>
            {authorizationNo && (
              <div>
                <span className="font-medium">Authorization No:</span>
                <span className="ml-2">{authorizationNo}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Selected Treatments:</h4>
            {selectedTreatments.length === 0 ? (
              <p className="text-gray-500 text-sm">No treatments selected</p>
            ) : (
              <div className="space-y-2">
                {selectedTreatments.map((treatment, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                    <span className="text-sm">{treatment.name}</span>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {treatment.basePrice} Tsh
                    </Badge>
                  </div>
                ))}
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded border border-orange-200 font-medium">
                  <span>Total Amount:</span>
                  <span className="text-orange-600 font-bold">{totalAmount.toLocaleString()} Tsh</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleVerifyItems}
              disabled={verifyingItems || selectedTreatments.length === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {verifyingItems ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Items with Jubilee'
              )}
            </Button>

            {itemsVerification?.Status === 'OK' && (
              <Button
                onClick={handleRequestPreAuth}
                disabled={requestingPreAuth}
                variant="outline"
                className="border-orange-600 text-orange-600 hover:bg-orange-50"
              >
                {requestingPreAuth ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Request Pre-Authorization
                  </>
                )}
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {itemsVerification && (
            <Card className={itemsVerification.Status === 'OK' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {itemsVerification.Status === 'OK' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Items Verification Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                {itemsVerification.Status === 'OK' ? (
                  <div className="space-y-3">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        All items have been verified and are covered by the member's benefits.
                      </AlertDescription>
                    </Alert>
                    
                    {itemsVerification.VerifiedItems && (
                      <div>
                        <h4 className="font-medium mb-2">Verified Items:</h4>
                        <div className="space-y-2">
                          {itemsVerification.VerifiedItems.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                              <span className="text-sm">{item.ItemName}</span>
                              <Badge variant="outline" className="text-green-700 border-green-300">
                                {item.ItemAmount} Tsh
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      {itemsVerification.Description}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {preAuthStatus && (
            <Card className={preAuthStatus.Status === 'OK' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {preAuthStatus.Status === 'OK' ? (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Pre-Authorization Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                {preAuthStatus.Status === 'OK' ? (
                  <div className="space-y-3">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Pre-authorization has been successfully submitted. Submission ID: {preAuthStatus.SubmissionID}
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      {preAuthStatus.Description}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JubileeCheckoutTab;