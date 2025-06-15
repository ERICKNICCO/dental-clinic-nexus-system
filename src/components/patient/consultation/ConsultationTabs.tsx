
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import SymptomsTab from './SymptomsTab';
import ExaminationTab from './ExaminationTab';
import VitalsTab from './VitalsTab';
import DiagnosisTab from './DiagnosisTab';
import TreatmentTab from './TreatmentTab';
import FollowUpTab from './FollowUpTab';
import CheckoutTab from './CheckoutTab';
import { Stethoscope, FileText, Activity, ClipboardCheck, Pill, Calendar, CreditCard, Zap } from 'lucide-react';

interface ConsultationTabsProps {
  currentStep: string;
  onStepChange: (step: string) => void;
  consultationData: any;
  onUpdateField: (field: string, value: string) => void;
  onUpdateVitalSigns: (field: string, value: string) => void;
  patientName: string;
  patientId: string;
  consultationStatus?: string;
  onSendToXRay?: () => void;
  xrayResult?: any;
}

const ConsultationTabs: React.FC<ConsultationTabsProps> = ({
  currentStep,
  onStepChange,
  consultationData,
  onUpdateField,
  onUpdateVitalSigns,
  patientName,
  patientId,
  consultationStatus,
  onSendToXRay,
  xrayResult
}) => {
  const handlePaymentComplete = () => {
    // Could trigger appointment completion here
    console.log('Payment completed for patient:', patientName);
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="symptoms" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Symptoms</span>
          </TabsTrigger>
          <TabsTrigger value="examination" className="flex items-center gap-1">
            <Stethoscope className="h-4 w-4" />
            <span className="hidden sm:inline">Exam</span>
          </TabsTrigger>
          <TabsTrigger value="vitals" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Vitals</span>
          </TabsTrigger>
          <TabsTrigger value="diagnosis" className="flex items-center gap-1">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Diagnosis</span>
          </TabsTrigger>
          <TabsTrigger value="treatment" className="flex items-center gap-1">
            <Pill className="h-4 w-4" />
            <span className="hidden sm:inline">Treatment</span>
          </TabsTrigger>
          <TabsTrigger value="followup" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Follow-up</span>
          </TabsTrigger>
          <TabsTrigger value="checkout" className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Checkout</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="symptoms">
          <SymptomsTab
            symptoms={consultationData.symptoms || ''}
            onChange={(value) => onUpdateField('symptoms', value)}
          />
        </TabsContent>

        <TabsContent value="examination">
          <ExaminationTab
            examination={consultationData.examination || ''}
            onChange={(value) => onUpdateField('examination', value)}
          />
        </TabsContent>

        <TabsContent value="vitals">
          <VitalsTab
            vitalSigns={consultationData.vitalSigns || {}}
            onUpdateVitalSigns={onUpdateVitalSigns}
          />
        </TabsContent>

        <TabsContent value="diagnosis">
          <DiagnosisTab
            diagnosis={consultationData.diagnosis || ''}
            onChange={(value) => onUpdateField('diagnosis', value)}
            xrayResult={xrayResult}
          />
        </TabsContent>

        <TabsContent value="treatment">
          <TreatmentTab
            treatmentPlan={consultationData.treatmentPlan || ''}
            prescriptions={consultationData.prescriptions || ''}
            onUpdateField={onUpdateField}
          />
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
            consultationData={consultationData}
            onPaymentComplete={handlePaymentComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsultationTabs;
