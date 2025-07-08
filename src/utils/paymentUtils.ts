import { supabase } from '../integrations/supabase/client';

export const paymentUtils = {
  // Format price for display - FIXED CURRENCY
  formatPrice: (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' Tsh';
  },

  // Validate and correct patient data
  async validatePaymentData(paymentData: any) {
    const errors: string[] = [];
    let correctedPatientId = null;
    let correctedAppointmentId = null;

    // Try to find correct patient ID by name
    if (paymentData.patient_name) {
      const correctedId = await this.validateAndCorrectPatientId(paymentData.patient_name, paymentData.patient_id);
      if (correctedId !== paymentData.patient_id) {
        correctedPatientId = correctedId;
      }
    }

    // Try to find correct appointment ID by patient name
    if (paymentData.patient_name && !paymentData.appointment_id) {
      const foundAppointmentId = await this.findAppointmentIdByPatientName(paymentData.patient_name);
      if (foundAppointmentId) {
        correctedAppointmentId = foundAppointmentId;
      }
    }

    return {
      errors,
      correctedPatientId,
      correctedAppointmentId
    };
  },

  // Find patient ID by name
  async validateAndCorrectPatientId(patientName: string, providedPatientId?: string): Promise<string> {
    try {
      // First try to find by exact name match
      const { data: patients, error } = await supabase
        .from('patients')
        .select('id')
        .eq('name', patientName)
        .limit(1);

      if (error) {
        console.error('Error finding patient by name:', error);
        return providedPatientId || patientName;
      }

      if (patients && patients.length > 0) {
        return patients[0].id;
      }

      // If no exact match, try case-insensitive search
      const { data: patientsLike, error: likeError } = await supabase
        .from('patients')
        .select('id')
        .ilike('name', `%${patientName}%`)
        .limit(1);

      if (likeError) {
        console.error('Error finding patient by name (like):', likeError);
        return providedPatientId || patientName;
      }

      if (patientsLike && patientsLike.length > 0) {
        return patientsLike[0].id;
      }

      return providedPatientId || patientName;
    } catch (error) {
      console.error('Error validating patient ID:', error);
      return providedPatientId || patientName;
    }
  },

  // Find appointment ID by patient name
  async findAppointmentIdByPatientName(patientName: string): Promise<string | null> {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id')
        .eq('patient_name', patientName)
        .in('status', ['Checked In', 'In Progress', 'Approved', 'Confirmed'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error finding appointment by patient name:', error);
        return null;
      }

      if (appointments && appointments.length > 0) {
        return appointments[0].id;
      }

      return null;
    } catch (error) {
      console.error('Error finding appointment ID:', error);
      return null;
    }
  }
};
