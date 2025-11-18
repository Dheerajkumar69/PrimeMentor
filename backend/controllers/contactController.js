import sgMail from '@sendgrid/mail';

// Set the API Key for SendGrid globally using the environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * @desc    Send contact form email
 * @route   POST /api/contact
 * @access  Public
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
                          

    // --- UI RICH HTML CONTENT START ---
    let htmlContent = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
            
            <div style="background-color: ${primaryColor}; color: #ffffff; padding: 20px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Prime Mentor</h1>
            </div>

            <div style="padding: 25px;">
                <h2 style="color: ${primaryColor}; margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px; font-size: 20px;">
                    🔔 Submission from the ${pageSource}
                </h2>
                
                <p style="font-size: 16px;">
                    You have received a new request from ${name} via the Prime Mentor website.
                </p>

                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <h3 style="color: #007bff; margin-top: 0; font-size: 18px;">Contact Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px 0; width: 30%; font-weight: bold;">👤 Name:</td>
                            <td style="padding: 5px 0;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">📧 Email:</td>
                            <td style="padding: 5px 0;"><a href="mailto:${email}" style="color: #007bff; text-decoration: none;">${email}</a></td>
                        </tr>
                        ${phone ? `
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">📱 Phone:</td>
                            <td style="padding: 5px 0;">${phone}</td>
                        </tr>
                        ` : ''}
                         ${address ? `
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">🏠 Address:</td>
                            <td style="padding: 5px 0;">${address}</td>
                        </tr>
                        ` : ''}
                    </table>
                </div>

                ${source === 'Refund Request' ? `
                <div style="background-color: #ffeccf; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #ff9900;">
                    <h3 style="color: #C64F00; margin-top: 0; font-size: 18px;">💸 Refund & Banking Information</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px 0; width: 40%; font-weight: bold;">Amount Requested:</td>
                            <td style="padding: 5px 0; color: #C64F00;">$${amountPaid}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">Payment Date:</td>
                            <td style="padding: 5px 0;">${paymentDate}</td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding-top: 10px;"><strong style="color: #333;">BANK DETAILS (EFT):</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">Account Name:</td>
                            <td style="padding: 5px 0;">${accountName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">Bank:</td>
                            <td style="padding: 5px 0;">${bank}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">Account No:</td>
                            <td style="padding: 5px 0;">${accountNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">BSB:</td>
                            <td style="padding: 5px 0;">${bsb}</td>
                        </tr>
                    </table>
                </div>
                ` : ''}
                <h3 style="color: #333333; font-size: 18px;">${source === 'Refund Request' ? 'Reason for Refund' : 'Message Details'}:</h3>
                <div style="padding: 15px; background-color: #fff; border: 1px dashed #ccc; border-left: 5px solid ${primaryColor}; border-radius: 6px;">
                    <p style="white-space: pre-wrap; margin: 0; font-style: italic;">${messageContent}</p>
                </div>
            </div>

            <div style="background-color: #eeeeee; padding: 15px; text-align: center; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-size: 12px; color: #777;">
                <p style="margin: 0;">This email was automatically generated by the Prime Mentor website (${pageSource}).</p>
                <p style="margin: 5px 0 0;">Reply to this email to contact the sender directly.</p>
            </div>
            
        </div>
    `;
    // --- UI RICH HTML CONTENT END ---

    // The message object for SendGrid
    const msg = {
        to: process.env.CONTACT_FORM_RECEIVER_EMAIL, 
        from: process.env.SENDGRID_SENDER_EMAIL,     
        replyTo: email,                              
        subject: `${subjectPrefix} Submission from ${name}`, 
        text: `ORIGIN: ${pageSource}\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nMessage: ${messageContent}`,
        html: htmlContent,
    };

    try {
        await sgMail.send(msg);
        res.status(200).json({ message: 'Message sent successfully.' });
    } catch (error) {
        console.error('SendGrid Error:', error.response ? error.response.body : error);
        res.status(500).json({ message: 'Server error. Failed to send message.' });
    }
};

export { sendContactEmail };