
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
    const htmlContent = getModernEmailContent(emailType, patientName, appointmentDate, appointmentTime, treatment, dentist);

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

function getModernEmailContent(
  emailType: string,
  patientName: string,
  date: string,
  time: string,
  treatment: string,
  dentist: string
): string {
  let headerTitle = "";
  let mainMessage = "";
  let bottomMessage = "";

  switch (emailType) {
    case "confirmation":
      headerTitle = "Appointment Confirmed";
      mainMessage = "We are pleased to confirm your dental appointment. Below are your appointment details:";
      bottomMessage = "Please arrive <strong>15 minutes early</strong> for check-in. If you have any questions, feel free to contact us.";
      break;
    case "approval":
      headerTitle = "Appointment Approved";
      mainMessage = "Great news! Your appointment request has been approved. Below are your appointment details:";
      bottomMessage = "Please arrive <strong>15 minutes early</strong> for check-in. If you have any questions, feel free to contact us.";
      break;
    case "reminder":
      headerTitle = "Appointment Reminder";
      mainMessage = "This is a friendly reminder about your upcoming dental appointment:";
      bottomMessage = "Please arrive <strong>15 minutes early</strong> for check-in. If you have any questions, feel free to contact us.";
      break;
    case "cancellation":
      headerTitle = "Appointment Cancelled";
      mainMessage = "We regret to inform you that your appointment has been cancelled. Here were your appointment details:";
      bottomMessage = "Please contact us to reschedule at your convenience. We apologize for any inconvenience.";
      break;
    default:
      headerTitle = "Appointment Update";
      mainMessage = "Please see your appointment details below:";
      bottomMessage = "Please arrive <strong>15 minutes early</strong> for check-in. If you have any questions, feel free to contact us.";
      break;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${headerTitle}</title>
      <style>
        body {
          background-color: #f3f4f6;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .logo-section {
          background-color: #ffffff;
          padding: 20px;
          text-align: center;
          border-bottom: 2px solid #f1f5ff;
        }
        .logo-section img {
          max-width: 200px;
          height: auto;
        }
        .banner-section {
          width: 100%;
          display: block;
        }
        .banner-section img {
          width: 100%;
          height: auto;
          display: block;
        }
        .header {
          background-color: #007BFF;
          padding: 30px 20px;
          color: white;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          letter-spacing: 1px;
        }
        .content {
          padding: 30px 20px;
          color: #333;
        }
        .content h2 {
          font-size: 18px;
          color: #007BFF;
        }
        .content p {
          line-height: 1.6;
          font-size: 15px;
        }
        .appointment-box {
          background-color: #f1f5ff;
          border-left: 5px solid #007BFF;
          padding: 15px 20px;
          margin-top: 20px;
          border-radius: 8px;
        }
        .appointment-box p {
          margin: 6px 0;
          font-size: 15px;
        }
        .footer {
          background-color: #f9fafb;
          text-align: center;
          font-size: 13px;
          padding: 20px;
          color: #777;
        }
        .footer a {
          color: #007BFF;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="logo-section">
          <img src="https://ulknlrckbrwkxpakdrfn.supabase.co/storage/v1/object/public/images/0bf25785-d496-446f-adcc-3c105fc24d90.png" alt="SD Dental Clinic Logo" />
        </div>
        
        <div class="banner-section">
          <img src="https://ulknlrckbrwkxpakdrfn.supabase.co/storage/v1/object/public/images/2d52b191-e483-4876-8452-96a4e3c3503a.png" alt="SD Dental Clinic Banner" />
        </div>

        <div class="header">
          <h1>${headerTitle}</h1>
        </div>

        <div class="content">
          <p>Dear <strong>${patientName}</strong>,</p>
          <p>${mainMessage}</p>

          <div class="appointment-box">
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Treatment:</strong> ${treatment}</p>
            <p><strong>Dentist:</strong> ${dentist}</p>
          </div>

          <p style="margin-top: 20px;">
            ${bottomMessage}
          </p>
        </div>

        <div class="footer">
          Best regards,<br />
          <strong>SD Dental Clinic Team</strong><br />
          <a href="https://sddentalclinic.com">www.sddentalclinic.com</a><br /><br />
          &copy; ${new Date().getFullYear()} SD Dental Clinic. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}
