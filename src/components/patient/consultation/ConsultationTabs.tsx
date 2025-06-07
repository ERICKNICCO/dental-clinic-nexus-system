
import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  Stethoscope,
  FileText,
  Pill,
  Calendar
} from 'lucide-react';
import ExaminationTab from './ExaminationTab';
import DiagnosisTab from './DiagnosisTab';
import TreatmentTab from './TreatmentTab';
import FollowUpTab from './FollowUpTab';
import { Consultation } from '../../../services/consultationService';

interface ConsultationTabsProps {
  currentStep: string;
  onStepChange: (step: string) => void;
  consultationData: Partial<Consultation>;
  onUpdateField: (field: string, value: string) => void;
  onUpdateVitalSigns: (field: string, value: string) => void;
  patientName: string;
  patientId: string;
}

const ConsultationTabs: React.FC<ConsultationTabsProps> = ({
  currentStep,
  onStepChange,
  consultationData,
  onUpdateField,
  onUpdateVitalSigns,
  patientName,
  patientId
}) => {
  return (
    <div className="w-full">
      <Tabs value={currentStep} onValueChange={onStepChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="examination" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span>Examination</span>
          </TabsTrigger>
          <TabsTrigger value="diagnosis" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Diagnosis</span>
          </TabsTrigger>
          <TabsTrigger value="treatment" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            <span>Treatment</span>
          </TabsTrigger>
          <TabsTrigger value="followup" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Follow-up</span>
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="p-6">
            <TabsContent value="examination" className="mt-0">
              <ExaminationTab
                examination={consultationData.examination || ''}
                onChange={(value) => onUpdateField('examination', value)}
              />
            </TabsContent>

            <TabsContent value="diagnosis" className="mt-0">
              <DiagnosisTab
                diagnosis={consultationData.diagnosis || ''}
                onChange={(value) => onUpdateField('diagnosis', value)}
              />
            </TabsContent>

            <TabsContent value="treatment" className="mt-0">
              <TreatmentTab
                treatmentPlan={consultationData.treatmentPlan || ''}
                prescriptions={consultationData.prescriptions || ''}
                onUpdateField={onUpdateField}
              />
            </TabsContent>

            <TabsContent value="followup" className="mt-0">
              <FollowUpTab
                followUpInstructions={consultationData.followUpInstructions || ''}
                nextAppointment={consultationData.nextAppointment || ''}
                onUpdateField={onUpdateField}
                patientName={patientName}
                patientId={patientId}
              />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default ConsultationTabs;
