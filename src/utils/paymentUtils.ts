import { supabase } from '../integrations/supabase/client';

export interface PaymentValidationResult {
  isValid: boolean;
  correctedPatientId?: string;
  correctedAppointmentId?: string;
  errors: string[];
}

export const paymentUtils = {
  // Validate UUID format
  isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  // Find appointment ID by patient name and date
  async findAppointmentIdByPatientName(patientName: string, date?: string): Promise<string | null> {
    try {
      console.log('🔥 PaymentUtils: Searching for appointment by patient name:', patientName);
      
      // Get today's date in YYYY-MM-DD format if not provided
      const searchDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('id, patient_name, date, status')
        .eq('patient_name', patientName)
        .eq('date', searchDate)
        .in('status', ['Checked In', 'In Progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('🔥 PaymentUtils: No appointment found for patient:', patientName);
          return null;
        }
        throw error;
      }

      console.log('✅ PaymentUtils: Found appointment:', data);
      return data.id;
    } catch (error) {
      console.error('❌ PaymentUtils: Error finding appointment by patient name:', error);
      return null;
    }
  },

  // Validate and correct patient ID
  async validateAndCorrectPatientId(patientName: string, providedPatientId?: string): Promise<string> {
    try {
      // If provided patient ID looks valid, use it
      if (providedPatientId && providedPatientId.length > 0) {
        console.log('🔥 PaymentUtils: Using provided patient ID:', providedPatientId);
        return providedPatientId;
      }

      // Try to find patient by name in patients table
      console.log('🔥 PaymentUtils: Searching for patient by name:', patientName);
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('patient_id')
        .eq('name', patientName)
        .single();

      if (!patientError && patientData) {
        console.log('✅ PaymentUtils: Found patient ID:', patientData.patient_id);
        return patientData.patient_id;
      }

      // If not found, generate a temporary ID
      const tempPatientId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('⚠️ PaymentUtils: Generated temporary patient ID:', tempPatientId);
      return tempPatientId;
    } catch (error) {
      console.error('❌ PaymentUtils: Error validating patient ID:', error);
      // Generate a temporary ID as fallback
      const tempPatientId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('⚠️ PaymentUtils: Using fallback temporary patient ID:', tempPatientId);
      return tempPatientId;
    }
  },

  // Comprehensive validation for payment data
  async validatePaymentData(paymentData: {
    patient_id?: string;
    patient_name: string;
    appointment_id?: string;
    consultation_id?: string;
  }): Promise<PaymentValidationResult> {
    const result: PaymentValidationResult = {
      isValid: true,
      errors: []
    };

    try {
      // Validate patient ID
      if (paymentData.patient_id) {
        const correctedPatientId = await this.validateAndCorrectPatientId(
          paymentData.patient_name, 
          paymentData.patient_id
        );
        if (correctedPatientId !== paymentData.patient_id) {
          result.correctedPatientId = correctedPatientId;
          result.errors.push('Patient ID was corrected');
        }
      } else {
        const newPatientId = await this.validateAndCorrectPatientId(paymentData.patient_name);
        result.correctedPatientId = newPatientId;
        result.errors.push('Patient ID was generated');
      }

      // Validate appointment ID
      if (paymentData.appointment_id) {
        if (!this.isValidUUID(paymentData.appointment_id)) {
          console.warn('⚠️ PaymentUtils: Invalid appointment_id format, searching by patient name');
          const foundAppointmentId = await this.findAppointmentIdByPatientName(paymentData.patient_name);
          if (foundAppointmentId) {
            result.correctedAppointmentId = foundAppointmentId;
            result.errors.push('Appointment ID was corrected');
          } else {
            result.errors.push('Could not find valid appointment ID');
          }
        }
      } else {
        // Try to find appointment by patient name
        const foundAppointmentId = await this.findAppointmentIdByPatientName(paymentData.patient_name);
        if (foundAppointmentId) {
          result.correctedAppointmentId = foundAppointmentId;
          result.errors.push('Appointment ID was found by patient name');
        }
      }

      return result;
    } catch (error) {
      console.error('❌ PaymentUtils: Error validating payment data:', error);
      result.isValid = false;
      result.errors.push('Validation failed: ' + (error as Error).message);
      return result;
    }
  },

  // Format price for display
  formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount / 100);
  }
}; 