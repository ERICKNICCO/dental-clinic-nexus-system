
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  insurance: string;
  lastVisit: string;
  nextAppointment: string;
}

interface PatientInfoProps {
  patient: Patient;
  isEditing: boolean;
}

const PatientInfo: React.FC<PatientInfoProps> = ({ patient, isEditing }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            {isEditing ? (
              <Input id="name" defaultValue={patient.name} />
            ) : (
              <p className="text-sm text-gray-600">{patient.name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            {isEditing ? (
              <Input id="dob" type="date" defaultValue={patient.dateOfBirth} />
            ) : (
              <p className="text-sm text-gray-600">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            {isEditing ? (
              <Input id="email" type="email" defaultValue={patient.email} />
            ) : (
              <p className="text-sm text-gray-600">{patient.email}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            {isEditing ? (
              <Input id="phone" defaultValue={patient.phone} />
            ) : (
              <p className="text-sm text-gray-600">{patient.phone}</p>
            )}
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            {isEditing ? (
              <Input id="address" defaultValue={patient.address} />
            ) : (
              <p className="text-sm text-gray-600">{patient.address}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="emergency">Emergency Contact</Label>
            {isEditing ? (
              <Input id="emergency" defaultValue={patient.emergencyContact} />
            ) : (
              <p className="text-sm text-gray-600">{patient.emergencyContact}</p>
            )}
          </div>
          <div>
            <Label htmlFor="insurance">Insurance Provider</Label>
            {isEditing ? (
              <Input id="insurance" defaultValue={patient.insurance} />
            ) : (
              <p className="text-sm text-gray-600">{patient.insurance}</p>
            )}
          </div>
          <div>
            <Label>Last Visit</Label>
            <p className="text-sm text-gray-600">{new Date(patient.lastVisit).toLocaleDateString()}</p>
          </div>
          <div>
            <Label>Next Appointment</Label>
            <p className="text-sm text-gray-600">{new Date(patient.nextAppointment).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientInfo;
