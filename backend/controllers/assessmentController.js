// backend/controllers/assessmentController.js
import Assessment from '../models/AssessmentModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Submit new free assessment request from the modal
// @route   POST /api/assessments/submit
// @access  Public
const submitAssessmentRequest = asyncHandler(async (req, res) => {
    // Destructure all fields being sent from the AssessmentModal.jsx
    const { 
        studentFirstName, studentLastName, studentEmail,
        parentFirstName, parentLastName, parentEmail,
        contactNumber, subject, class: studentClass, 
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

    try {
        const newAssessment = await Assessment.create({
            studentFirstName, studentLastName, studentEmail,
            parentFirstName, parentLastName, parentEmail,
            contactNumber,
            subject,
            class: studentClass,
            // Explicitly set this field for confirmation
            isFreeAssessment: true, 
        });

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