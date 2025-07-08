
import React from 'react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';

interface VitalSigns {
  bloodPressure?: string;
  temperature?: string;
  heartRate?: string;
  weight?: string;
}

interface VitalsTabProps {
  vitalSigns: VitalSigns;
  onUpdateVitalSigns: (field: string, value: string) => void;
}

const VitalsTab: React.FC<VitalsTabProps> = ({ vitalSigns, onUpdateVitalSigns }) => {
  return (
    <div className="space-y-4 mt-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bloodPressure">Blood Pressure</Label>
          <Input
            id="bloodPressure"
            placeholder="120/80 mmHg"
            value={vitalSigns.bloodPressure || ''}
            onChange={(e) => onUpdateVitalSigns('bloodPressure', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="temperature">Temperature</Label>
          <Input
            id="temperature"
            placeholder="36.5°C"
            value={vitalSigns.temperature || ''}
            onChange={(e) => onUpdateVitalSigns('temperature', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="heartRate">Heart Rate</Label>
          <Input
            id="heartRate"
            placeholder="72 bpm"
            value={vitalSigns.heartRate || ''}
            onChange={(e) => onUpdateVitalSigns('heartRate', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="weight">Weight</Label>
          <Input
            id="weight"
            placeholder="70 kg"
            value={vitalSigns.weight || ''}
            onChange={(e) => onUpdateVitalSigns('weight', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default VitalsTab;
