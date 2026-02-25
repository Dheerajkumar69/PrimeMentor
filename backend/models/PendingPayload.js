import mongoose from 'mongoose';

const pendingPayloadSchema = new mongoose.Schema({
    accessCode: { type: String, required: true, unique: true, index: true },
    clerkId: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 }, // TTL: auto-delete after 1 hour
});

const PendingPayload = mongoose.models.PendingPayload || mongoose.model('PendingPayload', pendingPayloadSchema);
export default PendingPayload;
