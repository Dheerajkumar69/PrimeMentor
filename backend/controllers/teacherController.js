// backend/controllers/teacherController.js
import TeacherModel from '../models/TeacherModel.js';
import UserModel from '../models/UserModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import ClassRequest from '../models/ClassRequest.js';
import PastClassModel from '../models/PastClassModel.js'; // 🛑 NEW IMPORT

// 12 h — tokens that live for days create a large stolen-credential window.
const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '12h' });

// --- Register (UNCHANGED) ---
export const registerTeacher = async (req, res) => {
    // ... (UNCHANGED CODE) ...
    // Destructure all expected fields from the request body
    const {
        name, email, password, address, mobileNumber, subject,
        accountHolderName, bankName, ifscCode, accountNumber,
        aadharCard, panCard
    } = req.body;

    // 1. FIX: Access file paths correctly from req.files using the field names from upload.fields()
    const imagePath = req.files?.image?.[0]?.filename || '';
    const cvPath = req.files?.cvFile?.[0]?.filename || '';

    try {
        // 2. Basic Validation (Email and Password checked first)
        const exists = await TeacherModel.findOne({ email });
        if (exists) return res.json({ success: false, message: 'Teacher already exists' });
        if (!validator.isEmail(email)) return res.json({ success: false, message: 'Invalid email' });
        if (password.length < 8) return res.json({ success: false, message: 'Password too short' });

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        // 4. Create Teacher Document with ALL fields
        // NOTE: The model will set empty strings to null for fields that are not strictly required.
        const teacher = await TeacherModel.create({
            name,
            email,
            password: hashed,
            image: imagePath, // Profile Picture Filename
            address,
            mobileNumber,
            subject, // Saved as comma-separated string from frontend
            accountHolderName,
            bankName,
            ifscCode,
            accountNumber,
            aadharCard,
            panCard,
            cvFile: cvPath, // CV Document Filename
            status: 'pending' // New teachers start as pending review
        });

        // 5. Do NOT issue a JWT for pending registrations.
        //    Teachers must wait for admin approval and then log in.
        //    Issuing a token here would let them call protected teacher routes
        //    before an admin has reviewed their identity / documents.
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully. You will be notified once your account has been reviewed and approved by an admin.',
        });
    } catch (err) {
        console.error('Teacher registration error:', err);

        // 🛑 FIX: Handle Mongoose Validation Error 
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            const firstError = errors.length > 0 ? errors[0] : 'Missing required data or invalid format.';
            return res.json({ success: false, message: `Validation Failed: ${firstError}` });
        }

        res.json({ success: false, message: 'Server error during registration. Check server console for details.' });
    }
};

