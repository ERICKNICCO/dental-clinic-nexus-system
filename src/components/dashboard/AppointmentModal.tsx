import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppointments } from '../../hooks/useAppointments';
import { useToast } from '../../hooks/use-toast';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: any;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, appointment }) => {
  const [formData, setFormData] = useState({
    patient: { name: '', image: '', phone: '', email: '' },
    dentist: '',
    date: '',
    time: '',
    treatment: '',
    status: 'Pending' as 'Confirmed' | 'Pending' | 'Cancelled' | 'Approved',
    notes: ''
  });

  const { addAppointment, updateAppointment } = useAppointments();
  const { toast } = useToast();

  useEffect(() => {
    if (appointment) {
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
        notes: appointment.notes || ''
      });
    } else {
      // Reset form for new appointment
      setFormData({
        patient: { name: '', image: '', phone: '', email: '' },
        dentist: '',
        date: '',
        time: '',
        treatment: '',
        status: 'Pending',
        notes: ''
      });
    }
  }, [appointment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const appointmentData = {
        ...formData,
        time: formData.time + (parseInt(formData.time.split(':')[0]) >= 12 ? ' PM' : ' AM'),
        patient: {
          ...formData.patient,
          image: formData.patient.image || 'https://randomuser.me/api/portraits/men/32.jpg'
        }
      };

      if (appointment) {
        await updateAppointment(appointment.id, appointmentData);
        toast({
          title: "Success",
          description: "Appointment updated successfully",
        });
      } else {
        await addAppointment(appointmentData);
        toast({
          title: "Success",
          description: "Appointment created successfully",
        });
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-lg font-semibold">{appointment ? 'Edit Appointment' : 'New Appointment'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">Patient Name</label>
                <input 
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                  value={formData.patient.name}
                  onChange={(e) => setFormData({...formData, patient: {...formData.patient, name: e.target.value}})}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Patient Phone</label>
                <input 
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                  value={formData.patient.phone}
                  onChange={(e) => setFormData({...formData, patient: {...formData.patient, phone: e.target.value}})}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Patient Email</label>
                <input 
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                  value={formData.patient.email}
                  onChange={(e) => setFormData({...formData, patient: {...formData.patient, email: e.target.value}})}
                  placeholder="Email for appointment notifications"
                />
                <p className="text-sm text-gray-500 mt-1">Email is required for appointment confirmation notifications</p>
              </div>
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
              <div className="md:col-span-2">
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
