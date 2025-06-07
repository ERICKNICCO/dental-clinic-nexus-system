
import React from 'react';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

interface DiagnosisTabProps {
  diagnosis: string;
  onChange: (value: string) => void;
}

const DiagnosisTab: React.FC<DiagnosisTabProps> = ({ diagnosis, onChange }) => {
  return (
    <div className="space-y-4 mt-6">
      <div>
        <Label htmlFor="diagnosis">Diagnosis</Label>
        <Textarea
          id="diagnosis"
          placeholder="Primary and secondary diagnoses..."
          value={diagnosis}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
};

export default DiagnosisTab;
