// backend/utils/emailService.js
import { Resend } from 'resend';

let resendClient = null;
function getResendClient() {
  if (resendClient) return resendClient;

  const key = process.env.RESEND_API_KEY || process.env.RESEND_KEY;
  if (!key) {
    console.error('❌ RESEND API key missing at runtime. Expected RESEND_API_KEY in env.');
    return null;
  }

  try {
    resendClient = new Resend(key);
    console.log('RESEND client initialized.');
    return resendClient;
  } catch (err) {
    console.error('❌ Failed to initialize Resend client:', err?.message || err);
    return null;
  }
}

const senderEmail = process.env.EMAIL_SENDER || 'info@primementor.com.au';

/**
 * Sends a course confirmation email using Resend.
 */
export const sendCourseConfirmationEmail = async (recipientEmail, courseDetails = {}, studentDetails = {}, classRequests = []) => {
  if (!senderEmail) {
    console.error("FATAL ERROR: EMAIL_SENDER is not defined in env. Cannot send email.");
    return;
  }

  const client = getResendClient();
  if (!client) {
    console.error('Skipping sendCourseConfirmationEmail(): Resend client not configured.');
    return;
  }

  const isTrial = courseDetails.purchaseType === 'TRIAL';
  const courseType = isTrial ? 'Trial Session' : 'Starter Pack';

  const sessionsList = (classRequests || []).map((req, index) => {
    return `<li><strong>Session ${index + 1}:</strong> ${req.courseTitle} on <strong>${req.preferredDate}</strong> at <strong>${req.scheduleTime}</strong> (Timezone: Sydney/NSW Time)</li>`;
  }).join('');

  const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Course Booking Confirmation</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                .header { background-color: #004d99; color: white; padding: 10px 20px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { padding: 20px; }
                .details-box { background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin-top: 20px; }
                h1 { color: #004d99; }
                ul { list-style-type: none; padding: 0; }
                li { margin-bottom: 10px; padding: 5px 0; border-bottom: 1px dashed #eee; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>${courseDetails.courseTitle || 'Course'} - ${courseType} Confirmed!</h2>
                </div>
                <div class="content">
                    <p>Dear <strong>${studentDetails.name || 'Valued Customer'}</strong>,</p>
                    <p>Thank you for booking with us! We are thrilled to confirm your enrollment in the <strong>${courseDetails.courseTitle || 'Course'}</strong> ${courseType}.</p>

                    <div class="details-box">
                        <h3>Booking Summary</h3>
                        <ul>
                            <li><strong>Student Name:</strong> ${studentDetails.name || ''}</li>
                            <li><strong>Email:</strong> ${recipientEmail}</li>
                            <li><strong>Total Amount Paid:</strong> $${courseDetails.amountPaid || 0} ${courseDetails.currency || 'AUD'} (Transaction ID: ${courseDetails.transactionId || 'N/A'})</li>
                            <li><strong>Teacher Status:</strong> A teacher is being assigned and will contact you shortly.</li>
                        </ul>
                    </div>
                    
                    <h3>Scheduled Session(s)</h3>
                    <p>Your sessions have been requested as follows. The final Zoom link will be provided once a teacher is assigned and confirms the class time.</p>
                    <ul>
                        ${sessionsList}
                    </ul>

                    <p>You can view all your course details and future updates on your <strong>My Courses</strong> dashboard.</p>
                    <p>If you have any questions, please reply to this email.</p>
                    <p>Best regards,<br>The ${courseDetails.courseTitle || 'Course'} Team</p>
                </div>
            </div>
        </body>
        </html>
    `;

  try {
    const resp = await client.emails.send({
      from: `Prime Mentor <${senderEmail}>`,
      to: [recipientEmail],
      subject: `✅ Booking Confirmed: ${courseDetails.courseTitle || 'Course'} ${courseType}`,
      html: htmlContent,
    });

    console.log('Course confirmation email sent. Resend ID:', resp?.id || '[no id]');
    return resp;
  } catch (err) {
    console.error('Critical error calling Resend API:', err?.message || err);
    throw err;
  }
};
