
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
    console.log("🚀 Email function called with method:", req.method);
    console.log("🔑 RESEND_API_KEY available:", !!Deno.env.get("RESEND_API_KEY"));
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const requestBody = await req.json();
    console.log("📨 Request body received:", JSON.stringify(requestBody, null, 2));

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
    } = requestBody;

    console.log('📧 Sending email for appointment:', appointmentId);
    console.log('📧 Recipient email:', recipientEmail);
    console.log('📧 Email type:', emailType);

    if (!recipientEmail) {
      console.error('❌ No recipient email provided');
      throw new Error('Recipient email is required');
    }

    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error('❌ RESEND_API_KEY is not set');
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    const subject = getEmailSubject(emailType, patientName);
    const htmlContent = getProfessionalEmailContent(emailType, patientName, appointmentDate, appointmentTime, treatment, dentist);

    console.log('📬 Email subject:', subject);
    console.log('📮 About to send email via Resend...');

    const emailResponse = await resend.emails.send({
      from: "SD Dental Clinic <info@sddentalclinic.com>",
      to: [recipientEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("✅ Email sent successfully:", emailResponse);

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
      console.error('⚠️ Error logging email notification:', logError);
    } else {
      console.log('📝 Email notification logged successfully');
    }

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('❌ Error in send-appointment-email:', error);
    console.error('❌ Error stack:', error.stack);
    
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
      console.log('📝 Failed email logged to database');
    } catch (logError) {
      console.error('❌ Error logging failed email:', logError);
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

// Fixed: More professional, modern styling for emails without undefined logoUrl
function getProfessionalEmailContent(
  emailType: string,
  patientName: string,
  date: string,
  time: string,
  treatment: string,
  dentist: string
): string {
  const clinicBrandColor = "#2563eb"; // brand blue
  const secondaryColor = "#f4f8ff"; // pale blue bg box
  const cardShadow = "0 4px 20px rgba(37,99,235,0.09)";
  const now = new Date();
  const year = now.getFullYear();

  let mainMessage = "";
  switch (emailType) {
    case "confirmation":
      mainMessage =
        "Your appointment has been <span style='color:#249749; font-weight:600'>confirmed</span>! We look forward to seeing you.";
      break;
    case "approval":
      mainMessage =
        "Great news! Your appointment request has been <span style='color:#249749; font-weight:600'>approved</span>.";
      break;
    case "reminder":
      mainMessage =
        "This is a friendly reminder about your upcoming dental appointment.";
      break;
    case "cancellation":
      mainMessage =
        "<span style='color:#e84141; font-weight:600'>We regret to inform you that your appointment has been cancelled.</span>";
      break;
    default:
      mainMessage = "Please see your appointment details below.";
      break;
  }

  let bottomMessage = "";
  if (emailType === "cancellation") {
    bottomMessage =
      "<p style='margin:18px 0 0 0'>Please contact us to reschedule at your convenience.</p>";
  } else {
    bottomMessage =
      "<p style='margin:18px 0 0 0'>Please arrive <b>15 minutes early</b> for check-in.</p>";
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Appointment Notification</title>
    </head>
    <body style="background:${secondaryColor}; margin:0; padding:0; font-family:Segoe UI,Arial,sans-serif;">
      <table align="center" width="100%" bgcolor="${secondaryColor}" style="padding:32px 0;">
        <tr>
          <td>
            <table align="center" width="600" style="background:#fff; border-radius:14px; box-shadow:${cardShadow}; padding: 0 0 32px 0;">
              <tr>
                <td style="text-align:center; padding-top:32px;">
                  <h1 style="margin:0; color:${clinicBrandColor}; font-family:Segoe UI,Arial,sans-serif; font-size:2rem; letter-spacing:1px;">SD Dental Clinic</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 48px 0 48px;">
                  <h2 style="font-weight:600; color:#101828; font-size:1.18rem; margin: 0 0 12px 0;">Dear ${patientName},</h2>
                  <p style="font-size: 1rem; color:#182136; margin:0 0 18px 0;">${mainMessage}</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0; background:${secondaryColor}; border-radius:10px;">
                    <tr>
                      <td style="padding:18px 26px;">
                        <h3 style="margin:0 0 10px 0; color:${clinicBrandColor}; font-size:1rem; font-weight:600; letter-spacing:0.5px;">Appointment Details</h3>
                        <table style="color:#222; font-size:1rem;">
                          <tr>
                            <td style="padding: 4px 14px 4px 0;"><strong>Date:</strong></td>
                            <td>${date}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 14px 4px 0;"><strong>Time:</strong></td>
                            <td>${time}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 14px 4px 0;"><strong>Treatment:</strong></td>
                            <td>${treatment}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 14px 4px 0;"><strong>Dentist:</strong></td>
                            <td>${dentist}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  ${bottomMessage}
                  <p style="margin:18px 0 0 0; color:#536178;">If you have any questions, please contact our clinic.</p>
                  <div style="margin:32px 0 0 0; border-top:1px solid #e5e8f2; padding-top:18px; text-align:left">
                    <p style="color:#777d92; font-size:13px; margin:0;">
                      Best regards,<br/>
                      <span style="color:${clinicBrandColor}; font-weight:bold;">SD Dental Clinic Team</span>
                    </p>
                    <p style="color:#b4b4b4; font-size:11px; margin:14px 0 0 0;">© ${year} SD Dental Clinic. All rights reserved.</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
