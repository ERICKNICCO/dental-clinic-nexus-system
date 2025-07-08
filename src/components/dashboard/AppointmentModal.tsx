import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useAppointments } from '../../hooks/useAppointments';
import { usePatients } from '../../hooks/usePatients';
import { useToast } from '../../hooks/use-toast';
import { capitalizeName } from '../../lib/utils';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: any;
}

// Helper to format phone as xxx xxx xxx
function formatPhoneDigits(digits: string) {
  return digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3').trim();
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, appointment }) => {
  const [formData, setFormData] = useState({
    patient: { name: '', image: '', phone: '', email: '' },
    dentist: '',
    date: '',
    time: '',
    treatment: '',
    status: 'Pending' as 'Confirmed' | 'Pending' | 'Cancelled' | 'Approved',
    patientType: 'cash' as 'cash' | 'insurance',
    insurance: '',
    notes: ''
  });
  
  const [isNewPatient, setIsNewPatient] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  const { addAppointment, updateAppointment } = useAppointments();
  const { patients } = usePatients();
  const { toast } = useToast();

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    patient.phone.includes(patientSearch) ||
    (patient.email && patient.email.toLowerCase().includes(patientSearch.toLowerCase()))
  );

  useEffect(() => {
    if (appointment) {
      // If patientType is not 'cash', treat as insurance and set insurance provider
      const isInsurance = appointment.patientType && appointment.patientType !== 'cash';
      setFormData({
        patient: {
          name: appointment.patient.name,
          image: appointment.patient.image,
          phone: appointment.patient.phone,
          email: appointment.patient.email || ''
        },
        dentist: appointment.dentist,
        date: appointment.date,
        time: appointment.time.replace(' AM', '').replace(' PM', ''),
        treatment: appointment.treatment,
        status: appointment.status,
        patientType: isInsurance ? 'insurance' : 'cash',
        insurance: isInsurance ? appointment.patientType : '',
        notes: appointment.notes || ''
      });
      setIsNewPatient(false);
    } else {
      // Reset form for new appointment
      setFormData({
        patient: { name: '', image: '', phone: '', email: '' },
        dentist: '',
        date: '',
        time: '',
        treatment: '',
        status: 'Pending',
        patientType: 'cash',
        insurance: '',
        notes: ''
      });
      setIsNewPatient(true);
      setSelectedPatientId('');
      setPatientSearch('');
    }
  }, [appointment, isOpen]);

  const handlePatientSelect = (patient: any) => {
    setSelectedPatientId(patient.id);
    setFormData({
      ...formData,
      patient: {
        name: capitalizeName(patient.name),
        phone: patient.phone,
        email: patient.email || '',
        image: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      patientType: patient.patientType || 'cash',
      insurance: patient.insurance || ''
    });
    setPatientSearch(capitalizeName(patient.name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number: must be 9 digits after +255
    const phone = formData.patient.phone.trim();
    const phoneDigits = phone.replace(/^\+255/, '');
    if (!/^\d{9}$/.test(phoneDigits)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Phone number must be 9 digits after +255.',
        variant: 'destructive',
      });
      return;
    }

    // Validate time is between 09:00 and 17:00
    const [hour, minute] = formData.time.split(':').map(Number);
    if (hour < 9 || hour > 17 || (hour === 17 && minute > 0)) {
      toast({
        title: 'Invalid Time',
        description: 'Appointment time must be between 09:00 and 17:00.',
        variant: 'destructive',
      });
      return;
    }

    // Validate appointment is not in the past
    const now = new Date();
    const selectedDateTime = new Date(formData.date + 'T' + formData.time);
    if (selectedDateTime < now) {
      toast({
        title: 'Invalid Date/Time',
        description: 'Cannot book an appointment in the past.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Determine patientType value for backend
      let patientTypeValue = formData.patientType === 'insurance' ? formData.insurance : 'cash';
      const appointmentData = {
        ...formData,
        patientType: patientTypeValue,
        // Remove insurance field from backend data
        insurance: undefined,
        time: formData.time + (hour >= 12 ? ' PM' : ' AM'),
        patient: {
          ...formData.patient,
          name: capitalizeName(formData.patient.name),
          image: formData.patient.image || 'https://randomuser.me/api/portraits/men/32.jpg'
        }
      };

      if (appointment) {
        const result = await updateAppointment(appointment.id, appointmentData);
        if (result.success) {
          toast({
            title: "Success",
            description: "Appointment updated successfully",
          });
          
          // Show warnings for email/notification failures
          if (result.emailError) {
            toast({
              title: "Warning",
              description: `Appointment updated but email failed: ${result.emailError}`,
              variant: "destructive",
            });
          }
          if (result.notificationError) {
            toast({
              title: "Warning",
              description: `Appointment updated but notification failed: ${result.notificationError}`,
              variant: "destructive",
            });
          }
        }
      } else {
        const result = await addAppointment(appointmentData);
        if (result.success) {
          toast({
            title: "Success",
            description: "Appointment created successfully",
          });
          
          // Show warnings for notification failures
          if (result.notificationError) {
            toast({
              title: "Warning",
              description: `Appointment created but notification failed: ${result.notificationError}`,
              variant: "destructive",
            });
          }
        }
      }
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${appointment ? 'update' : 'create'} appointment`,
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-lg font-semibold">{appointment ? 'Edit Appointment' : 'New Appointment'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">
              {/* Patient Selection Toggle */}
              {!appointment && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewPatient(false);
                        setFormData({...formData, patient: {name: '', phone: '', email: '', image: ''}, patientType: 'cash', insurance: ''});
                      }}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        !isNewPatient 
                          ? 'bg-dental-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Select Existing Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewPatient(true);
                        setSelectedPatientId('');
                        setPatientSearch('');
                        setFormData({...formData, patient: {name: '', phone: '', email: '', image: ''}, patientType: 'cash', insurance: ''});
                      }}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        isNewPatient 
                          ? 'bg-dental-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      New Patient
                    </button>
                  </div>

                  {/* Existing Patient Search */}
                  {!isNewPatient && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Search existing patients..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dental-500"
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                        />
                      </div>
                      
                      {patientSearch && !selectedPatientId && (
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                          {filteredPatients.length > 0 ? (
                            filteredPatients.slice(0, 5).map((patient) => (
                              <button
                                key={patient.id}
                                type="button"
                                onClick={() => handlePatientSelect(patient)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium">{patient.name}</div>
                                <div className="text-sm text-gray-500">
                                  {patient.phone} {patient.email && `• ${patient.email}`}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500 text-center">
                              No patients found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Patient Information Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">Patient Name</label>
                  <input 
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                    value={formData.patient.name}
                    onChange={(e) => setFormData({...formData, patient: {...formData.patient, name: e.target.value}})}
                    required
                    disabled={!isNewPatient && Boolean(selectedPatientId)}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Patient Phone</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-100 text-gray-600 select-none">+255</span>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-r px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                      maxLength={11} // 9 digits + 2 spaces
                      pattern="\d{3} \d{3} \d{3}"
                      value={formatPhoneDigits(formData.patient.phone.replace(/^\+255/, ''))}
                      onChange={(e) => {
                        // Remove all non-digits, then format
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setFormData({...formData, patient: {...formData.patient, phone: '+255' + raw}});
                      }}
                      required
                      disabled={!isNewPatient && Boolean(selectedPatientId)}
                      placeholder="740 989 116"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Patient Email</label>
                <input 
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                  value={formData.patient.email}
                  onChange={(e) => setFormData({...formData, patient: {...formData.patient, email: e.target.value}})}
                  placeholder="Email for appointment notifications"
                  disabled={!isNewPatient && Boolean(selectedPatientId)}
                />
                <p className="text-sm text-gray-500 mt-1">Email is required for appointment confirmation notifications</p>
              </div>

              {/* Payment Information */}
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-4">Payment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Payment Type</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                      value={formData.patientType}
                      onChange={(e) => {
                        const value = e.target.value as 'cash' | 'insurance';
                        setFormData({
                          ...formData, 
                          patientType: value,
                          insurance: value === 'cash' ? '' : formData.insurance
                        });
                      }}
                      disabled={!isNewPatient && Boolean(selectedPatientId)}
                    >
                      <option value="cash">Cash</option>
                      <option value="insurance">Insurance</option>
                    </select>
                  </div>
                  
                  {formData.patientType === 'insurance' && (
                    <div>
                      <label className="block text-gray-700 mb-2">Insurance Provider</label>
                      <select 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                        value={formData.insurance}
                        onChange={(e) => setFormData({...formData, insurance: e.target.value})}
                        required={formData.patientType === 'insurance'}
                        disabled={!isNewPatient && Boolean(selectedPatientId)}
                      >
                        <option value="">Select Insurance Provider</option>
                        <option value="Jubilee">Jubilee</option>
                        <option value="NHIF">NHIF</option>
                        <option value="G A insurance">G A insurance</option>
                        <option value="MO insurance">MO insurance</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Details */}
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-4">Appointment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Dentist</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                      value={formData.dentist}
                      onChange={(e) => setFormData({...formData, dentist: e.target.value})}
                      required
                    >
                      <option value="">Select Dentist</option>
                      <option>Dr. Shabbir</option>
                      <option>Dr. Israel</option>
                      <option>Dr. Rashid</option>
                      <option>Dr. Nyaki</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Date</label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Time</label>
                    <input 
                      type="time" 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Treatment</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                      value={formData.treatment}
                      onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                      required
                    >
                      <option value="">Select Treatment</option>
                      <option>Checkup</option>
                      <option>Cleaning</option>
                      <option>Filling</option>
                      <option>Root Canal</option>
                      <option>Extraction</option>
                      <option>Whitening</option>
                      <option>Braces</option>
                      <option>Implant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Status</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option>Pending</option>
                      <option>Confirmed</option>
                      <option>Cancelled</option>
                      <option>Approved</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Notes</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500" 
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>
            </div>
            
            <div className="flex justify-end border-t px-6 py-4 mt-6">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg mr-2 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-dental-600 text-white rounded-lg hover:bg-dental-700"
              >
                {appointment ? 'Update Appointment' : 'Save Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
