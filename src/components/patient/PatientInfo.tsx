
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Edit, Save, X, User, Phone, Mail, Calendar, MapPin, Contact, Heart, CreditCard } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { usePatients } from '../../hooks/usePatients';

interface Patient {
  id: string;
  patientId?: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  insurance: string;
  patientType: 'insurance' | 'cash';
  lastVisit: string;
  nextAppointment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PatientInfoProps {
  patient: Patient;
  canEdit: boolean;
}

const PatientInfo: React.FC<PatientInfoProps> = ({ patient, canEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState(patient);
  const { toast } = useToast();
  const { updatePatient } = usePatients();

  const insuranceProviders = [
    { value: 'NHIF', label: 'NHIF' },
    { value: 'GA', label: 'GA Insurance' },
    { value: 'Jubilee', label: 'Jubilee Insurance' },
    { value: 'MO', label: 'MO Insurance' },
    { value: 'Britam', label: 'Britam Insurance' },
    { value: 'AAR', label: 'AAR Insurance' },
    { value: 'Other', label: 'Other' }
  ];

  const handleEdit = () => {
    setIsEditing(true);
    setEditedPatient(patient);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedPatient(patient);
  };

  const handleSave = async () => {
    try {
      await updatePatient(patient.id, {
        name: editedPatient.name,
        email: editedPatient.email,
        phone: editedPatient.phone,
        dateOfBirth: editedPatient.dateOfBirth,
        gender: editedPatient.gender,
        address: editedPatient.address,
        emergencyContact: editedPatient.emergencyContact,
        emergencyPhone: editedPatient.emergencyPhone,
        insurance: editedPatient.insurance,
        patientType: editedPatient.patientType,
      });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Patient information updated successfully.",
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "Error",
        description: "Failed to update patient information.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof Patient, value: string) => {
    setEditedPatient(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatInsuranceProvider = (insurance: string) => {
    const provider = insuranceProviders.find(p => p.value === insurance);
    return provider ? provider.label : insurance;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
          {canEdit && !isEditing && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canEdit && isEditing && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
            
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedPatient.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{patient.name}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedPatient.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{patient.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedPatient.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{patient.phone}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedPatient.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Gender</label>
                {isEditing ? (
                  <select
                    value={editedPatient.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="mt-1 text-gray-900 capitalize">{patient.gender}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Address</label>
                {isEditing ? (
                  <textarea
                    value={editedPatient.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{patient.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact & Insurance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Emergency Contact & Insurance</h3>
            
            <div className="flex items-center gap-3">
              <Contact className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Emergency Contact</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedPatient.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{patient.emergencyContact}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Emergency Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedPatient.emergencyPhone}
                    onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{patient.emergencyPhone}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Payment Type</label>
                {isEditing ? (
                  <select
                    value={editedPatient.patientType}
                    onChange={(e) => handleInputChange('patientType', e.target.value as 'insurance' | 'cash')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="insurance">Insurance</option>
                  </select>
                ) : (
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      patient.patientType === 'insurance' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {patient.patientType === 'insurance' 
                        ? formatInsuranceProvider(patient.insurance) || 'Insurance' 
                        : 'Cash'}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {(editedPatient.patientType === 'insurance' || patient.patientType === 'insurance') && (
              <div className="flex items-center gap-3">
                <Heart className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Insurance Provider</label>
                  {isEditing ? (
                    <select
                      value={editedPatient.insurance}
                      onChange={(e) => handleInputChange('insurance', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Insurance Provider</option>
                      {insuranceProviders.map((provider) => (
                        <option key={provider.value} value={provider.value}>
                          {provider.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-gray-900">{formatInsuranceProvider(patient.insurance)}</p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Visit Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Visit:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(patient.lastVisit).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Next Appointment:</span>
                  <span className="text-sm text-gray-900">
                    {patient.nextAppointment 
                      ? new Date(patient.nextAppointment).toLocaleDateString() 
                      : 'Not scheduled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientInfo;
