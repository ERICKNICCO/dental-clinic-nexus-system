
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Always handle CORS preflight first
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { 
      appointmentId, 
      recipientEmail, 
      patientName, 
      appointmentDate, 
      appointmentTime, 
      treatment, 
      dentist, 
      emailType 
    }: {
      appointmentId: string;
      recipientEmail: string;
      patientName: string;
      appointmentDate: string;
      appointmentTime: string;
      treatment: string;
      dentist: string;
      emailType: 'confirmation' | 'approval' | 'reminder' | 'cancellation';
    } = await req.json();

    console.log('Sending email for appointment:', appointmentId);

    const subject = getEmailSubject(emailType, patientName);
    const htmlContent = getEmailContent(emailType, patientName, appointmentDate, appointmentTime, treatment, dentist);

    const emailResponse = await resend.emails.send({
      from: "SD Dental Clinic <info@sddentalclinic.com>",
      to: [recipientEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email notification in the database
    const { error: logError } = await supabase
      .from('email_notifications')
      .insert({
        appointment_id: appointmentId,
        recipient_email: recipientEmail,
        email_type: emailType,
        subject: subject,
        status: 'sent'
      });

    if (logError) {
      console.error('Error logging email notification:', logError);
    }

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    try {
      // Try logging the failing email to the DB
      const body = await req.clone().json();
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      await supabase
        .from('email_notifications')
        .insert({
          appointment_id: body.appointmentId,
          recipient_email: body.recipientEmail,
          email_type: body.emailType,
          subject: getEmailSubject(body.emailType, body.patientName),
          status: 'failed',
          error_message: error.message
        });
    } catch (logError) {
      console.error('Error logging failed email:', logError);
    }
    // Always return CORS headers even on error!
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

function getEmailSubject(emailType: string, patientName: string): string {
  switch (emailType) {
    case 'confirmation':
      return `Appointment Confirmed - ${patientName}`;
    case 'approval':
      return `Appointment Approved - ${patientName}`;
    case 'reminder':
      return `Appointment Reminder - ${patientName}`;
    case 'cancellation':
      return `Appointment Cancelled - ${patientName}`;
    default:
      return `Appointment Update - ${patientName}`;
  }
}

function getEmailContent(
  emailType: string, 
  patientName: string, 
  date: string, 
  time: string, 
  treatment: string, 
  dentist: string
): string {
  const baseContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">Dental Clinic</h1>
      <h2>Dear ${patientName},</h2>
  `;

  const appointmentDetails = `
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Appointment Details:</h3>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Treatment:</strong> ${treatment}</p>
        <p><strong>Dentist:</strong> ${dentist}</p>
      </div>
  `;

  const footer = `
      <p>If you have any questions, please contact our clinic.</p>
      <p>Best regards,<br>Dental Clinic Team</p>
    </div>
  `;

  switch (emailType) {
    case 'confirmation':
      return baseContent + `
        <p>Your appointment has been confirmed! We look forward to seeing you.</p>
        ${appointmentDetails}
        <p>Please arrive 15 minutes early for check-in.</p>
        ${footer}
      `;
    case 'approval':
      return baseContent + `
        <p>Great news! Your appointment request has been approved.</p>
        ${appointmentDetails}
        <p>Please arrive 15 minutes early for check-in.</p>
        ${footer}
      `;
    case 'reminder':
      return baseContent + `
        <p>This is a friendly reminder about your upcoming appointment.</p>
        ${appointmentDetails}
        <p>Please arrive 15 minutes early for check-in.</p>
        ${footer}
      `;
    case 'cancellation':
      return baseContent + `
        <p>We regret to inform you that your appointment has been cancelled.</p>
        ${appointmentDetails}
        <p>Please contact us to reschedule at your convenience.</p>
        ${footer}
      `;
    default:
      return baseContent + appointmentDetails + footer;
  }
}
