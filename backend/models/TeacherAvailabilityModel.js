// backend/models/TeacherAvailabilityModel.js

import mongoose from 'mongoose';

/**
 * Validates HH:MM format (24h clock).
 * Accepts 0:00 – 23:59.
 */
const timeFormatValidator = {
    validator: (v) => /^([01]?\d|2[0-3]):\d{2}$/.test(v),
    message: (props) => `"${props.value}" is not a valid time. Use HH:MM 24h format (e.g., 09:00).`,
};

const teacherAvailabilitySchema = new mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: [true, 'teacherId is required.'],
        index: true,
    },
    teacherEmail: {
        type: String,
        required: [true, 'teacherEmail is required.'],
        lowercase: true,
        trim: true,
    },
    dayOfWeek: {
        type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        required: [true, 'dayOfWeek is required.'],
        min: [0, 'dayOfWeek must be 0 (Sun) – 6 (Sat).'],
        max: [6, 'dayOfWeek must be 0 (Sun) – 6 (Sat).'],
    },
    startTime: {
        type: String, // HH:MM format (24h), e.g. "09:00"
        required: [true, 'startTime is required.'],
        validate: timeFormatValidator,
    },
    endTime: {
        type: String, // HH:MM format (24h), e.g. "17:00"
        required: [true, 'endTime is required.'],
        validate: timeFormatValidator,
    },
    subject: {
        type: String,
        default: '',
        trim: true,
    },
    lastUpdatedFromCSV: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

// Pre-save: validate that startTime < endTime
teacherAvailabilitySchema.pre('validate', function (next) {
    if (this.startTime && this.endTime) {
        const [sh, sm] = this.startTime.split(':').map(Number);
        const [eh, em] = this.endTime.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        if (startMin >= endMin) {
            this.invalidate('endTime', `endTime (${this.endTime}) must be after startTime (${this.startTime}).`);
        }
    }
    next();
});

// Compound index for fast lookups: teacher + day
teacherAvailabilitySchema.index({ teacherId: 1, dayOfWeek: 1 });

const TeacherAvailability = mongoose.model('TeacherAvailability', teacherAvailabilitySchema);
export default TeacherAvailability;
