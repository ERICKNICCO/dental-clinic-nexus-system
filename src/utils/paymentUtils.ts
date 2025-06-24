
import { supabase } from '../integrations/supabase/client';

export const paymentUtils = {
  formatPrice(amountInCents: number): string {
    return `$${(amountInCents / 100).toFixed(2)}`;
  },

  async validateAndCorrectPatientId(patientName: string, providedPatientId?: string): Promise<string> {
    console.log('🔥 PaymentUtils: Validating patient ID for:', patientName, 'Provided ID:', providedPatientId);
    
    // If we have a provided patient ID, verify it exists
    if (providedPatientId) {
      const { data: existingPatient, error } = await supabase
        .from('patients')
        .select('id')
        .eq('id', providedPatientId)
        .single();
      
      if (!error && existingPatient) {
        console.log('✅ PaymentUtils: Validated existing patient ID:', providedPatientId);
        return providedPatientId;
      }
    }
    
    // Look up patient by name
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('name', patientName)
      .single();
    
    if (!patientError && patientData) {
      console.log('✅ PaymentUtils: Found patient ID by name:', patientData.id);
      return patientData.id;
    }
    
    console.error('❌ PaymentUtils: Could not find or validate patient ID');
    throw new Error(`Could not find patient: ${patientName}`);
  },

  async findAppointmentIdByPatientName(patientName: string): Promise<string | null> {
    console.log('🔥 PaymentUtils: Finding appointment ID for patient:', patientName);
    
    const { data: appointmentData, error } = await supabase
      .from('appointments')
      .select('id')
      .eq('patient_name', patientName)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!error && appointmentData) {
      console.log('✅ PaymentUtils: Found appointment ID:', appointmentData.id);
      return appointmentData.id;
    }
    
    console.warn('⚠️ PaymentUtils: Could not find appointment for patient:', patientName);
    return null;
  },

  async validatePaymentData(paymentData: any) {
    const errors: string[] = [];
    let correctedPatientId = paymentData.patient_id;
    let correctedAppointmentId = paymentData.appointment_id;
    
    // Validate patient ID
    try {
      correctedPatientId = await this.validateAndCorrectPatientId(
        paymentData.patient_name, 
        paymentData.patient_id
      );
    } catch (error) {
      errors.push(`Patient validation failed: ${error.message}`);
    }
    
    // Validate appointment ID if provided
    if (paymentData.appointment_id) {
      const { data: appointmentExists } = await supabase
        .from('appointments')
        .select('id')
        .eq('id', paymentData.appointment_id)
        .single();
      
      if (!appointmentExists) {
        // Try to find by patient name
        correctedAppointmentId = await this.findAppointmentIdByPatientName(paymentData.patient_name);
        if (!correctedAppointmentId) {
          errors.push('Could not validate or find appointment ID');
        }
      }
    }
    
    return {
      correctedPatientId,
      correctedAppointmentId,
      errors
    };
  }
};
