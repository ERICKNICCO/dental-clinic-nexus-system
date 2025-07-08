import { Appointment } from '../../types/appointment';

export const getStatusClass = (status: string) => {
  switch (status) {
    case 'Confirmed':
      return 'bg-green-100 text-green-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    case 'Approved':
      return 'bg-blue-100 text-blue-800';
    case 'Checked In':
      return 'bg-purple-100 text-purple-800';
    case 'In Progress':
      return 'bg-orange-100 text-orange-800';
    case 'Completed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const filterAppointments = (
  appointments: Appointment[], 
  searchTerm: string, 
  statusFilter: string
) => {
  return appointments.filter(appointment => {
    // Hide checked-out appointments from previous days
    const today = new Date();
    today.setHours(0,0,0,0);
    const apptDate = new Date(appointment.date);
    apptDate.setHours(0,0,0,0);
    if (String(appointment.status) === 'Checked Out' && apptDate < today) {
      return false;
    }
    const matchesSearch = !searchTerm || 
      appointment.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.treatment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.dentist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || appointment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
};
