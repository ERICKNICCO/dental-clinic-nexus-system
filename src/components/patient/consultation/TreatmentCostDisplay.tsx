
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Search, DollarSign, Clock, Info } from 'lucide-react';
import { treatmentPricingService, TreatmentPrice } from '../../../services/treatmentPricingService';

interface TreatmentCostDisplayProps {
  onAddTreatmentToPlan: (treatment: TreatmentPrice) => void;
}

const TreatmentCostDisplay: React.FC<TreatmentCostDisplayProps> = ({
  onAddTreatmentToPlan
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTreatments, setSelectedTreatments] = useState<TreatmentPrice[]>([]);

  const allTreatments = treatmentPricingService.getAllTreatments();
  
  const filteredTreatments = searchQuery 
    ? allTreatments.filter(treatment => 
        treatment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        treatment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        treatment.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allTreatments;

  const handleAddTreatment = (treatment: TreatmentPrice) => {
    if (!selectedTreatments.find(t => t.id === treatment.id)) {
      const updatedTreatments = [...selectedTreatments, treatment];
      setSelectedTreatments(updatedTreatments);
      onAddTreatmentToPlan(treatment);
    }
  };

  const handleRemoveTreatment = (treatmentId: string) => {
    setSelectedTreatments(prev => prev.filter(t => t.id !== treatmentId));
  };

  const totalCost = selectedTreatments.reduce((sum, treatment) => sum + treatment.basePrice, 0);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Preventive': return 'bg-green-100 text-green-800';
      case 'Restorative': return 'bg-blue-100 text-blue-800';
      case 'Cosmetic': return 'bg-purple-100 text-purple-800';
      case 'Orthodontic': return 'bg-orange-100 text-orange-800';
      case 'Surgical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Treatment Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Treatment Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="treatmentSearch">Search Treatments</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="treatmentSearch"
                  placeholder="Search by treatment name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Available Treatments */}
            <div className="grid gap-3 max-h-60 overflow-y-auto">
              {filteredTreatments.map((treatment) => (
                <div
                  key={treatment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{treatment.name}</h4>
                      <Badge className={getCategoryColor(treatment.category)}>
                        {treatment.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{treatment.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {treatment.duration}
                      </span>
                      <span className="font-semibold text-green-600">
                        {treatmentPricingService.formatPrice(treatment.basePrice)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTreatment(treatment)}
                    disabled={selectedTreatments.some(t => t.id === treatment.id)}
                  >
                    {selectedTreatments.some(t => t.id === treatment.id) ? 'Added' : 'Add'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Treatments & Total Cost */}
      {selectedTreatments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Treatment Plan & Cost Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedTreatments.map((treatment) => (
                <div
                  key={treatment.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-medium">{treatment.name}</span>
                    <span className="ml-2 text-sm text-gray-500">({treatment.duration})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {treatmentPricingService.formatPrice(treatment.basePrice)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTreatment(treatment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-3">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total Estimated Cost:</span>
                  <span className="text-green-600">
                    {treatmentPricingService.formatPrice(totalCost)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  * Final costs may vary based on complexity and additional procedures required
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TreatmentCostDisplay;
