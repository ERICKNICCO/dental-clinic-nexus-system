import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Calendar, User, DollarSign, Loader2, FileText } from 'lucide-react';
import { treatmentPricingFirebaseService } from '../../services/treatmentPricingFirebaseService';
import { useAllTreatmentNotes } from '../../hooks/useAllTreatmentNotes';

const AdminTreatmentView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { allNotes, loading, error } = useAllTreatmentNotes();
  const [treatmentPricing, setTreatmentPricing] = useState([]);
  const [pricingLoading, setPricingLoading] = useState(true);

  console.log('AdminTreatmentView: All treatment notes:', allNotes);
  console.log('AdminTreatmentView: Loading state:', loading);
  console.log('AdminTreatmentView: Error state:', error);

  // Load treatment pricing from Firebase
  useEffect(() => {
    const loadTreatmentPricing = async () => {
      try {
        setPricingLoading(true);
        console.log('AdminTreatmentView: Loading treatment pricing from Firebase...');
        const pricing = await treatmentPricingFirebaseService.getAllTreatmentPricing();
        console.log('AdminTreatmentView: Loaded pricing data:', pricing);
        setTreatmentPricing(pricing);
      } catch (error) {
        console.error('AdminTreatmentView: Error loading treatment pricing:', error);
      } finally {
        setPricingLoading(false);
      }
    };

    loadTreatmentPricing();
  }, []);

  // Filter treatments by selected month
  const filteredTreatments = allNotes.filter(treatment => {
    const treatmentDate = new Date(treatment.date);
    const treatmentMonth = `${treatmentDate.getFullYear()}-${String(treatmentDate.getMonth() + 1).padStart(2, '0')}`;
    return treatmentMonth === selectedMonth;
  });

  // Helper function to find pricing with better matching
  const findTreatmentPrice = (procedureName) => {
    console.log('Finding price for procedure:', procedureName);
    console.log('Available pricing options:', treatmentPricing.map(p => ({ name: p.name, price: p.price })));
    
    // Try exact match first
    let pricingData = treatmentPricing.find(p => p.name === procedureName);
    if (pricingData) {
      console.log('Found exact match:', pricingData);
      return pricingData.price;
    }
    
    // Try case-insensitive match
    pricingData = treatmentPricing.find(p => p.name.toLowerCase() === procedureName.toLowerCase());
    if (pricingData) {
      console.log('Found case-insensitive match:', pricingData);
      return pricingData.price;
    }
    
    // Try partial match (contains)
    pricingData = treatmentPricing.find(p => 
      p.name.toLowerCase().includes(procedureName.toLowerCase()) ||
      procedureName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (pricingData) {
      console.log('Found partial match:', pricingData);
      return pricingData.price;
    }
    
    // Try matching without special characters and spaces
    const cleanProcedure = procedureName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    pricingData = treatmentPricing.find(p => {
      const cleanPrice = p.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return cleanPrice === cleanProcedure;
    });
    if (pricingData) {
      console.log('Found clean match:', pricingData);
      return pricingData.price;
    }
    
    console.log('No pricing found for:', procedureName);
    return 0;
  };

  // Calculate total revenue using Firebase pricing
  const totalRevenue = filteredTreatments.reduce((sum, treatment) => {
    const price = findTreatmentPrice(treatment.procedure);
    console.log(`AdminTreatmentView: Treatment "${treatment.procedure}" - Price: ${price}`);
    return sum + price;
  }, 0);
  
  const totalTreatments = filteredTreatments.length;

  console.log('AdminTreatmentView: Total revenue calculated:', totalRevenue);
  console.log('AdminTreatmentView: Available pricing data:', treatmentPricing);

  if (loading || pricingLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading treatment records and pricing...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Error loading treatment records: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Treatment Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="month">Select Month</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-48"
              />
            </div>
            <div className="flex gap-4 ml-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalTreatments}</div>
                <div className="text-sm text-gray-500">Total Treatments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {treatmentPricingFirebaseService.formatPrice(totalRevenue)}
                </div>
                <div className="text-sm text-gray-500">Total Revenue</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Treatments for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTreatments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No treatments found for the selected month</h3>
              <p className="text-sm">Treatment records will appear here once consultations are completed.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTreatments.map((treatment) => {
                  const cost = findTreatmentPrice(treatment.procedure);
                  
                  return (
                    <TableRow key={treatment.id}>
                      <TableCell>
                        {new Date(treatment.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {treatment.patientName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-500" />
                          {treatment.doctor}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {treatment.procedure}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm text-gray-600">
                          {treatment.notes}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {cost > 0 ? (
                          treatmentPricingFirebaseService.formatPrice(cost)
                        ) : (
                          <span className="text-gray-400">No pricing set</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTreatmentView;
