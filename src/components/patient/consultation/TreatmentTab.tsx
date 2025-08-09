import React, { useState, useEffect } from 'react';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { DollarSign } from 'lucide-react';
import TreatmentCostDisplay from './TreatmentCostDisplay';
import { supabaseTreatmentPricingService, TreatmentPricing } from '../../../services/supabaseTreatmentPricingService';

interface TreatmentTabProps {
  treatmentPlan: string;
  prescriptions: string;
  onUpdateField: (field: string, value: string) => void;
  patientInsurance?: string;
  patientType?: 'cash' | 'insurance';
}

const TreatmentTab: React.FC<TreatmentTabProps> = ({
  treatmentPlan,
  prescriptions,
  onUpdateField,
  patientInsurance,
  patientType = 'cash'
}) => {
  const [showCostDisplay, setShowCostDisplay] = useState(false);
  type SelectedTreatment = TreatmentPricing & { quantity?: number };
  const [selectedTreatments, setSelectedTreatments] = useState<SelectedTreatment[]>([]);
  const [localTreatmentPlan, setLocalTreatmentPlan] = useState(treatmentPlan);
  const [localPrescriptions, setLocalPrescriptions] = useState(prescriptions);

  console.log('TreatmentTab - Patient Type:', patientType, 'Insurance:', patientInsurance);

  // Items are managed locally in this tab and persisted via onUpdateField


  useEffect(() => {
    setLocalTreatmentPlan(treatmentPlan);
  }, [treatmentPlan]);

  useEffect(() => {
    setLocalPrescriptions(prescriptions);
  }, [prescriptions]);

  // Helper to format treatment name in sentence case
  function toSentenceCase(str: string) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  const handleAddTreatmentToPlan = (treatment: TreatmentPricing, quantity: number) => {
    if (!selectedTreatments.find(t => t.id === treatment.id)) {
      const updatedTreatments = [...selectedTreatments, { ...treatment, quantity }];
      setSelectedTreatments(updatedTreatments);
      
      const treatmentText = `${toSentenceCase(treatment.name)} x ${quantity} - ${supabaseTreatmentPricingService.formatPrice(treatment.basePrice * quantity)} (${treatment.duration} min)`;
      const currentPlan = localTreatmentPlan || '';
      const newPlan = currentPlan 
        ? `${currentPlan}\n• ${treatmentText}`
        : `• ${treatmentText}`;
      
      setLocalTreatmentPlan(newPlan);
      onUpdateField('treatment_plan', newPlan); // Update parent immediately
      
      // Update estimated cost
      const totalCost = updatedTreatments.reduce((sum, t) => sum + (t.basePrice * (t.quantity || 1)), 0);
      onUpdateField('estimated_cost', totalCost.toString());
      
      // Update treatment items
      onUpdateField('treatment_items', JSON.stringify(updatedTreatments.map(t => ({
        name: t.name,
        cost: t.basePrice * (t.quantity || 1),
        duration: t.duration,
        quantity: t.quantity || 1,
        unit_cost: t.basePrice
      }))));
    }
  };

  const handleRemoveTreatment = (treatmentId: string) => {
    const updatedTreatments = selectedTreatments.filter(t => t.id !== treatmentId);
    setSelectedTreatments(updatedTreatments);
    
    const treatmentTexts = updatedTreatments.map(t => 
      `• ${toSentenceCase(t.name)} - ${supabaseTreatmentPricingService.formatPrice(t.basePrice)} (${t.duration} min)`
    );
    const newPlan = treatmentTexts.join('\n');
    setLocalTreatmentPlan(newPlan);
    onUpdateField('treatmentPlan', newPlan); // Update parent immediately
    
    // Update estimated cost
    const totalCost = updatedTreatments.reduce((sum, t) => sum + t.basePrice, 0);
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

  const getPaymentTypeDisplay = () => {
    if (patientType === 'insurance' && patientInsurance) {
      // Map insurance names to match our payment method codes
      const insuranceMapping: { [key: string]: string } = {
        'NHIF': 'NHIF',
        'GA Insurance': 'GA',
        'GA': 'GA',
        'Jubilee Insurance': 'JUBILEE',
        'Jubilee': 'JUBILEE',
        'MO Insurance': 'MO',
        'MO': 'MO'
      };
      
      return insuranceMapping[patientInsurance] || patientInsurance.toUpperCase();
    }
    return 'CASH';
  };

  const getActualInsuranceProvider = () => {
    if (patientType === 'insurance' && patientInsurance) {
      // Map insurance names to match our payment method codes
      const insuranceMapping: { [key: string]: string } = {
        'NHIF': 'NHIF',
        'GA Insurance': 'GA',
        'GA': 'GA',
        'Jubilee Insurance': 'JUBILEE',
        'Jubilee': 'JUBILEE',
        'MO Insurance': 'MO',
        'MO': 'MO'
      };
      
      return insuranceMapping[patientInsurance] || patientInsurance;
    }
    return 'cash';
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Patient Payment Type Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-800">
            Patient Payment Type: {getPaymentTypeDisplay()}
          </span>
        </div>
        <p className="text-sm text-blue-600 mt-1">
          Treatment prices shown are specific to this payment type
        </p>
      </div>

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
          value={localTreatmentPlan}
          onChange={(e) => setLocalTreatmentPlan(e.target.value)}
          onBlur={() => onUpdateField('treatmentPlan', localTreatmentPlan)}
          rows={6}
        />
      </div>

      {/* Treatment Cost Display */}
      {showCostDisplay && (
        <TreatmentCostDisplay 
          onAddTreatmentToPlan={handleAddTreatmentToPlan}
          patientInsurance={getActualInsuranceProvider()}
          patientType={patientType}
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
                      {supabaseTreatmentPricingService.formatPrice(treatment.basePrice)}
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
                <span>Total Estimated Cost ({getPaymentTypeDisplay()}):</span>
                <span className="text-lg text-green-600">
                  {supabaseTreatmentPricingService.formatPrice(totalCost)}
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
          value={localPrescriptions}
          onChange={(e) => setLocalPrescriptions(e.target.value)}
          onBlur={() => onUpdateField('prescriptions', localPrescriptions)}
          rows={4}
        />
      </div>
    </div>
  );
};

export default TreatmentTab;
