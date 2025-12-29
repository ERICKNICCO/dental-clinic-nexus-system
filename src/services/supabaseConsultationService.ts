import { supabase } from '../integrations/supabase/client';

export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  appointment_id?: string;
  status: 'in-progress' | 'waiting-xray' | 'xray-done' | 'completed' | 'cancelled';

  // Consultation steps
  symptoms: string;
  examination: string;
  vital_signs: {
    bloodPressure?: string;
    temperature?: string;
    heartRate?: string;
    weight?: string;
    height?: string;
  };
  diagnosis: string;
  diagnosis_type?: 'clinical' | 'xray';
  treatment_plan: string;
  prescriptions: string;
  follow_up_instructions: string;
  next_appointment?: string;

  // Structured clinical record (JSONB in DB)
  clinical_record?: any;

  // Treatment cost information
  estimated_cost?: number;
  treatment_items?: Array<{
    name: string;
    cost: number;
    duration: string;
  }>;

  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;

  xray_result?: {
    images: string[];
    note: string;
    radiologist: string;
  } | null;
}

export const supabaseConsultationService = {
  // Start a new consultation
  async startConsultation(patientId: string, doctorId: string, doctorName: string, appointmentId?: string) {
    try {
      console.log('Starting new consultation:', { patientId, doctorId, doctorName, appointmentId });
      
      const consultationData = {
        patient_id: patientId,
        doctor_id: doctorId,
        doctor_name: doctorName,
        appointment_id: appointmentId,
        status: 'in-progress' as const,
        symptoms: '',
        examination: '',
        vital_signs: {},
        diagnosis: '',
        diagnosis_type: 'clinical' as const,
        treatment_plan: '',
        prescriptions: '',
        follow_up_instructions: '',
        clinical_record: null
      };
      
      const { data, error } = await supabase
        .from('consultations')
        .insert(consultationData)
        .select()
        .single();

      if (error) throw error;
      
      console.log('Consultation started with ID:', data.id);

      // If tied to an appointment, set appointment status to Checked In
      if (appointmentId) {
        try {
          console.log('Updating appointment status to Checked In for appointment:', appointmentId);
          const { error: updateError } = await supabase
            .from('appointments')
            .update({ status: 'Checked In' })
            .eq('id', appointmentId);
          if (updateError) throw updateError;
          console.log('Appointment status successfully updated to Checked In for appointment:', appointmentId);
        } catch (err) {
          console.error('Failed to set appointment Checked In:', err);
        }
      }
      
      return data as unknown as Consultation;
    } catch (error) {
      console.error('Error starting consultation:', error);
      throw error;
    }
  },

  // Get active consultation for a patient, optionally scoped to a specific appointment
  async getActiveConsultation(patientId: string, appointmentId?: string): Promise<Consultation | null> {
    try {
      console.log('Fetching active consultation for patient:', patientId, 'appointmentId:', appointmentId);
      
      const baseQuery = supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientId)
        .in('status', ['in-progress', 'waiting-xray', 'xray-done'])
        .order('started_at', { ascending: false });

      // If appointmentId provided, scope to that specific appointment to avoid picking an old record
      const scopedQuery = appointmentId ? baseQuery.eq('appointment_id', appointmentId) : baseQuery;

      const { data, error } = await scopedQuery.limit(1).maybeSingle();

      if (error) throw error;
      
      if (!data) {
        console.log('No active consultation found');
        return null;
      }
      
      console.log('Active consultation found:', data);
      return data as unknown as Consultation;
    } catch (error) {
      console.error('Error fetching active consultation:', error);
      throw error;
    }
  },

  // Get latest completed consultation for a patient
  async getLatestCompletedConsultation(patientId: string): Promise<Consultation | null> {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Consultation | null;
    } catch (error) {
      console.error('Error fetching latest completed consultation:', error);
      return null;
    }
  },

  // Update consultation data
  async updateConsultation(id: string, updates: Partial<Consultation>) {
    try {
      console.log('Updating consultation:', id, updates);
      // Normalize keys to snake_case column names and coerce types
      const payload: Record<string, any> = {};
      if ((updates as any).discountPercent !== undefined) payload.discount_percent = Number((updates as any).discountPercent) || 0;
      if (updates as any && (updates as any).discount_percent !== undefined) payload.discount_percent = Number((updates as any).discount_percent) || 0;
      if ((updates as any).estimated_cost !== undefined) payload.estimated_cost = Number((updates as any).estimated_cost) || 0;
      if ((updates as any).treatment_items !== undefined) {
        const ti = (updates as any).treatment_items;
        payload.treatment_items = Array.isArray(ti) ? ti : []; // guard against scalar
      }
      if ((updates as any).treatment_plan !== undefined) payload.treatment_plan = (updates as any).treatment_plan;
      if ((updates as any).prescriptions !== undefined) payload.prescriptions = (updates as any).prescriptions;
      if ((updates as any).diagnosis !== undefined) payload.diagnosis = (updates as any).diagnosis;
      if ((updates as any).follow_up_instructions !== undefined) payload.follow_up_instructions = (updates as any).follow_up_instructions;

      // Handle status field
      if ((updates as any).status !== undefined) {
        payload.status = (updates as any).status;
        console.log('🔥 updateConsultation: Updating status to:', payload.status);
      }
      
      // Handle authorization_no field
      if ((updates as any).authorization_no !== undefined) payload.authorization_no = (updates as any).authorization_no;
      
      // Handle xray_result field
      if ((updates as any).xray_result !== undefined) payload.xray_result = (updates as any).xray_result;

      // Always update the updated_at timestamp
      payload.updated_at = new Date().toISOString();

      // Fallback: include any safe keys already in snake_case
      const allowed = ['symptoms','examination','vital_signs','diagnosis_type','next_appointment','clinical_record'];
      for (const k of allowed) if ((updates as any)[k] !== undefined) payload[k] = (updates as any)[k];

      console.log('🔥 updateConsultation: Updating consultation with payload:', payload);
      const { error } = await supabase
        .from('consultations')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
      console.log('✅ updateConsultation: Consultation updated successfully');
    } catch (error) {
      console.error('Error updating consultation:', error);
      throw error;
    }
  },

  // Complete consultation
  async completeConsultation(id: string, finalData: Partial<Consultation>) {
    try {
      console.log('Completing consultation via direct update:', id);

      const { error: updateError } = await supabase
        .from('consultations')
        .update({
          ...finalData,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('Failed to mark consultation as completed:', updateError);
        throw updateError;
      }

      console.log('Consultation completed successfully');

      // Ensure payment is created for completed consultation
      try {
        await this.ensurePaymentCreated(id);
      } catch (paymentError) {
        console.warn('Failed to create payment for completed consultation:', paymentError);
        // Don't throw error - consultation was completed successfully
      }

      // Ensure insurance claim is created for insurance patients
      try {
        await this.ensureClaimCreated(id);
      } catch (claimError) {
        console.warn('Failed to create claim for completed consultation:', claimError);
        // Don't throw error - consultation was completed successfully
      }

      // Also set linked appointment to Completed if exists; try to resolve if not linked
      try {
        const { data: consultation, error: fetchError } = await supabase
          .from('consultations')
          .select('appointment_id, patient_id')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('Failed to fetch consultation for appointment update:', fetchError);
        } else {
          let apptId = (consultation as any)?.appointment_id as string | null;

          if (!apptId) {
            // Try to find today\'s appointment for this patient
            const d = new Date();
            const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const { data: candidates, error: findErr } = await supabase
              .from('appointments')
              .select('id')
              .eq('date', todayStr)
              .eq('patient_id', (consultation as any)?.patient_id)
              .in('status', ['Approved','Confirmed','Checked In']);
            if (!findErr && Array.isArray(candidates) && candidates.length > 0) {
              apptId = candidates[0].id as string;
              // Backfill link
              await supabase.from('consultations').update({ appointment_id: apptId }).eq('id', id);
            }
          }

          if (apptId) {
            const { error: apptUpdateError } = await supabase
              .from('appointments')
              .update({ status: 'Completed' })
              .eq('id', apptId);
            if (apptUpdateError) {
              console.error('Failed to update appointment status to Completed:', apptUpdateError);
            } else {
              console.log('Appointment status successfully updated to Completed for appointment:', apptId);
            }
          }
        }
      } catch (err) {
        console.error('Failed to set appointment Completed:', err);
      }
    } catch (error) {
      console.error('Error completing consultation:', error);
      throw error;
    }
  },

  // Ensure payment is created for completed consultation
  async ensurePaymentCreated(consultationId: string) {
    try {
      // Import validation service
      const { PaymentValidationService } = await import('./paymentValidationService');

      console.log('🔍 Validating payment creation for consultation:', consultationId);

      // Comprehensive validation before payment creation
      const validation = await PaymentValidationService.validatePaymentCreation(
        consultationId, 
        '' // Will be determined from consultation
      );

      if (!validation.isValid) {
        // Import error monitoring
        const { ErrorMonitoringService } = await import('./errorMonitoringService');
        
        ErrorMonitoringService.logPaymentValidationError(
          consultationId,
          validation.errors,
          validation.warnings,
          validation.correctedData
        );
        
        console.error('❌ Payment validation failed:', validation.errors);
        throw new Error(`Payment validation failed: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Payment validation warnings:', validation.warnings);
      }

      // Get consultation details for patient ID
      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .select('patient_id')
        .eq('id', consultationId)
        .single();

      if (consultationError || !consultation) {
        throw new Error(`Failed to fetch consultation: ${consultationError?.message}`);
      }

      // Re-validate with correct patient ID
      const finalValidation = await PaymentValidationService.validatePaymentCreation(
        consultationId, 
        consultation.patient_id
      );

      if (!finalValidation.isValid) {
        console.error('❌ Final payment validation failed:', finalValidation.errors);
        throw new Error(`Final payment validation failed: ${finalValidation.errors.join(', ')}`);
      }

      const paymentData = finalValidation.correctedData!;

      console.log('✅ Payment validation passed, creating payment:', {
        consultation_id: consultationId,
        patient_name: paymentData.patient_name,
        treatment_name: paymentData.treatment_name,
        total_amount: paymentData.total_amount,
        final_total: paymentData.final_total,
        payment_method: paymentData.payment_method,
        insurance_provider: paymentData.insurance_provider
      });

      // Create payment record with validated data
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          patient_id: paymentData.patient_id,
          patient_name: paymentData.patient_name,
          treatment_name: paymentData.treatment_name,
          total_amount: paymentData.total_amount,
          discount_percent: paymentData.discount_percent,
          discount_amount: paymentData.discount_amount,
          final_total: paymentData.final_total,
          amount_paid: paymentData.amount_paid,
          payment_status: paymentData.payment_status,
          payment_method: paymentData.payment_method,
          insurance_provider: paymentData.insurance_provider,
          appointment_id: consultation.appointment_id,
          consultation_id: consultationId,
          notes: 'Auto-created on consultation completion',
          payment_date: paymentData.payment_date
        });

      if (paymentError) {
        // Import error monitoring
        const { ErrorMonitoringService } = await import('./errorMonitoringService');
        
        ErrorMonitoringService.logPaymentCreationError(
          consultationId,
          new Error(paymentError.message),
          paymentData
        );
        
        console.error('❌ Failed to create payment:', paymentError);
        throw new Error(`Payment creation failed: ${paymentError.message}`);
      }

      console.log('✅ Payment created successfully for consultation:', consultationId);

    } catch (error) {
      // Import error monitoring
      const { ErrorMonitoringService } = await import('./errorMonitoringService');
      
      ErrorMonitoringService.logPaymentCreationError(
        consultationId,
        error instanceof Error ? error : new Error(String(error)),
        undefined
      );
      
      console.error('❌ Error ensuring payment creation:', error);
      // Don't throw error - consultation was completed successfully
      // Log the error for monitoring but don't break the consultation completion
    }
  },

  // Ensure insurance claim is created for insurance patients
  async ensureClaimCreated(consultationId: string) {
    try {
      // Get consultation details
      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', consultationId)
        .single();

      if (consultationError || !consultation) {
        console.error('Failed to fetch consultation for claim creation:', consultationError);
        return;
      }

      // Get patient details
      const { data: patient } = await supabase
        .from('patients')
        .select('name, patient_type, insurance')
        .eq('id', consultation.patient_id)
        .single();

      // Only create claim for insurance patients
      if (!patient || patient.patient_type !== 'insurance' || !patient.insurance) {
        console.log('Skipping claim creation - patient is not insured or no insurance provider');
        return;
      }

      // Check if claim already exists
      const { data: existingClaim } = await supabase
        .from('insurance_claims')
        .select('id')
        .eq('consultation_id', consultationId)
        .single();

      if (existingClaim) {
        console.log('Insurance claim already exists for consultation:', consultationId);
        return;
      }

      const patientName = patient.name || 'Unknown Patient';

      // Calculate total amount from treatment items
      let totalAmount = 0;
      if (consultation.treatment_items && Array.isArray(consultation.treatment_items)) {
        totalAmount = consultation.treatment_items.reduce((sum: number, item: any) => {
          return sum + ((Number(item.cost) || 0) * (Number(item.quantity) || 1));
        }, 0);
      }

      // Use estimated_cost if treatment_items total is 0
      if (totalAmount === 0 && consultation.estimated_cost) {
        totalAmount = Number(consultation.estimated_cost);
      }

      // Default consultation fee if still 0
      if (totalAmount === 0) {
        totalAmount = 30000; // Default consultation fee
      }

      // Create insurance claim record
      const { error: claimError } = await supabase
        .from('insurance_claims')
        .insert({
          patient_id: consultation.patient_id,
          patient_name: patientName,
          consultation_id: consultationId,
          appointment_id: consultation.appointment_id,
          insurance_provider: patient.insurance,
          treatment_details: {
            diagnosis: consultation.diagnosis || '',
            treatment_plan: consultation.treatment_plan || '',
            procedures: consultation.treatment_items && Array.isArray(consultation.treatment_items) 
              ? consultation.treatment_items.map((item: any) => item.name) 
              : [],
            total_amount: Math.round(totalAmount)
          },
          patient_signature: '', // Will be filled when claim is submitted
          claim_status: 'draft'
        });

      if (claimError) {
        // Check if it's a duplicate key error (unique constraint violation)
        if (claimError.code === '23505' && claimError.message.includes('unique_consultation_insurance_claim')) {
          console.log('Insurance claim already exists for consultation:', consultationId);
        } else {
          console.error('Failed to create insurance claim for consultation:', claimError);
        }
      } else {
        console.log('✅ Insurance claim created successfully for consultation:', consultationId);
      }
    } catch (error) {
      console.error('Error ensuring claim creation:', error);
    }
  },

  // Reopen a completed consultation (doctor-only UI should call this)
  async reopenConsultation(id: string) {
    try {
      console.log('Reopening consultation:', id);
      const { error } = await supabase
        .from('consultations')
        .update({ status: 'in-progress', completed_at: null })
        .eq('id', id)
        .eq('status', 'completed');
      if (error) throw error;
      console.log('Consultation reopened');
    } catch (error) {
      console.error('Error reopening consultation:', error);
      throw error;
    }
  },

  // Get consultations for a patient
  async getPatientConsultations(patientId: string) {
    try {
      console.log('Fetching consultations for patient:', patientId);
      
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched consultations:', data);
      return data as unknown as Consultation[];
    } catch (error) {
      console.error('Error fetching consultations:', error);
      throw error;
    }
  },

  // Get consultation by ID (legacy method)
  async getConsultation(id: string) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as Consultation;
    } catch (error) {
      console.error('Error fetching consultation:', error);
      throw error;
    }
  },

  // Get all consultations (for admin)
  async getAllConsultations() {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Consultation[];
    } catch (error) {
      console.error('Error fetching all consultations:', error);
      throw error;
    }
  },

  // Get waiting X-ray consultations
  async getWaitingXRayConsultations() {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('status', 'waiting-xray')
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Consultation[];
    } catch (error) {
      console.error('Error fetching waiting X-ray consultations:', error);
      throw error;
    }
  },

  // Get latest consultation by appointment ID
  async getLatestConsultationByAppointmentId(appointmentId: string) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Consultation | null;
    } catch (error) {
      console.error('Error fetching latest consultation by appointment ID:', error);
      throw error;
    }
  },

  // Hard delete a consultation and its related payment records
  async deleteConsultation(id: string) {
    try {
      // Delete payment records first to avoid FK issues
      await supabase.from('payments').delete().eq('consultation_id', id);
      // Delete consultation
      const { error } = await supabase.from('consultations').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting consultation:', error);
      throw error;
    }
  }
};