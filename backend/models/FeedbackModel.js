// backend/models/FeedbackModel.js

import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    // Student identification (linked to the UserModel)
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    studentClerkId: {
        type: String, // Store Clerk ID for easy student lookups
        required: true,
    },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },

    // Course / Class Details (From the course data)
    courseName: { type: String, required: true },
    teacherName: { type: String, required: true },
    
    // Use combined date/time for easy querying of the specific past session
    sessionDate: { type: String, required: true }, // Format YYYY-MM-DD
    sessionTime: { type: String, required: true }, // Format HH:MM (e.g., "15:00")

    // Rating Section (5-star ratings or numerical)
    clarityRating: { type: Number, min: 1, max: 5, required: true },
    engagingRating: { type: Number, min: 1, max: 5, required: true },
    contentRating: { type: Number, min: 1, max: 5, required: true },
    // Slider rating 0-100
    overallSatisfaction: { type: Number, min: 0, max: 100, required: true }, 

    // Text Feedback Boxes
    likes: { type: String, default: '' },
    improvements: { type: String, default: '' },
    additionalComments: { type: String, default: '' },

    // Metadata
    submittedAt: { type: Date, default: Date.now },
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;