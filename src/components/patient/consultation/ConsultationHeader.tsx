
import React from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Save, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Consultation } from '../../../services/consultationService';

interface ConsultationHeaderProps {
  activeConsultation: Consultation;
  loading: boolean;
  onSaveProgress: () => void;
  onCompleteConsultation: () => void;
}

const ConsultationHeader: React.FC<ConsultationHeaderProps> = ({
  activeConsultation,
  loading,
  onSaveProgress,
  onCompleteConsultation
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              In Progress
            </Badge>
            <span className="text-sm text-muted-foreground">
              Started: {activeConsultation.started_at ? new Date(activeConsultation.started_at).toLocaleTimeString() : 'N/A'}
            </span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onSaveProgress} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Progress
            </Button>
            <Button type="button" onClick={onCompleteConsultation} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Complete Consultation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsultationHeader;
