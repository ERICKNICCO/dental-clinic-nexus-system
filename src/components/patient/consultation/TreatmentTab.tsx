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
      `• ${toSentenceCase(t.name)} x ${t.quantity || 1} - ${supabaseTreatmentPricingService.formatPrice(t.basePrice * (t.quantity || 1))} (${t.duration} min)`
    );
    const newPlan = treatmentTexts.join('\n');
    setLocalTreatmentPlan(newPlan);
    onUpdateField('treatment_plan', newPlan);
    
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
  };

  const totalCost = selectedTreatments.reduce((sum, treatment) => sum + (treatment.basePrice * (treatment.quantity || 1)), 0);

  // Effect to update estimated cost whenever treatments change
  useEffect(() => {
    if (selectedTreatments.length > 0) {
      const total = selectedTreatments.reduce((sum, t) => sum + (t.basePrice * (t.quantity || 1)), 0);
      console.log('TreatmentTab useEffect - updating estimated cost:', total);
      onUpdateField('estimated_cost', total.toString());
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
    <div className="space-y-6">
      {/* Patient Payment Type Info */}
      <div className="flex items-start gap-2 mb-6">
        <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
        <div>
          <div className="font-semibold text-blue-600">
            Patient Payment Type: {getPaymentTypeDisplay()}
          </div>
          <div className="text-sm text-blue-500">
            Treatment prices shown are specific to this payment type
          </div>
        </div>
      </div>

      {/* Treatment Plan */}
      <div className="space-y-3">
        <Label htmlFor="treatmentPlan" className="text-base font-medium">Treatment Plan</Label>
        <Textarea
          id="treatmentPlan"
          placeholder="Describe the treatment plan..."
          value={localTreatmentPlan}
          onChange={(e) => setLocalTreatmentPlan(e.target.value)}
          onBlur={() => onUpdateField('treatment_plan', localTreatmentPlan)}
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Info banner for pricing */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-blue-700">
          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <span className="text-sm font-medium">
            Showing prices for: {getPaymentTypeDisplay()} patients
          </span>
        </div>
      </div>

      {/* Always show Treatment Pricing */}
      <div className="space-y-4">
        <TreatmentCostDisplay 
          onAddTreatmentToPlan={handleAddTreatmentToPlan}
          patientInsurance={getActualInsuranceProvider()}
          patientType={patientType}
        />
      </div>

      {/* Selected Treatments */}
      {selectedTreatments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-medium">Selected Treatments:</h3>
          <div className="space-y-3">
            {selectedTreatments.map((treatment) => (
              <div key={treatment.id} className="flex justify-between items-center py-2">
                <div className="flex-1">
                  <div className="font-medium">{treatment.name}</div>
                  <div className="text-sm text-gray-500">({treatment.duration} min)</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-green-600">
                    {supabaseTreatmentPricingService.formatPrice(treatment.basePrice * (treatment.quantity || 1))}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTreatment(treatment.id)}
                    className="text-red-600 hover:text-red-700 h-8 px-2"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Total Cost */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total Estimated Cost:</span>
              <span className="text-xl font-bold text-green-600">
                {supabaseTreatmentPricingService.formatPrice(totalCost)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions */}
      <div className="space-y-3">
        <Label htmlFor="prescriptions" className="text-base font-medium">Prescriptions</Label>
        <Textarea
          id="prescriptions"
          placeholder="Enter prescriptions..."
          value={localPrescriptions}
          onChange={(e) => setLocalPrescriptions(e.target.value)}
          onBlur={() => onUpdateField('prescriptions', localPrescriptions)}
          rows={4}
          className="resize-none"
        />
      </div>
    </div>
  );
};

export default TreatmentTab;
