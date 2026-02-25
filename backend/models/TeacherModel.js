import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.js';

const teacherSchema = new mongoose.Schema({
    // Account Info (REQUIRED)
    name: { type: String, required: [true, 'Full name is required.'] },
    email: { type: String, required: [true, 'Email is required.'], unique: true },
    password: { type: String, required: [true, 'Password is required.'] },

    // Profile Picture (Technically optional by Mongoose, but mandatory by frontend logic)
    image: { type: String, default: null }, // Store the filename/path

    // Personal Information
    address: { type: String, default: null },
    mobileNumber: { type: String, default: null },
    subject: { type: String, default: null },

    // Banking Details
    accountHolderName: { type: String, default: null },
    bankName: { type: String, default: null },
    ifscCode: { type: String, default: null },
    accountNumber: { type: String, default: null },

    // Identification Documents
    aadharCard: { type: String, default: null },
    panCard: { type: String, default: null },
    cvFile: { type: String, default: null }, // Store the filename/path of the uploaded CV

    // Teacher status (Optional: for Admin approval/review)
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

    // Password reset
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },

}, { timestamps: true });

// ── Field-level encryption (AES-256-GCM) ───────────────────────────────────
// These fields contain financial data or government-issued ID numbers.
// They are encrypted before every write and decrypted after every read so
// that a MongoDB dump or backup never exposes plaintext PII.
//
// Key source: FIELD_ENCRYPTION_KEY environment variable (64 hex chars = 32 bytes).
// See backend/utils/encryption.js for implementation details.

const SENSITIVE_FIELDS = ['accountNumber', 'ifscCode', 'aadharCard', 'panCard'];

/** Encrypt modified sensitive fields before every save */
teacherSchema.pre('save', function (next) {
    SENSITIVE_FIELDS.forEach((field) => {
        // isModified() prevents re-encrypting a value that was already
        // encrypted when the document was loaded from MongoDB.
        if (this.isModified(field) && this[field]) {
            this[field] = encrypt(this[field]);
        }
    });
    next();
});

/** Decrypt sensitive fields when a document is hydrated from MongoDB */
teacherSchema.post('init', function (doc) {
    SENSITIVE_FIELDS.forEach((field) => {
        if (doc[field]) {
            doc[field] = decrypt(doc[field]);
        }
    });
});

// Export as "Teacher" model. If it already exists, use it.
const TeacherModel = mongoose.models.teacher || mongoose.model("Teacher", teacherSchema);

export default TeacherModel;