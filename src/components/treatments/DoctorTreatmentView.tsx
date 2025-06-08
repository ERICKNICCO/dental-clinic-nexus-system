
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Calendar, User, DollarSign, FileText, Loader2 } from 'lucide-react';
import { treatmentPricingService } from '../../services/treatmentPricingService';
import { useAuth } from '../../contexts/AuthContext';
import { useAllTreatmentNotes } from '../../hooks/useAllTreatmentNotes';

const DoctorTreatmentView: React.FC = () => {
  const { userProfile } = useAuth();
  const { allNotes, loading, error } = useAllTreatmentNotes();

  console.log('=== DoctorTreatmentView Debug ===');
  console.log('DoctorTreatmentView: Component rendered');
  console.log('DoctorTreatmentView: userProfile:', userProfile);
  console.log('DoctorTreatmentView: All treatment notes:', allNotes);
  console.log('DoctorTreatmentView: Loading state:', loading);
  console.log('DoctorTreatmentView: Error state:', error);
  console.log('DoctorTreatmentView: Current doctor name:', userProfile?.name);
  
  // Get current month
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  console.log('DoctorTreatmentView: Current month filter:', currentMonth);
  
  // Filter treatments by current doctor and current month
  const doctorTreatments = allNotes.filter(treatment => {
    const treatmentDate = new Date(treatment.date);
    const treatmentMonth = `${treatmentDate.getFullYear()}-${String(treatmentDate.getMonth() + 1).padStart(2, '0')}`;
    
    console.log('DoctorTreatmentView: Checking treatment:', {
      id: treatment.id,
      doctor: treatment.doctor,
      currentDoctor: userProfile?.name,
      doctorMatch: treatment.doctor === userProfile?.name,
      treatmentMonth: treatmentMonth,
      currentMonth: currentMonth,
      monthMatch: treatmentMonth === currentMonth,
      date: treatment.date,
      procedure: treatment.procedure,
      patientName: treatment.patientName
    });
    
    const doctorMatch = treatment.doctor === userProfile?.name;
    const monthMatch = treatmentMonth === currentMonth;
    const shouldInclude = doctorMatch && monthMatch;
    
    console.log(`DoctorTreatmentView: Treatment ${treatment.id} - Include: ${shouldInclude} (doctor: ${doctorMatch}, month: ${monthMatch})`);
    
    return shouldInclude;
  });

  console.log('DoctorTreatmentView: Filtered doctor treatments:', doctorTreatments);
  console.log('DoctorTreatmentView: Filtered treatments count:', doctorTreatments.length);

  // Calculate stats based on actual treatment notes
  const totalTreatments = doctorTreatments.length;
  
  // For revenue calculation, we'll use a simple estimation since we don't have actual pricing in notes
  const estimatedRevenue = doctorTreatments.length * 30,000; // Average treatment cost

  console.log('DoctorTreatmentView: Stats - Total treatments:', totalTreatments, 'Estimated revenue:', estimatedRevenue);
  console.log('=== End DoctorTreatmentView Debug ===');

  if (loading) {
    console.log('DoctorTreatmentView: Rendering loading state');
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
    console.log('DoctorTreatmentView: Rendering error state');
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

  console.log('DoctorTreatmentView: Rendering main content');

  return (
    <div className="space-y-6">
      {/* Current Month Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Treatments - {currentDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalTreatments}</div>
              <div className="text-sm text-gray-500">Treatments This Month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {treatmentPricingService.formatPrice(estimatedRevenue)}
              </div>
              <div className="text-sm text-gray-500">Estimated Revenue This Month</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Doctor's Treatments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Treatments</CardTitle>
        </CardHeader>
        <CardContent>
          {doctorTreatments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No treatments performed this month</h3>
              <p className="text-sm">Complete consultations with patients to see your treatment records here.</p>
              <div className="mt-4 text-xs text-gray-400">
                <p>Debug info:</p>
                <p>Total notes: {allNotes.length}</p>
                <p>Current doctor: {userProfile?.name}</p>
                <p>Current month: {currentMonth}</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Follow-up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctorTreatments.map((treatment) => (
                  <TableRow key={treatment.id}>
                    <TableCell>
                      {new Date(treatment.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        {treatment.patientName}
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
                    <TableCell className="max-w-xs">
                      <div className="truncate text-sm text-gray-600">
                        {treatment.followUp || 'None'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorTreatmentView;
