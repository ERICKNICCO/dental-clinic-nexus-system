
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Calendar, User, DollarSign } from 'lucide-react';
import { treatmentPricingService } from '../../services/treatmentPricingService';

// Mock data for treatments done - in a real app this would come from the database
const mockTreatmentRecords = [
  {
    id: '1',
    patientName: 'John Doe',
    doctorName: 'Dr. Smith',
    treatmentName: 'Dental Cleaning',
    date: '2024-06-15',
    cost: 180000,
    duration: '30 mins'
  },
  {
    id: '2',
    patientName: 'Jane Smith',
    doctorName: 'Dr. Johnson',
    treatmentName: 'Root Canal',
    date: '2024-06-10',
    cost: 1800000,
    duration: '90 mins'
  },
  {
    id: '3',
    patientName: 'Bob Wilson',
    doctorName: 'Dr. Smith',
    treatmentName: 'Teeth Whitening',
    date: '2024-06-05',
    cost: 800000,
    duration: '60 mins'
  },
  {
    id: '4',
    patientName: 'Alice Brown',
    doctorName: 'Dr. Johnson',
    treatmentName: 'Dental Implant',
    date: '2024-05-28',
    cost: 3400000,
    duration: '120 mins'
  },
  {
    id: '5',
    patientName: 'Mike Davis',
    doctorName: 'Dr. Smith',
    treatmentName: 'Filling',
    date: '2024-06-20',
    cost: 340000,
    duration: '45 mins'
  }
];

const AdminTreatmentView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Filter treatments by selected month
  const filteredTreatments = mockTreatmentRecords.filter(treatment => {
    const treatmentDate = new Date(treatment.date);
    const treatmentMonth = `${treatmentDate.getFullYear()}-${String(treatmentDate.getMonth() + 1).padStart(2, '0')}`;
    return treatmentMonth === selectedMonth;
  });

  const totalRevenue = filteredTreatments.reduce((sum, treatment) => sum + treatment.cost, 0);
  const totalTreatments = filteredTreatments.length;

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
              No treatments found for the selected month.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTreatments.map((treatment) => (
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
                        {treatment.doctorName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {treatment.treatmentName}
                      </Badge>
                    </TableCell>
                    <TableCell>{treatment.duration}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {treatmentPricingService.formatPrice(treatment.cost)}
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

export default AdminTreatmentView;
