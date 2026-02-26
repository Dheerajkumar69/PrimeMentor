import mongoose from 'mongoose';

const pendingPayloadSchema = new mongoose.Schema({
    accessCode: { type: String, required: true, unique: true, index: true },
    // studentId holds the MongoDB _id for new-auth students (was clerkId for Clerk users)
    studentId: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 }, // TTL: auto-delete after 1 hour
});

const PendingPayload = mongoose.models.PendingPayload || mongoose.model('PendingPayload', pendingPayloadSchema);
export default PendingPayload;