// --- Login (UNCHANGED) ---
export const loginTeacher = async (req, res) => {
    // ... (UNCHANGED CODE) ...
    const { email, password } = req.body;
    try {
        const teacher = await TeacherModel.findOne({ email });
        if (!teacher) return res.json({ success: false, message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, teacher.password);
        if (!match) return res.json({ success: false, message: 'Invalid credentials' });

        // Block pending / rejected teachers from obtaining a JWT.
        // Only 'approved' accounts may access the teacher dashboard.
        if (teacher.status !== 'approved') {
            const statusMsg = teacher.status === 'rejected'
                ? 'Your application has been rejected. Please contact support for more information.'
                : 'Your account is pending admin approval. You will be notified once it is reviewed.';
            return res.status(403).json({ success: false, message: statusMsg });
        }

        const token = createToken(teacher._id);
        res.json({
            success: true, token, teacher: {
                _id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                image: teacher.image,
            }
        });
    } catch (err) {
        console.error('Teacher login error:', err);
        res.json({ success: false, message: 'Server error during login' });
    }
};

// **Forgot Password — sends a reset email with token**
export const forgotPasswordTeacher = async (req, res) => {
    const { email } = req.body;
    try {
        const teacher = await TeacherModel.findOne({ email });

        if (!teacher) {
            // Send a generic success message to prevent email enumeration
            return res.json({ success: true, message: 'If a teacher account exists with that email, a password reset link has been sent.' });
        }

        // 1. Generate a unique, time-limited reset token
        const { randomBytes, createHash } = await import('crypto');
        const resetToken = randomBytes(32).toString('hex');

        // 2. Hash the token and save it with a 1-hour expiry
        const hashedToken = createHash('sha256').update(resetToken).digest('hex');
        teacher.resetPasswordToken = hashedToken;
        teacher.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await teacher.save();

        // 3. Build the reset URL and send the email
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/teacher/reset-password?token=${resetToken}&id=${teacher._id}`;

        const { sendPasswordResetEmail } = await import('../utils/emailService.js');
        await sendPasswordResetEmail(teacher.email, teacher.name, resetUrl);

        res.json({ success: true, message: 'If a teacher account exists with that email, a password reset link has been sent.' });
    } catch (err) {
        console.error('Teacher forgot password error:', err);
        res.json({ success: false, message: 'Server error during password reset request.' });
    }
};

// **Reset Password — validates token and updates password**
export const resetPasswordTeacher = async (req, res) => {
    const { token, id, newPassword } = req.body;

    if (!token || !id || !newPassword) {
        return res.status(400).json({ success: false, message: 'Token, teacher ID, and new password are required.' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    try {
        const { createHash } = await import('crypto');
        const hashedToken = createHash('sha256').update(token).digest('hex');

        const teacher = await TeacherModel.findOne({
            _id: id,
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() }, // Token must not be expired
        });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token. Please request a new one.' });
        }

        // Hash the new password and save
        const salt = await bcrypt.genSalt(10);
        teacher.password = await bcrypt.hash(newPassword, salt);
        teacher.resetPasswordToken = null;
        teacher.resetPasswordExpires = null;
        await teacher.save();

        res.json({ success: true, message: 'Password has been reset successfully. You can now log in with your new password.' });
    } catch (err) {
        console.error('Teacher reset password error:', err);
        res.status(500).json({ success: false, message: 'Server error during password reset.' });
    }
};

// --- Class Requests/Managed Classes (UNCHANGED) ---
export const getClassRequests = async (req, res) => {
    // ... (UNCHANGED CODE) ...
    try {
        const teacherId = req.user?._id;
        if (!teacherId) return res.status(401).json({ success: false, message: 'Teacher not authenticated' });

        const requests = await ClassRequest.find({
            teacherId,
            status: 'accepted'
        }).sort({ enrollmentDate: -1 }).lean();

        res.json({ success: true, requests });
    } catch (error) {
        console.error('Error fetching assigned class requests:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getManagedClasses = async (req, res) => {
    // ... (UNCHANGED CODE) ...
    try {
        const teacherId = req.user?._id;
        if (!teacherId) return res.status(401).json({ success: false, message: 'Teacher not authenticated' });

        const classes = await ClassRequest.find({
            teacherId,
            status: 'accepted'
        }).sort({ preferredDate: 1 }).lean();

        res.json({ success: true, classes });
    } catch (error) {
        console.error('Error fetching managed classes:', error);
        res.status(500).json({ message: error.message });
    }
};

export const acceptClassRequest = async (req, res) => {
    // ... (UNCHANGED CODE) ...
    try {
        const requestId = req.params.id;
        const teacherId = req.user?._id;

        const request = await ClassRequest.findById(requestId);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        if (request.teacherId.toString() !== teacherId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to accept this request.' });
        }

        const updatedRequest = await ClassRequest.findByIdAndUpdate(
            requestId,
            { status: 'accepted' },
            { new: true, runValidators: false }
        );

        res.json({ success: true, message: 'Class request accepted', request: updatedRequest });
    } catch (error) {
        console.error('Error accepting class request:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🛑 NEW FUNCTIONALITY: Past Class Submission 🛑
export const submitPastClass = async (req, res) => {
    const {
        sessionDate,
        sessionTime,
        duration,
        studentName,
        topic,
        subTopic
    } = req.body;

    const teacherId = req.user?._id;

    // 1. Basic Validation
    if (!teacherId || !sessionDate || !sessionTime || !duration || !studentName || !topic) {
        return res.status(400).json({ success: false, message: 'Missing required class details.' });
    }

    try {
        // 2. Fetch Teacher Name
        const teacher = await TeacherModel.findById(teacherId).select('name');
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found.' });
        }

        // 3. Create the Past Class record
        const newPastClass = await PastClassModel.create({
            teacherId,
            teacherName: teacher.name,
            sessionDate,
            sessionTime,
            duration,
            studentName,
            topic,
            subTopic,
        });

        res.status(201).json({
            success: true,
            message: 'Past class details submitted successfully for admin review.',
            data: newPastClass
        });

    } catch (error) {
        console.error('Error submitting past class:', error);
        res.status(500).json({ success: false, message: 'Server error during submission.' });
    }
};

// --- Get Logged-In Teacher Profile (for page-refresh re-hydration) ---
export const getTeacherProfile = async (req, res) => {
    try {
        const teacher = req.user; // Set by protectTeacher middleware
        if (!teacher) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }
        res.json({
            success: true,
            teacher: {
                _id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                image: teacher.image,
            }
        });
    } catch (error) {
        console.error('Error fetching teacher profile:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};