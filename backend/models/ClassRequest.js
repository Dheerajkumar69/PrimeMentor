// backend/models/ClassRequest.js

import mongoose from "mongoose";

const classRequestSchema = new mongoose.Schema(
    {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
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

        status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },

        enrollmentDate: { type: Date, default: Date.now }, 

        // --- NEW FIELD: Manual Zoom Link ---
        zoomMeetingLink: { 
            type: String, 
            default: '', 
        },
        // ------------------------------------

        // 🛑 MODIFIED: Generic Payment Fields 🛑
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'paid', 'refunded'],
            default: 'paid'
        },
        transactionId: { type: String, default: null },
        amountPaid: { type: Number, default: 0 },
        // 🛑 END MODIFIED PAYMENT FIELDS 🛑
    },
    { timestamps: true }
);

classRequestSchema.index({ teacherId: 1, status: 1 });
classRequestSchema.index({ status: 1 });

const ClassRequest = mongoose.models.ClassRequest || mongoose.model("ClassRequest", classRequestSchema);
export default ClassRequest;