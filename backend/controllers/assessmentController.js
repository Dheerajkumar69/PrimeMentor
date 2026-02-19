// backend/controllers/assessmentController.js
import Assessment from '../models/AssessmentModel.js';
import asyncHandler from 'express-async-handler';
import { sendAssessmentBookingConfirmation } from '../utils/emailService.js';
import { resolveTimezone } from '../utils/timezoneHelper.js';

// @desc    Submit new free assessment request from the modal
// @route   POST /api/assessments/submit
// @access  Public
const submitAssessmentRequest = asyncHandler(async (req, res) => {
    // Destructure all fields being sent from the AssessmentModal.jsx
    const {
        studentFirstName, studentLastName, studentEmail, studentPhone,
        parentFirstName, parentLastName, parentEmail,
        contactNumber, subject, class: studentClass,
        postalCode, country,
    } = req.body;

    // Comprehensive validation for all required fields
    if (!studentFirstName || !studentLastName || !studentEmail ||
        !parentFirstName || !parentLastName || !parentEmail ||
        !contactNumber || !subject || !studentClass) {
        res.status(400);
        console.error('Missing fields:', {
            studentFirstName, studentLastName, studentEmail,
            parentFirstName, parentLastName, parentEmail,
            contactNumber, subject, studentClass
        });
        throw new Error('Missing one or more required fields for assessment submission.');
    }

    // Trim all string inputs to prevent whitespace-only submissions
    const trimmed = {
        studentFirstName: String(studentFirstName).trim(),
        studentLastName: String(studentLastName).trim(),
        studentEmail: String(studentEmail).trim().toLowerCase(),
        studentPhone: studentPhone ? String(studentPhone).trim() : null,
        parentFirstName: String(parentFirstName).trim(),
        parentLastName: String(parentLastName).trim(),
        parentEmail: String(parentEmail).trim().toLowerCase(),
        contactNumber: String(contactNumber).trim(),
        subject: String(subject).trim(),
        postalCode: postalCode ? String(postalCode).trim() : null,
        country: country ? String(country).trim() : null,
    };

    // Validate trimmed required fields aren't empty
    const requiredTrimmed = ['studentFirstName', 'studentLastName', 'studentEmail',
        'parentFirstName', 'parentLastName', 'parentEmail', 'contactNumber', 'subject'];
    for (const key of requiredTrimmed) {
        if (!trimmed[key]) {
            res.status(400);
            throw new Error(`Field "${key}" cannot be empty or whitespace-only.`);
        }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed.studentEmail)) {
        res.status(400);
        throw new Error('Invalid student email address format.');
    }
    if (!emailRegex.test(trimmed.parentEmail)) {
        res.status(400);
        throw new Error('Invalid parent email address format.');
    }

    // Validate class/year range (2-12)
    const classNum = parseInt(studentClass, 10);
    if (isNaN(classNum) || classNum < 2 || classNum > 12) {
        res.status(400);
        throw new Error('Class/Year level must be between 2 and 12.');
    }

    // Sanitize phone numbers — strip everything except digits, +, and spaces
    const sanitizePhone = (ph) => ph ? ph.replace(/[^\d+\s()-]/g, '').trim() : null;
    trimmed.contactNumber = sanitizePhone(trimmed.contactNumber);
    trimmed.studentPhone = sanitizePhone(trimmed.studentPhone);

    // Resolve student timezone from postal code + country
    let studentTimezone = 'UTC';
    if (trimmed.postalCode && trimmed.country) {
        try {
            studentTimezone = await resolveTimezone(trimmed.postalCode, trimmed.country);
        } catch (tzErr) {
            console.warn('⚠️ Timezone resolution failed:', tzErr.message, '— defaulting to UTC');
        }
    }

    try {
        const newAssessment = await Assessment.create({
            ...trimmed,
            class: classNum,
            studentTimezone,
            isFreeAssessment: true,
        });

        // Send confirmation email to parent AND student (non-blocking — don't fail the request if email fails)
        const emailDetails = {
            studentName: `${trimmed.studentFirstName} ${trimmed.studentLastName}`,
            parentName: `${trimmed.parentFirstName} ${trimmed.parentLastName}`,
            subject: trimmed.subject,
            yearLevel: classNum,
            studentEmail: trimmed.studentEmail,
        };

        // Send only to student email
        const recipients = [trimmed.studentEmail].filter(Boolean);
        console.log('📧 Attempting to send assessment booking confirmation to:', recipients);

        for (const email of recipients) {
            try {
                const result = await sendAssessmentBookingConfirmation(email, emailDetails);
                console.log('✅ Assessment booking confirmation email sent to:', email, '| Result:', JSON.stringify(result));
            } catch (emailErr) {
                console.error('⚠️ Failed to send assessment booking confirmation to:', email, '| Error:', emailErr.message, emailErr);
            }
        }

        res.status(201).json({
            message: 'Assessment request saved successfully.',
            data: newAssessment
        });

    } catch (error) {
        console.error('Error saving assessment request to database:', error);
        // This will often show Mongoose validation errors if types/requirements are wrong
        res.status(500).json({
            message: 'Server error saving request to database.',
            detail: error.message
        });
    }
});

// @desc    Get all *free* assessment requests for the admin panel
// @route   GET /api/assessments
// @access  Private (Admin Only)
const getAllAssessments = asyncHandler(async (req, res) => {
    // 🛑 FIX: Add query filter to only fetch documents where isFreeAssessment is true
    const assessments = await Assessment.find({ isFreeAssessment: true }).sort({ createdAt: -1 });
    res.status(200).json(assessments);
});

export { submitAssessmentRequest, getAllAssessments };