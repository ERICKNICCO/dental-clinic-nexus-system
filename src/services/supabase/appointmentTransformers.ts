
import { Appointment } from '../../types/appointment';

export const appointmentTransformers = {
  // Transform Supabase data to app format
  fromSupabase(data: any): Appointment {
    return {
      id: data.id,
      date: data.date,
      time: data.time,
      patient_name: data.patient_name,
      patient_phone: data.patient_phone || '',
      patient_email: data.patient_email || '',
      dentist: data.dentist,
      treatment: data.treatment,
      status: data.status,
      notes: data.notes || '',
      // Legacy patient object for backward compatibility
      patient: {
        name: data.patient_name,
        phone: data.patient_phone || '',
        email: data.patient_email || '',
        image: '',
        initials: data.patient_name ? data.patient_name.split(' ').map(n => n[0]).join('').toUpperCase() : ''
      }
    };
  },

  // Transform app format to Supabase format
  toSupabase(appointment: Omit<Appointment, 'id'>) {
    return {
      date: appointment.date,
      time: appointment.time,
      patient_name: appointment.patient_name,
      patient_phone: appointment.patient_phone || null,
      patient_email: appointment.patient_email || null,
      dentist: appointment.dentist,
      treatment: appointment.treatment,
      status: appointment.status || 'Pending',
      notes: appointment.notes || null,
    };
  },

  // Transform partial updates
  toSupabaseUpdate(updates: Partial<Appointment>) {
    const updateData: any = {};
    
    if (updates.date) updateData.date = updates.date;
    if (updates.time) updateData.time = updates.time;
    if (updates.patient_name) updateData.patient_name = updates.patient_name;
    if (updates.patient_phone !== undefined) updateData.patient_phone = updates.patient_phone;
    if (updates.patient_email !== undefined) updateData.patient_email = updates.patient_email;
    if (updates.dentist) updateData.dentist = updates.dentist;
    if (updates.treatment) updateData.treatment = updates.treatment;
    if (updates.status) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    return updateData;
  }
};
