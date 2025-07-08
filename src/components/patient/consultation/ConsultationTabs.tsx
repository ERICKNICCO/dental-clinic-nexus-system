import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import DiagnosisTab from './DiagnosisTab';
import TreatmentTab from './TreatmentTab';
import FollowUpTab from './FollowUpTab';
import CheckoutTab from './CheckoutTab';
import { ClipboardCheck, Pill, Calendar, CreditCard, Zap, Lock } from 'lucide-react';
import { Consultation } from '../../../types/consultation';
import { useAuth } from '../../../contexts/AuthContext';

interface ConsultationTabsProps {
  currentStep: string;
  onStepChange: (step: string) => void;
  consultationData: Partial<Consultation>;
  onUpdateField: (field: string, value: string) => void;
  patientName: string;
  patientId: string;
  consultationStatus?: string;
  onSendToXRay?: () => void;
  xrayResult?: { images: string[]; note: string; radiologist: string; } | null;
  selectedAppointment?: string;
  patientType?: 'cash' | 'insurance';
  patientInsurance?: string;
}

const ConsultationTabs: React.FC<ConsultationTabsProps> = ({
  currentStep,
  onStepChange,
  consultationData,
  onUpdateField,
  patientName,
  patientId,
  consultationStatus,
  onSendToXRay,
  xrayResult,
  selectedAppointment,
  patientType,
  patientInsurance
}) => {
  const { userProfile } = useAuth();
  const [diagnosisType, setDiagnosisType] = useState<'clinical' | 'xray'>(
    consultationData.diagnosisType || 'clinical'
  );

  const isAdmin = userProfile?.role === 'admin';

  const handlePaymentComplete = () => {
    // Could trigger appointment completion here
    console.log('Payment completed for patient:', patientName);
  };

  const handleDiagnosisTypeChange = (type: 'clinical' | 'xray') => {
    if (isAdmin) return; // Admins can't change diagnosis type
    setDiagnosisType(type);
    onUpdateField('diagnosisType', type);
  };

  // Create a safe consultation data object for CheckoutTab
  const safeConsultationData: Consultation = {
    id: consultationData.id || '',
    patientId: consultationData.patientId || patientId,
    doctorId: consultationData.doctorId || '',
    doctorName: consultationData.doctorName || '',
    status: consultationData.status || 'in-progress',
    symptoms: consultationData.symptoms || '',
    examination: consultationData.examination || '',
    vitalSigns: consultationData.vitalSigns || {},
    diagnosis: consultationData.diagnosis || '',
    diagnosisType: consultationData.diagnosisType || 'clinical',
    treatmentPlan: consultationData.treatmentPlan || '',
    prescriptions: consultationData.prescriptions || '',
    followUpInstructions: consultationData.followUpInstructions || '',
    nextAppointment: consultationData.nextAppointment,
    estimatedCost: consultationData.estimatedCost,
    treatmentItems: consultationData.treatmentItems || [],
    startedAt: consultationData.startedAt || new Date(),
    completedAt: consultationData.completedAt,
    createdAt: consultationData.createdAt || new Date(),
    updatedAt: consultationData.updatedAt || new Date(),
    xrayResult: consultationData.xrayResult
  };

  // Admin-restricted content component
  const AdminRestrictedContent = ({ children, tabName }: { children: React.ReactNode, tabName: string }) => {
    if (isAdmin) {
      return (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <Lock className="h-4 w-4" />
              <span className="font-medium">Admin Access Restricted</span>
            </div>
            <p className="text-sm text-yellow-700">
              {tabName} information can only be modified by doctors. You can view completed consultation data in read-only mode.
            </p>
            {/* Show read-only data if available */}
            <div className="mt-4 space-y-4">
              {tabName === 'Diagnosis' && consultationData.diagnosis && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Diagnosis (Read Only)</label>
                  <div className="mt-1 p-3 bg-white border rounded-md text-sm">
                    {consultationData.diagnosis}
                  </div>
                </div>
              )}
              {tabName === 'Treatment' && (consultationData.treatmentPlan || consultationData.prescriptions) && (
                <div className="space-y-3">
                  {consultationData.treatmentPlan && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Treatment Plan (Read Only)</label>
                      <div className="mt-1 p-3 bg-white border rounded-md text-sm">
                        {consultationData.treatmentPlan}
                      </div>
                    </div>
                  )}
                  {consultationData.prescriptions && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Prescriptions (Read Only)</label>
                      <div className="mt-1 p-3 bg-white border rounded-md text-sm">
                        {consultationData.prescriptions}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }
    return <>{children}</>;
  };

  return (
    <div className="space-y-6">
      {/* X-ray Status Display */}
      {consultationStatus === "waiting-xray" && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Zap className="h-5 w-5" />
              X-ray Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Waiting for X-ray results
            </Badge>
            <p className="text-sm text-orange-700 mt-2">
              Patient has been sent to X-ray room. Results will appear here once available.
            </p>
          </CardContent>
        </Card>
      )}

      {consultationStatus === "xray-done" && xrayResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Zap className="h-5 w-5" />
              X-ray Results Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-green-600 border-green-300">
              X-ray completed
            </Badge>
            <p className="text-sm text-green-700 mt-2">
              X-ray results are now available. Please review them in the diagnosis tab.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={currentStep} onValueChange={onStepChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diagnosis" className="flex items-center gap-1">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Diagnosis</span>
            {isAdmin && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="treatment" className="flex items-center gap-1">
            <Pill className="h-4 w-4" />
            <span className="hidden sm:inline">Treatment</span>
            {isAdmin && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="followup" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Follow-up</span>
            {isAdmin && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="checkout" className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Checkout</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis">
          <AdminRestrictedContent tabName="Diagnosis">
            <DiagnosisTab
              diagnosis={consultationData.diagnosis || ''}
              onChange={(value) => onUpdateField('diagnosis', value)}
              diagnosisType={diagnosisType}
              onDiagnosisTypeChange={handleDiagnosisTypeChange}
              consultationStatus={consultationStatus}
              xrayResult={xrayResult}
              onSendToXRay={onSendToXRay}
            />
          </AdminRestrictedContent>
        </TabsContent>

        <TabsContent value="treatment">
          <AdminRestrictedContent tabName="Treatment">
            <TreatmentTab
              treatmentPlan={consultationData.treatmentPlan || ''}
              prescriptions={consultationData.prescriptions || ''}
              onUpdateField={onUpdateField}
              patientType={patientType}
              patientInsurance={patientInsurance}
            />
          </AdminRestrictedContent>
        </TabsContent>

        <TabsContent value="followup">
          <FollowUpTab
            followUpInstructions={consultationData.followUpInstructions || ''}
            nextAppointment={consultationData.nextAppointment || ''}
            onUpdateField={onUpdateField}
            patientName={patientName}
            patientId={patientId}
          />
        </TabsContent>

        <TabsContent value="checkout">
          <CheckoutTab
            patientId={patientId}
            patientName={patientName}
            consultationData={safeConsultationData}
            onPaymentComplete={handlePaymentComplete}
            selectedAppointment={selectedAppointment || ''}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsultationTabs;
