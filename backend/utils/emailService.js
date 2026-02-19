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
    return `<li><strong>Session ${index + 1}:</strong> ${req.courseTitle} on <strong>${req.preferredDate}</strong> at <strong>${req.scheduleTime}</strong></li>`;
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

/**
 * Sends an assessment approval email to either the student or the teacher.
 * @param {string} recipientEmail - Email address to send to
 * @param {string} recipientName - Name of the recipient
 * @param {'student'|'teacher'} role - Whether the recipient is a student or teacher
 * @param {object} details - Assessment details
 * @param {string} details.studentName - Full name of the student
 * @param {string} details.teacherName - Full name of the teacher
 * @param {string} details.subject - Subject of the assessment
 * @param {number} details.yearLevel - Year/grade level
 * @param {string} details.scheduledDate - Formatted date string
 * @param {string} details.scheduledTime - Formatted time string
 * @param {string} details.zoomLink - Zoom meeting join URL
 */
export const sendAssessmentApprovalEmail = async (recipientEmail, recipientName, role, details) => {
  const client = getResendClient();
  if (!client) {
    console.error('Skipping sendAssessmentApprovalEmail(): Resend client not configured.');
    return;
  }

  const isStudent = role === 'student';
  const greeting = isStudent
    ? `Dear <strong>${details.studentName}</strong> (and Parent/Guardian),`
    : `Dear <strong>${details.teacherName}</strong>,`;

  const intro = isStudent
    ? `Great news! Your free assessment session has been approved and scheduled. A qualified tutor has been assigned to guide your session.`
    : `You have been assigned to conduct a free assessment session for a new student. Please review the details below and join the Zoom meeting at the scheduled time.`;

  // Teacher gets startUrl (to start as host), student/parent gets joinUrl (join as participant)
  const zoomLink = isStudent ? details.zoomLink : (details.zoomStartLink || details.zoomLink);
  const zoomButtonText = isStudent ? 'Join Zoom Meeting' : 'Start Zoom Meeting (Host)';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Free Assessment Session ${isStudent ? 'Confirmed' : 'Assignment'}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h2 { margin: 0; font-size: 22px; }
            .content { padding: 20px; }
            .details-box { background-color: #fff7ed; padding: 15px; border-radius: 6px; margin-top: 15px; border-left: 4px solid #f97316; }
            .zoom-box { background-color: #eff6ff; padding: 15px; border-radius: 6px; margin-top: 15px; text-align: center; border: 2px solid #3b82f6; }
            .zoom-box a { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; }
            ul { list-style-type: none; padding: 0; }
            li { margin-bottom: 8px; padding: 5px 0; border-bottom: 1px dashed #eee; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>📚 Free Assessment Session ${isStudent ? 'Confirmed!' : 'Assignment'}</h2>
            </div>
            <div class="content">
                <p>${greeting}</p>
                <p>${intro}</p>

                <div class="details-box">
                    <h3 style="margin-top: 0; color: #ea580c;">📋 Session Details</h3>
                    <ul>
                        <li><strong>Student:</strong> ${details.studentName}</li>
                        <li><strong>Year Level:</strong> Year ${details.yearLevel}</li>
                        <li><strong>Subject:</strong> ${details.subject}</li>
                        <li><strong>Teacher:</strong> ${details.teacherName}</li>
                        <li><strong>Date:</strong> ${details.scheduledDate}</li>
                        <li><strong>Time:</strong> ${details.scheduledTime}</li>
                    </ul>
                </div>

                <div class="zoom-box">
                    <p style="margin-top: 0; font-weight: bold; color: #1e40af;">🎥 ${isStudent ? 'Join' : 'Start'} the Zoom Meeting</p>
                    <a href="${zoomLink}">${zoomButtonText}</a>
                    <p style="margin-top: 10px; font-size: 12px; color: #666;">
                        Or copy this link: ${zoomLink}
                    </p>
                    ${!isStudent ? '<p style="margin-top: 8px; font-size: 12px; color: #d97706;"><strong>⚠️ Important:</strong> You are the host. Please click the link above to start the meeting before the scheduled time. Students cannot join until you start it.</p>' : ''}
                </div>

                <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact us at <a href="mailto:info@primementor.com.au">info@primementor.com.au</a>.</p>
                <p>Best regards,<br><strong>The Prime Mentor Team</strong></p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Prime Mentor. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    const subjectLine = isStudent
      ? `✅ Free Assessment Scheduled: ${details.subject} on ${details.scheduledDate}`
      : `📋 New Assessment Assignment: ${details.studentName} — ${details.subject}`;

    const resp = await client.emails.send({
      from: `Prime Mentor <${senderEmail}>`,
      to: [recipientEmail],
      subject: subjectLine,
      html: htmlContent,
    });

    console.log(`Assessment approval email sent to ${role} (${recipientEmail}). Resend ID:`, resp?.id || '[no id]');
    return resp;
  } catch (err) {
    console.error(`Error sending assessment approval email to ${role}:`, err?.message || err);
    throw err;
  }
};

/**
 * Sends a class assignment notification email when admin approves a pending class request.
 * @param {string} recipientEmail - Email address to send to
 * @param {string} recipientName - Name of the recipient
 * @param {'student'|'teacher'} role - Whether the recipient is a student or teacher
 * @param {object} details - Class assignment details
 * @param {string} details.studentName - Full name of the student
 * @param {string} details.teacherName - Full name of the assigned teacher
 * @param {string} details.courseTitle - Title of the course
 * @param {string} details.subject - Subject area
 * @param {string} details.purchaseType - TRIAL or STARTER_PACK
 * @param {string} details.preferredDate - Preferred date string
 * @param {string} details.scheduleTime - Preferred time slot string
 */
export const sendClassAssignmentEmail = async (recipientEmail, recipientName, role, details) => {
  const client = getResendClient();
  if (!client) {
    console.error('Skipping sendClassAssignmentEmail(): Resend client not configured.');
    return;
  }

  const isStudent = role === 'student';
  const courseType = details.purchaseType === 'TRIAL' ? 'Trial Session' : 'Starter Pack';

  const greeting = isStudent
    ? `Dear <strong>${details.studentName}</strong>,`
    : `Dear <strong>${details.teacherName}</strong>,`;

  const intro = isStudent
    ? `Great news! Your <strong>${courseType}</strong> booking for <strong>${details.courseTitle}</strong> has been approved and a qualified tutor has been assigned to you.`
    : `You have been assigned to a new <strong>${courseType}</strong> class for <strong>${details.courseTitle}</strong>. Please review the session details below.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Class Assignment ${isStudent ? 'Confirmed' : 'Notification'}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #004d99, #0066cc); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h2 { margin: 0; font-size: 22px; }
            .content { padding: 20px; }
            .details-box { background-color: #f0f7ff; padding: 15px; border-radius: 6px; margin-top: 15px; border-left: 4px solid #004d99; }
            .note-box { background-color: #fffbeb; padding: 12px; border-radius: 6px; margin-top: 15px; border: 1px solid #f59e0b; }
            ul { list-style-type: none; padding: 0; }
            li { margin-bottom: 8px; padding: 5px 0; border-bottom: 1px dashed #eee; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>📚 Class ${isStudent ? 'Approved!' : 'Assignment'} — ${details.courseTitle}</h2>
            </div>
            <div class="content">
                <p>${greeting}</p>
                <p>${intro}</p>

                <div class="details-box">
                    <h3 style="margin-top: 0; color: #004d99;">📋 Session Details</h3>
                    <ul>
                        <li><strong>Student:</strong> ${details.studentName}</li>
                        <li><strong>Course:</strong> ${details.courseTitle}</li>
                        <li><strong>Subject:</strong> ${details.subject || 'N/A'}</li>
                        <li><strong>Type:</strong> ${courseType}</li>
                        <li><strong>Teacher:</strong> ${details.teacherName}</li>
                        <li><strong>Preferred Date:</strong> ${details.preferredDate || 'To be confirmed'}</li>
                        <li><strong>Preferred Time:</strong> ${details.scheduleTime || 'To be confirmed'}</li>
                    </ul>
                </div>

                <div class="note-box">
                    <p style="margin: 0; font-size: 13px;">
                        <strong>📌 Note:</strong> A Zoom meeting link will be shared with you shortly once the session is finalized.
                    </p>
                </div>

                <p style="margin-top: 20px;">If you have any questions, please contact us at <a href="mailto:info@primementor.com.au">info@primementor.com.au</a>.</p>
                <p>Best regards,<br><strong>The Prime Mentor Team</strong></p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Prime Mentor. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    const subjectLine = isStudent
      ? `✅ Class Approved: ${details.courseTitle} — Teacher Assigned`
      : `📋 New Class Assignment: ${details.studentName} — ${details.courseTitle}`;

    const resp = await client.emails.send({
      from: `Prime Mentor <${senderEmail}>`,
      to: [recipientEmail],
      subject: subjectLine,
      html: htmlContent,
    });

    console.log(`Class assignment email sent to ${role} (${recipientEmail}). Resend ID:`, resp?.id || '[no id]');
    return resp;
  } catch (err) {
    console.error(`Error sending class assignment email to ${role}:`, err?.message || err);
    throw err;
  }
};

/**
 * Sends a booking confirmation email when a student submits a free assessment request.
 * @param {string} recipientEmail - Parent/student email address
 * @param {object} details - Assessment submission details
 * @param {string} details.studentName - Full name of the student
 * @param {string} details.parentName - Full name of the parent
 * @param {string} details.subject - Subject for the assessment
 * @param {string} details.yearLevel - Year/class level
 * @param {string} details.studentEmail - Student's email
 */
export const sendAssessmentBookingConfirmation = async (recipientEmail, details) => {
  const client = getResendClient();
  if (!client) {
    console.error('Skipping sendAssessmentBookingConfirmation(): Resend client not configured.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Free Assessment Booking Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h2 { margin: 0; font-size: 22px; }
            .content { padding: 20px; }
            .details-box { background-color: #fff7ed; padding: 15px; border-radius: 6px; margin-top: 15px; border-left: 4px solid #f97316; }
            .next-steps { background-color: #f0fdf4; padding: 12px; border-radius: 6px; margin-top: 15px; border: 1px solid #22c55e; }
            ul { list-style-type: none; padding: 0; }
            li { margin-bottom: 8px; padding: 5px 0; border-bottom: 1px dashed #eee; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>📚 Free Assessment Booked Successfully!</h2>
            </div>
            <div class="content">
                <p>Dear <strong>${details.parentName}</strong>,</p>
                <p>Thank you for booking a <strong>free assessment session</strong> with <strong>Prime Mentor</strong>! We have received your request and our team will be in touch shortly.</p>

                <div class="details-box">
                    <h3 style="margin-top: 0; color: #ea580c;">📋 Booking Summary</h3>
                    <ul>
                        <li><strong>Student Name:</strong> ${details.studentName}</li>
                        <li><strong>Year Level:</strong> Year ${details.yearLevel}</li>
                        <li><strong>Subject:</strong> ${details.subject}</li>
                        <li><strong>Student Email:</strong> ${details.studentEmail}</li>
                    </ul>
                </div>

                <div class="next-steps">
                    <h3 style="margin-top: 0; color: #16a34a;">✅ What Happens Next?</h3>
                    <ol style="padding-left: 20px; margin: 0;">
                        <li>Our admin team will review your request.</li>
                        <li>A qualified tutor will be assigned for the assessment.</li>
                        <li>You will receive another email with the scheduled date, time, and Zoom meeting link.</li>
                    </ol>
                </div>

                <p style="margin-top: 20px;">If you have any questions in the meantime, please contact us at <a href="mailto:info@primementor.com.au">info@primementor.com.au</a>.</p>
                <p>Best regards,<br><strong>The Prime Mentor Team</strong></p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Prime Mentor. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    const resp = await client.emails.send({
      from: `Prime Mentor <${senderEmail}>`,
      to: [recipientEmail],
      subject: `📚 Free Assessment Booked — ${details.subject} (Year ${details.yearLevel})`,
      html: htmlContent,
    });

    console.log(`Assessment booking confirmation sent to ${recipientEmail}. Resend ID:`, resp?.id || '[no id]');
    return resp;
  } catch (err) {
    console.error('Error sending assessment booking confirmation:', err?.message || err);
    throw err;
  }
};
