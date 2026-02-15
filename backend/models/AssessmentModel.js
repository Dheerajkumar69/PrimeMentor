// backend/models/AssessmentModel.js
import mongoose from 'mongoose';

const assessmentSchema = mongoose.Schema(
    {
        // Student Details (Required by the form)
        studentFirstName: { type: String, required: true },
        studentLastName: { type: String, required: true },
        studentEmail: { type: String, required: true },

        // Parent/Contact Details (Required by the form)
        parentFirstName: { type: String, required: true },
        parentLastName: { type: String, required: true },
        parentEmail: { type: String, required: true },
        contactNumber: { type: String, required: true },

        // Assessment Focus (Required by the form)
        subject: { type: String, required: true },
        class: { type: Number, required: true },

        // CRITICAL: New Field to confirm it's a free assessment request
        isFreeAssessment: {
            type: Boolean,
            default: true, // All submissions from the public form are free assessments
            required: true,
        },

        // Admin Tracking
        status: {
            type: String,
            enum: ['New', 'Contacted', 'Scheduled', 'Completed', 'Canceled'],
            default: 'New'
        },
        adminNotes: { type: String, default: '' },

        // Teacher Assignment (populated when admin approves)
        teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
        teacherName: { type: String, default: null },
        teacherEmail: { type: String, default: null },

        // Scheduling (populated when admin approves)
        scheduledDate: { type: Date, default: null },
        scheduledTime: { type: String, default: null },

        // Zoom Meeting (auto-created on approval)
        zoomMeetingLink: { type: String, default: null },
        zoomStartLink: { type: String, default: null },
        zoomMeetingId: { type: String, default: null },
    },
    {
        timestamps: true,
    }
);

const Assessment = mongoose.model('Assessment', assessmentSchema);

export default Assessment;