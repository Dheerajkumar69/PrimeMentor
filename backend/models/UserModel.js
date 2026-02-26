// backend/models/UserModel.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// --- Sub-Schema for nested Courses array ---
const courseSchema = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    teacher: { type: String },
    duration: { type: String },
    preferredDate: { type: String },
    preferredTime: { type: String },
    preferredTimeMonFri: { type: String, default: null },
    preferredTimeSaturday: { type: String, default: null },
    sessionsRemaining: { type: Number, default: 1 },
    status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
    enrollmentDate: { type: Date, default: Date.now },
    zoomMeetingUrl: { type: String },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'paid' },
    transactionId: { type: String, default: null },
    amountPaid: { type: Number, default: 0 },
});

// --- Main User Schema ---
const userSchema = mongoose.Schema({
    // Keep clerkId optional for backward compat with existing data
    clerkId: {
        type: String,
        sparse: true, // allows multiple null values (non-unique nulls)
        default: null,
    },
    studentName: {
        type: String,
        required: true,
        default: 'New Student',
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        default: null, // null for legacy Clerk-only accounts
    },
    courses: [courseSchema],
    guardianEmail: { type: String, trim: true },
    guardianPhone: { type: String },
}, {
    timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;