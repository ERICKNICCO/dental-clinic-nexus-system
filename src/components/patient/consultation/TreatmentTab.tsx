
import React, { useState } from 'react';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { DollarSign } from 'lucide-react';
import TreatmentCostDisplay from './TreatmentCostDisplay';
import { TreatmentPrice, treatmentPricingService } from '../../../services/treatmentPricingService';

interface TreatmentTabProps {
  treatmentPlan: string;
  prescriptions: string;
  onUpdateField: (field: string, value: string) => void;
}

const TreatmentTab: React.FC<TreatmentTabProps> = ({
  treatmentPlan,
  prescriptions,
  onUpdateField
}) => {
  const [showCostDisplay, setShowCostDisplay] = useState(false);
  const [selectedTreatments, setSelectedTreatments] = useState<TreatmentPrice[]>([]);

  const handleAddTreatmentToPlan = (treatment: TreatmentPrice) => {
    if (!selectedTreatments.find(t => t.id === treatment.id)) {
      const updatedTreatments = [...selectedTreatments, treatment];
      setSelectedTreatments(updatedTreatments);
      
      // Add treatment to the treatment plan text
      const treatmentText = `${treatment.name} - ${treatmentPricingService.formatPrice(treatment.basePrice)} (${treatment.duration})`;
      const currentPlan = treatmentPlan || '';
      const newPlan = currentPlan 
        ? `${currentPlan}\n• ${treatmentText}`
        : `• ${treatmentText}`;
      
      onUpdateField('treatmentPlan', newPlan);
    }
  };

  const totalCost = selectedTreatments.reduce((sum, treatment) => sum + treatment.basePrice, 0);

  return (
    <div className="space-y-6 mt-6">
      {/* Treatment Plan */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="treatmentPlan">Treatment Plan</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCostDisplay(!showCostDisplay)}
            className="flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            {showCostDisplay ? 'Hide' : 'Show'} Treatment Costs
          </Button>
        </div>
        <Textarea
          id="treatmentPlan"
          placeholder="Describe the treatment plan..."
          value={treatmentPlan}
          onChange={(e) => onUpdateField('treatmentPlan', e.target.value)}
          rows={6}
        />
      </div>

      {/* Treatment Cost Display */}
      {showCostDisplay && (
        <TreatmentCostDisplay 
          onAddTreatmentToPlan={handleAddTreatmentToPlan}
        />
      )}

      {/* Cost Summary */}
      {selectedTreatments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost Summary for Patient</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedTreatments.map((treatment) => (
                <div key={treatment.id} className="flex justify-between items-center">
                  <span>{treatment.name}</span>
                  <Badge variant="secondary">
                    {treatmentPricingService.formatPrice(treatment.basePrice)}
                  </Badge>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between items-center font-semibold">
                <span>Total Estimated Cost:</span>
                <span className="text-lg text-green-600">
                  {treatmentPricingService.formatPrice(totalCost)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescriptions */}
      <div>
        <Label htmlFor="prescriptions">Prescriptions</Label>
        <Textarea
          id="prescriptions"
          placeholder="List medications and dosages..."
          value={prescriptions}
          onChange={(e) => onUpdateField('prescriptions', e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
};

export default TreatmentTab;
