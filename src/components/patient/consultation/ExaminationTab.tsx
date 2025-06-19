
import React from 'react';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

interface ExaminationTabProps {
  examination: string;
  onChange: (value: string) => void;
}

const ExaminationTab: React.FC<ExaminationTabProps> = ({ examination, onChange }) => {
  return (
    <div className="space-y-4 mt-6">
      <div>
        <Label htmlFor="examination">Physical Examination</Label>
        <Textarea
          id="examination"
          placeholder="Record your physical examination findings..."
          value={examination}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
        />
      </div>
    </div>
  );
};

export default ExaminationTab;
