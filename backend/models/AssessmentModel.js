// backend/models/AssessmentModel.js
import mongoose from 'mongoose';

const assessmentSchema = mongoose.Schema(
    {
        // Student Details (Required by the form)
        studentFirstName: { type: String, required: true, trim: true, maxlength: 100 },
        studentLastName: { type: String, required: true, trim: true, maxlength: 100 },
        studentEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
        studentPhone: {
            type: String,
            default: null,
            trim: true,
            maxlength: 20,
            validate: {
                validator: (v) => v === null || /^[\d+\s()-]*$/.test(v),
                message: 'Student phone must contain only digits, +, spaces, hyphens, and parentheses.',
            },
        },

        // Parent/Contact Details (Required by the form)
        parentFirstName: { type: String, required: true, trim: true, maxlength: 100 },
        parentLastName: { type: String, required: true, trim: true, maxlength: 100 },
        parentEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
        contactNumber: {
            type: String,
            required: true,
            trim: true,
            maxlength: 20,
            validate: {
                validator: (v) => /^[\d+\s()-]+$/.test(v),
                message: 'Contact number must contain only digits, +, spaces, hyphens, and parentheses.',
            },
        },

        // Assessment Focus (Required by the form)
        subject: { type: String, required: true, trim: true, maxlength: 100 },
        class: { type: Number, required: true, min: 2, max: 12 },

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

        // Multiple teachers assigned (all receive the Zoom host link)
        teacherIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
        teacherNames: [{ type: String }],
        teacherEmails: [{ type: String }],

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