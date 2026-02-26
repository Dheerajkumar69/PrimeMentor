// backend/models/ClassRequest.js

import mongoose from "mongoose";

const classRequestSchema = new mongoose.Schema(
    {
        courseId: { type: String, required: true },
        courseTitle: { type: String, required: true },
        studentId: { type: String, required: true },
        studentName: { type: String, required: true },

        teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", default: null },

        // Fields related to scheduling
        purchaseType: { type: String, enum: ["TRIAL", "STARTER_PACK"], default: 'TRIAL' },

        // CRITICAL: Store Australian date as a string (YYYY-MM-DD)
        preferredDate: { type: String },

        // CRITICAL: Store Australian time slot as a string (HH:MM AM/PM - HH:MM AM/PM)
        scheduleTime: { type: String },
        preferredTimeMonFri: { type: String },
        preferredTimeSaturday: { type: String },
        postcode: { type: String },

        subject: { type: String, default: 'Unassigned' },

        // Student details snapshot — stored at payment time for admin display
        studentDetails: {
            firstName: { type: String, default: '' },
            lastName: { type: String, default: '' },
            email: { type: String, default: '' },
        },

        status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },

        enrollmentDate: { type: Date, default: Date.now },

        // Zoom Meeting Details (auto-created when admin assigns a teacher)
        zoomMeetingLink: {
            type: String,
            default: '',
        },
        zoomStartLink: {
            type: String,
            default: null,
        },
        zoomMeetingId: {
            type: String,
            default: null,
        },
        zoomHostEmail: {
            type: String,
            default: null,
        },

        // Payment Fields
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'paid', 'refunded'],
            default: 'paid'
        },
        transactionId: { type: String, default: null },
        amountPaid: { type: Number, default: 0 },
        promoCodeUsed: { type: String, default: null },
        discountApplied: { type: Number, default: 0 },
        currency: { type: String, default: 'AUD' },
    },
    { timestamps: true }
);

classRequestSchema.index({ teacherId: 1, status: 1 });
classRequestSchema.index({ status: 1 });
classRequestSchema.index({ paymentStatus: 1, createdAt: -1 });

const ClassRequest = mongoose.models.ClassRequest || mongoose.model("ClassRequest", classRequestSchema);
export default ClassRequest;