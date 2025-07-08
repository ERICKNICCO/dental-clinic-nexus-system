
import React from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Play, User } from 'lucide-react';

interface StartConsultationProps {
  patientName: string;
  loading: boolean;
  onStartConsultation: () => void;
}

const StartConsultation: React.FC<StartConsultationProps> = ({
  patientName,
  loading,
  onStartConsultation
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Start Consultation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ready to see {patientName}?</h3>
          <p className="text-muted-foreground mb-6">
            Start a consultation to guide you through the examination, diagnosis, and treatment process.
          </p>
          <Button onClick={onStartConsultation} disabled={loading} size="lg">
            <Play className="h-4 w-4 mr-2" />
            Start Consultation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StartConsultation;
