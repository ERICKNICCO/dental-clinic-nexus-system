
import React, { useState, useEffect } from 'react';
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
      
      // Update estimated cost - ensure it's saved as a number
      const totalCost = updatedTreatments.reduce((sum, t) => sum + t.basePrice, 0);
      console.log('Setting estimated cost:', totalCost);
      onUpdateField('estimatedCost', totalCost.toString());
      
      // Update treatment items
      onUpdateField('treatmentItems', JSON.stringify(updatedTreatments.map(t => ({
        name: t.name,
        cost: t.basePrice,
        duration: t.duration
      }))));
    }
  };

  const handleRemoveTreatment = (treatmentId: string) => {
    const updatedTreatments = selectedTreatments.filter(t => t.id !== treatmentId);
    setSelectedTreatments(updatedTreatments);
    
    // Rebuild treatment plan without the removed treatment
    const treatmentTexts = updatedTreatments.map(t => 
      `• ${t.name} - ${treatmentPricingService.formatPrice(t.basePrice)} (${t.duration})`
    );
    onUpdateField('treatmentPlan', treatmentTexts.join('\n'));
    
    // Update estimated cost
    const totalCost = updatedTreatments.reduce((sum, t) => sum + t.basePrice, 0);
    console.log('Updated estimated cost:', totalCost);
    onUpdateField('estimatedCost', totalCost.toString());
    
    // Update treatment items
    onUpdateField('treatmentItems', JSON.stringify(updatedTreatments.map(t => ({
      name: t.name,
      cost: t.basePrice,
      duration: t.duration
    }))));
  };

  const totalCost = selectedTreatments.reduce((sum, treatment) => sum + treatment.basePrice, 0);

  // Effect to update estimated cost whenever treatments change
  useEffect(() => {
    if (selectedTreatments.length > 0) {
      const totalCost = selectedTreatments.reduce((sum, t) => sum + t.basePrice, 0);
      console.log('TreatmentTab useEffect - updating estimated cost:', totalCost);
      onUpdateField('estimatedCost', totalCost.toString());
    }
  }, [selectedTreatments, onUpdateField]);

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
          placeholder="Describe the treatment plan or use the cost display below to add treatments..."
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
            <CardTitle className="text-lg">Selected Treatments & Cost Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedTreatments.map((treatment) => (
                <div key={treatment.id} className="flex justify-between items-center">
                  <span>{treatment.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {treatmentPricingService.formatPrice(treatment.basePrice)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTreatment(treatment.id)}
                      className="text-red-600 hover:text-red-700 px-2"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between items-center font-semibold">
                <span>Total Estimated Cost:</span>
                <span className="text-lg text-green-600">
                  {treatmentPricingService.formatPrice(totalCost)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                This cost estimate will be used for payment record creation
              </p>
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
