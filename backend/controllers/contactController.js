import nodemailer from 'nodemailer'; // 💡 Changed from sgMail

// 💡 Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

/**
 * Escapes characters that carry special meaning in HTML.
 * Apply to every piece of user-supplied data before embedding it in an
 * HTML email template to prevent XSS / HTML-injection attacks.
 *
 * @param {any} value
 * @returns {string}
 */
const escapeHtml = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#x27;');
};

/**
 * @desc 	Send contact form email
 * @route 	POST /api/contact
 * @access 	Public
 */
const sendContactEmail = async (req, res) => {
    // 💡 Capture all possible data fields
    const { 
        name, email, phone, message, source, address, 
        accountName, bank, accountNumber, bsb, 
        amountPaid, paymentDate, reason 
    } = req.body; 
    
    // Determine the primary message content and ensure it exists for any form submission
    const messageContent = message || reason;

    // 🛑 CRITICAL FIX: Generalized Validation (Only checking name, email, and that *a* message exists)
    if (!name || !email || !messageContent) { 
        return res.status(400).json({ message: 'Missing required fields (Name, Email, and Message/Reason).' });
    }

    // Determine the page source for dynamic content and styling
    const pageSource = source === 'Refund Request' ? 'Refund Policy Page' : 
                        source === 'Support Page' ? 'Support Page' : 
                        'Contact Us Page';
                        
    const primaryColor = source === 'Refund Request' ? '#E9882C' : // Orange/Gold for Refund
                          source === 'Support Page' ? '#1E90FF' : // Blue for Support
                          '#ff9900'; // Default Orange for Contact Us

    const subjectPrefix = source === 'Refund Request' ? '[URGENT REFUND REQUEST]' : 
                          source === 'Support Page' ? '[Prime Mentor SUPPORT REQUEST]' : 
                          '[Prime Mentor CONTACT REQUEST]';

    // ── HTML-safe copies of every user-supplied value ─────────────────────────
    // NEVER interpolate raw user input into HTML — always use these escaped
    // versions to prevent XSS / HTML-injection via email templates.
    const s = {
        name:           escapeHtml(name),
        email:          escapeHtml(email),
        phone:          escapeHtml(phone),
        address:        escapeHtml(address),
        accountName:    escapeHtml(accountName),
        bank:           escapeHtml(bank),
        accountNumber:  escapeHtml(accountNumber),
        bsb:            escapeHtml(bsb),
        amountPaid:     escapeHtml(amountPaid),
        paymentDate:    escapeHtml(paymentDate),
        messageContent: escapeHtml(messageContent),
    };
    // pageSource and primaryColor are server-computed from a limited enum —
    // they don't need escaping, but we escape them defensively anyway.
    const safePageSource = escapeHtml(pageSource);

    // --- UI RICH HTML CONTENT START ---
    let htmlContent = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
            
            <div style="background-color: ${primaryColor}; color: #ffffff; padding: 20px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Prime Mentor</h1>
            </div>

            <div style="padding: 25px;">
                <h2 style="color: ${primaryColor}; margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px; font-size: 20px;">
                    🔔 Submission from the ${safePageSource}
                </h2>
                
                <p style="font-size: 16px;">
                    You have received a new request from ${s.name} via the Prime Mentor website.
                </p>

                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <h3 style="color: #007bff; margin-top: 0; font-size: 18px;">Contact Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px 0; width: 30%; font-weight: bold;">👤 Name:</td>
                            <td style="padding: 5px 0;">${s.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">📧 Email:</td>
                            <td style="padding: 5px 0;"><a href="mailto:${s.email}" style="color: #007bff; text-decoration: none;">${s.email}</a></td>
                        </tr>
                        ${s.phone ? `
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">📱 Phone:</td>
                            <td style="padding: 5px 0;">${s.phone}</td>
                        </tr>
                        ` : ''}
                         ${s.address ? `
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">🏠 Address:</td>
                            <td style="padding: 5px 0;">${s.address}</td>
                        </tr>
                        ` : ''}
                    </table>
                </div>

                ${source === 'Refund Request' ? `
                <div style="background-color: #ffeccf; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #ff9900;">
                    <h3 style="color: #C64F00; margin-top: 0; font-size: 18px;">💸 Refund &amp; Banking Information</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px 0; width: 40%; font-weight: bold;">Amount Requested:</td>
                            <td style="padding: 5px 0; color: #C64F00;">$${s.amountPaid}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">Payment Date:</td>
                            <td style="padding: 5px 0;">${s.paymentDate}</td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding-top: 10px;"><strong style="color: #333;">BANK DETAILS (EFT):</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">Account Name:</td>
                            <td style="padding: 5px 0;">${s.accountName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">Bank:</td>
                            <td style="padding: 5px 0;">${s.bank}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">Account No:</td>
                            <td style="padding: 5px 0;">${s.accountNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">BSB:</td>
                            <td style="padding: 5px 0;">${s.bsb}</td>
                        </tr>
                    </table>
                </div>
                ` : ''}
                <h3 style="color: #333333; font-size: 18px;">${source === 'Refund Request' ? 'Reason for Refund' : 'Message Details'}:</h3>
                <div style="padding: 15px; background-color: #fff; border: 1px dashed #ccc; border-left: 5px solid ${primaryColor}; border-radius: 6px;">
                    <p style="white-space: pre-wrap; margin: 0; font-style: italic;">${s.messageContent}</p>
                </div>
            </div>

            <div style="background-color: #eeeeee; padding: 15px; text-align: center; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-size: 12px; color: #777;">
                <p style="margin: 0;">This email was automatically generated by the Prime Mentor website (${safePageSource}).</p>
                <p style="margin: 5px 0 0;">Reply to this email to contact the sender directly.</p>
            </div>
            
        </div>
    `;
    // --- UI RICH HTML CONTENT END ---

    // The message object for Nodemailer (similar to SendGrid)
    const mailOptions = { // 💡 Renamed from msg
        to: process.env.CONTACT_FORM_RECEIVER_EMAIL, 
        from: process.env.MAIL_USER,         // 💡 Changed from SENDGRID_SENDER_EMAIL to MAIL_USER
        replyTo: email,                              
        subject: `${subjectPrefix} Submission from ${name}`, 
        text: `ORIGIN: ${pageSource}\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nMessage: ${messageContent}`,
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions); // 💡 Changed from sgMail.send(msg)
        res.status(200).json({ message: 'Message sent successfully.' });
    } catch (error) {
        console.error('Nodemailer Error:', error); // 💡 Changed error logging
        res.status(500).json({ message: 'Server error. Failed to send message.' });
    }
};

export { sendContactEmail };