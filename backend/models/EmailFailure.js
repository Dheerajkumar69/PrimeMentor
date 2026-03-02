// backend/models/EmailFailure.js
// Dead-letter collection for emails that failed after all retries

import mongoose from 'mongoose';

const emailFailureSchema = new mongoose.Schema({
    emailType: { type: String, required: true },       // e.g. 'courseConfirmation', 'paymentFailure'
    recipient: { type: String, required: true },        // email address
    payload: { type: mongoose.Schema.Types.Mixed },     // full arguments passed to the email function
    error: { type: String },                            // last error message
    attempts: { type: Number, default: 0 },             // total attempts made
    retryable: { type: Boolean, default: true },        // can admin retry?
    resolvedAt: { type: Date, default: null },          // set when manually resolved
    meta: { type: mongoose.Schema.Types.Mixed },        // extra context (transactionId, studentId, etc.)
}, { timestamps: true });

// Index for admin queries
emailFailureSchema.index({ retryable: 1, createdAt: -1 });

const EmailFailure = mongoose.model('EmailFailure', emailFailureSchema);
export default EmailFailure;
