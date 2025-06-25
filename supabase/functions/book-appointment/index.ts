
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookAppointmentRequest {
  fullName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  doctor: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const appointmentData: BookAppointmentRequest = await req.json();
    
    console.log('🔥 Received appointment booking request:', appointmentData);

    // Validate required fields
    if (!appointmentData.fullName || !appointmentData.email || !appointmentData.phone || 
        !appointmentData.date || !appointmentData.time || !appointmentData.doctor) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert appointment into database
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        date: appointmentData.date,
        time: appointmentData.time,
        patient_name: appointmentData.fullName,
        patient_phone: appointmentData.phone,
        patient_email: appointmentData.email,
        patient_id: null, // Will be set when appointment is approved
        treatment: 'General Consultation',
        dentist: appointmentData.doctor,
        status: 'Pending',
        notes: appointmentData.message || null
      })
      .select()
      .single();

    if (appointmentError) {
      console.error('❌ Error inserting appointment:', appointmentError);
      return new Response(JSON.stringify({ error: 'Failed to book appointment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Appointment booked successfully:', appointment);

    // Create notification for admin/staff
    try {
      await supabase
        .from('notifications')
        .insert({
          type: 'appointment',
          title: 'New Website Appointment',
          message: `New appointment from website: ${appointmentData.fullName} for ${appointmentData.date} at ${appointmentData.time} with ${appointmentData.doctor}`,
          target_doctor_name: null, // null means notify all admins
          appointment_id: appointment.id
        });
      
      console.log('✅ Notification created for new appointment');
    } catch (notificationError) {
      console.error('❌ Error creating notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Send confirmation email to patient
    try {
      const { error: emailError } = await supabase.functions.invoke('send-appointment-email', {
        body: {
          to: appointmentData.email,
          subject: 'Appointment Request Received - SD Dental Clinic',
          appointmentDate: appointmentData.date,
          appointmentTime: appointmentData.time,
          patientName: appointmentData.fullName,
          dentistName: appointmentData.doctor,
          treatment: 'General Consultation',
          appointmentId: appointment.id,
          type: 'booking_confirmation'
        }
      });

      if (emailError) {
        console.error('❌ Error sending confirmation email:', emailError);
      } else {
        console.log('✅ Confirmation email sent to patient');
      }
    } catch (emailError) {
      console.error('❌ Error with email service:', emailError);
      // Don't fail the request if email fails
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Appointment booked successfully',
      appointmentId: appointment.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in book-appointment function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
