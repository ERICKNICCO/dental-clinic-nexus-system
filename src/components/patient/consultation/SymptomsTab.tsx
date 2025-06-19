
import React from 'react';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

interface SymptomsTabProps {
  symptoms: string;
  onChange: (value: string) => void;
}

const SymptomsTab: React.FC<SymptomsTabProps> = ({ symptoms, onChange }) => {
  return (
    <div className="space-y-4 mt-6">
      <div>
        <Label htmlFor="symptoms">Chief Complaint & Symptoms</Label>
        <Textarea
          id="symptoms"
          placeholder="Describe the patient's main complaint and symptoms..."
          value={symptoms}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
        />
      </div>
    </div>
  );
};

export default SymptomsTab;
