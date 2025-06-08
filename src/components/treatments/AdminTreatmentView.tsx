
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Calendar, User, DollarSign, Loader2, FileText } from 'lucide-react';
import { treatmentPricingService } from '../../services/treatmentPricingService';
import { useAllTreatmentNotes } from '../../hooks/useAllTreatmentNotes';

const AdminTreatmentView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { allNotes, loading, error } = useAllTreatmentNotes();

  console.log('AdminTreatmentView: All treatment notes:', allNotes);
  console.log('AdminTreatmentView: Loading state:', loading);
  console.log('AdminTreatmentView: Error state:', error);

  // Filter treatments by selected month
  const filteredTreatments = allNotes.filter(treatment => {
    const treatmentDate = new Date(treatment.date);
    const treatmentMonth = `${treatmentDate.getFullYear()}-${String(treatmentDate.getMonth() + 1).padStart(2, '0')}`;
    return treatmentMonth === selectedMonth;
  });

  const totalRevenue = filteredTreatments.reduce((sum, treatment) => {
    // Try to get actual price from treatment pricing service
    const treatmentPrice = treatmentPricingService.getTreatmentByName(treatment.procedure);
    return sum + (treatmentPrice?.basePrice || 500000); // fallback to average price
  }, 0);
  const totalTreatments = filteredTreatments.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading treatment records...</p>
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
                  {treatmentPricingService.formatPrice(totalRevenue)}
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
                  <TableHead className="text-right">Estimated Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTreatments.map((treatment) => {
                  const treatmentPrice = treatmentPricingService.getTreatmentByName(treatment.procedure);
                  const cost = treatmentPrice?.basePrice || 500000;
                  
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
                        {treatmentPricingService.formatPrice(cost)}
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
