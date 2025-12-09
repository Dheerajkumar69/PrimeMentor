// backend/utils/emailService.js

import { Resend } from 'resend';

// Initialize Resend Client using the API Key from .env
const resend = new Resend(process.env.RESEND_API_KEY);
const senderEmail = process.env.EMAIL_SENDER; // info@primementor.com.au

/**
 * Sends a course confirmation email using Resend.
 * @param {string} recipientEmail - The email address to send the confirmation to.
 * @param {object} courseDetails - Details of the booked course.
 * @param {object} studentDetails - Details of the student.
 * @param {Array<object>} classRequests - Array of class session requests.
 */
export const sendCourseConfirmationEmail = async (recipientEmail, courseDetails, studentDetails, classRequests) => {
    
    if (!senderEmail) {
        console.error("FATAL ERROR: EMAIL_SENDER is not defined in .env. Cannot send email.");
        return;
    }
    
    const isTrial = courseDetails.purchaseType === 'TRIAL';
    const courseType = isTrial ? 'Trial Session' : 'Starter Pack';

    const sessionsList = classRequests.map((req, index) => {
        return `<li><strong>Session ${index + 1}:</strong> ${req.courseTitle} on <strong>${req.preferredDate}</strong> at <strong>${req.scheduleTime}</strong> (Timezone: Sydney/NSW Time)</li>`;
    }).join('');

    // HTML Content remains the same (just ensuring we have the correct formatting)
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
                    <h2>${courseDetails.courseTitle} - ${courseType} Confirmed!</h2>
                </div>
                <div class="content">
                    <p>Dear <strong>${studentDetails.name || 'Valued Customer'}</strong>,</p>
                    <p>Thank you for booking with us! We are thrilled to confirm your enrollment in the **${courseDetails.courseTitle}** ${courseType}.</p>

                    <div class="details-box">
                        <h3>Booking Summary</h3>
                        <ul>
                            <li><strong>Student Name:</strong> ${studentDetails.name}</li>
                            <li><strong>Email:</strong> ${recipientEmail}</li>
                            <li><strong>Total Amount Paid:</strong> $${courseDetails.amountPaid} ${courseDetails.currency || 'AUD'} (Transaction ID: ${courseDetails.transactionId})</li>
                            <li><strong>Teacher Status:</strong> A teacher is being assigned and will contact you shortly.</li>
                        </ul>
                    </div>
                    
                    <h3>Scheduled Session(s)</h3>
                    <p>Your sessions have been requested as follows. The final Zoom link will be provided once a teacher is assigned and confirms the class time.</p>
                    <ul>
                        ${sessionsList}
                    </ul>

                    <p>You can view all your course details and future updates on your **My Courses** dashboard.</p>
                    <p>If you have any questions, please reply to this email.</p>
                    <p>Best regards,<br>The ${courseDetails.courseTitle} Team</p>
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: `Prime Mentor <${senderEmail}>`, // Format: "Name <email@domain.com>"
            to: [recipientEmail],
            subject: `✅ Booking Confirmed: ${courseDetails.courseTitle} ${courseType}`,
            html: htmlContent,
        });

        if (error) {
            console.error('Error sending course confirmation email via Resend:', error);
            // Log the error ID for lookup in Resend dashboard
            console.error('Resend Error ID:', data?.id); 
        } else {
            console.log('Course confirmation email sent successfully via Resend. ID:', data.id);
        }
    } catch (error) {
        console.error('Critical error calling Resend API:', error.message);
    }
};