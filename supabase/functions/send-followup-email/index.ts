
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FollowUpEmailRequest {
  patientName: string;
  patientEmail: string;
  followUpInstructions: string;
  nextAppointment?: string;
  doctorName: string;
  clinicName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      patientName, 
      patientEmail, 
      followUpInstructions, 
      nextAppointment, 
      doctorName, 
      clinicName 
    }: FollowUpEmailRequest = await req.json();

    console.log('Sending follow-up instructions email to:', patientEmail);

    const subject = `Follow-up Instructions - ${patientName}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          ${clinicName} - Follow-up Instructions
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">Patient Information</h3>
          <p><strong>Patient:</strong> ${patientName}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Doctor:</strong> ${doctorName}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #495057;">Follow-up Instructions</h3>
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px;">
            <p style="white-space: pre-wrap; margin: 0;">${followUpInstructions}</p>
          </div>
        </div>

        ${nextAppointment ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #495057;">Next Appointment</h3>
            <p style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 10px; border-radius: 5px;">
              <strong>Date:</strong> ${new Date(nextAppointment).toLocaleDateString()}
            </p>
          </div>
        ` : ''}

        <div style="margin: 20px 0; padding: 15px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px;">
          <h3 style="color: #721c24; margin-top: 0;">Emergency Contact</h3>
          <p style="margin: 0;">If you experience any complications or severe symptoms, please contact us immediately.</p>
        </div>

        <hr style="margin: 30px 0;">
        <p style="text-align: center; color: #6c757d; font-size: 12px;">
          This email was sent from ${clinicName}.<br>
          Please do not reply to this email.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: `${clinicName} <info@resend.dev>`,
      to: [patientEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("Follow-up email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending follow-up email:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
