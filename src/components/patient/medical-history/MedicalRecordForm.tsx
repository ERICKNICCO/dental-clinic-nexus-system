
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Save, X } from 'lucide-react';

interface MedicalRecordFormData {
  date: string;
  condition: string;
  description: string;
  treatment: string;
}

interface MedicalRecordFormProps {
  formData: MedicalRecordFormData;
  onFormDataChange: (data: MedicalRecordFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  title: string;
}

const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({
  formData,
  onFormDataChange,
  onSave,
  onCancel,
  title
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="record-date">Date</Label>
            <Input 
              id="record-date" 
              type="date" 
              value={formData.date}
              onChange={(e) => onFormDataChange({...formData, date: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="record-condition">Condition</Label>
            <Input 
              id="record-condition" 
              placeholder="Enter condition"
              value={formData.condition}
              onChange={(e) => onFormDataChange({...formData, condition: e.target.value})}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="record-description">Description</Label>
          <Textarea 
            id="record-description" 
            placeholder="Describe the condition..."
            value={formData.description}
            onChange={(e) => onFormDataChange({...formData, description: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="record-treatment">Treatment</Label>
          <Textarea 
            id="record-treatment" 
            placeholder="Describe the treatment..."
            value={formData.treatment}
            onChange={(e) => onFormDataChange({...formData, treatment: e.target.value})}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Record
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicalRecordForm;
