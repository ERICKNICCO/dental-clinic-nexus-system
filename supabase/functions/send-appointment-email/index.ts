
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'confirmation' | 'payment_collection';
  to: string;
  subject: string;
  appointmentDate?: string;
  appointmentTime?: string;
  patientName?: string;
  dentistName?: string;
  treatment?: string;
  appointmentId?: string;
  diagnosis?: string;
  estimatedCost?: number;
  consultationId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("📧 Send Appointment Email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: EmailRequest = await req.json();
    console.log("📧 Email data received:", emailData);

    let htmlContent = '';
    let subject = emailData.subject;

    if (emailData.type === 'confirmation') {
      subject = `Appointment Confirmed - ${emailData.appointmentDate}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Appointment Confirmed</h2>
          
          <p>Dear ${emailData.patientName},</p>
          
          <p>Your appointment has been confirmed with the following details:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Date:</strong> ${emailData.appointmentDate}</p>
            <p><strong>Time:</strong> ${emailData.appointmentTime}</p>
            <p><strong>Doctor:</strong> ${emailData.dentistName}</p>
            <p><strong>Treatment:</strong> ${emailData.treatment}</p>
          </div>
          
          <p>Please arrive 15 minutes before your scheduled appointment time.</p>
          
          <p>If you need to reschedule or cancel your appointment, please contact us as soon as possible.</p>
          
          <p>Thank you for choosing our dental clinic!</p>
          
          <p>Best regards,<br>Dental Clinic Team</p>
        </div>
      `;
    } else if (emailData.type === 'payment_collection') {
      subject = `Payment Collection Required - ${emailData.patientName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Payment Collection Required</h2>
          
          <p>Dear Admin,</p>
          
          <p>A consultation has been completed and requires payment collection:</p>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p><strong>Patient:</strong> ${emailData.patientName}</p>
            <p><strong>Diagnosis:</strong> ${emailData.diagnosis}</p>
            <p><strong>Estimated Cost:</strong> $${((emailData.estimatedCost || 0) / 100).toFixed(2)}</p>
            <p><strong>Consultation ID:</strong> ${emailData.consultationId}</p>
          </div>
          
          <p>Please proceed with payment collection through the payment management system.</p>
          
          <p>Best regards,<br>Dental Clinic System</p>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Dental Clinic <appointments@resend.dev>",
      to: [emailData.to],
      subject: subject,
      html: htmlContent,
    });

    console.log("✅ Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in send-appointment-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send email",
        details: error.stack 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
