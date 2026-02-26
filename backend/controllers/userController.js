// backend/controllers/userController.js

import asyncHandler from 'express-async-handler';
import User from '../models/UserModel.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import ClassRequest from '../models/ClassRequest.js';
import rapid from 'eway-rapid';
import FeedbackModel from '../models/FeedbackModel.js';
import PendingPayload from '../models/PendingPayload.js';
import PromoCode from '../models/PromoCodeModel.js';
import PricingModel from '../models/PricingModel.js';
import { sendCourseConfirmationEmail, sendNewPurchaseNotification, sendPaymentFailureEmail, sendPasswordResetEmail } from '../utils/emailService.js';

dotenv.config();

// ── eWAY initialization ──
const EWAY_API_KEY = process.env.EWAY_API_KEY;
const EWAY_PASSWORD = process.env.EWAY_PASSWORD;
const EWAY_ENDPOINT = process.env.EWAY_ENDPOINT || 'sandbox';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

if (!EWAY_API_KEY || !EWAY_PASSWORD) {
    console.error("FATAL ERROR: EWAY_API_KEY or EWAY_PASSWORD is not defined in .env");
}

const ewayClient = rapid.createClient(EWAY_API_KEY, EWAY_PASSWORD, EWAY_ENDPOINT);

// ── JWT helper ──
const generateStudentToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ============================================================
// AUTH CONTROLLERS
// ============================================================

// @desc  Register a new student
// @route POST /api/student/register
// @access Public
export const registerStudent = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide name, email and password.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
        if (existing.password) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists. Please log in.' });
        }
        // Legacy Clerk account — allow them to set a password
        existing.studentName = name;
        existing.password = password; // will be hashed by pre-save hook
        await existing.save();
        const token = generateStudentToken(existing._id.toString());
        return res.status(200).json({
            success: true,
            message: 'Account updated. You can now log in with your password.',
            token,
            student: { _id: existing._id, name: existing.studentName, email: existing.email },
        });
    }

    const user = await User.create({
        studentName: name,
        email: email.toLowerCase().trim(),
        password,
    });

    const token = generateStudentToken(user._id.toString());
    res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        token,
        student: { _id: user._id, name: user.studentName, email: user.email },
    });
});


// @desc  Login student
// @route POST /api/student/login
// @access Public
export const loginStudent = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !user.password) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateStudentToken(user._id.toString());
    res.json({
        success: true,
        token,
        student: { _id: user._id, name: user.studentName, email: user.email },
    });
});


// @desc  Forgot password — send reset link
// @route POST /api/student/forgot-password
// @access Public
export const forgotStudentPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success to prevent email enumeration
    if (!user || !user.password) {
        return res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    try {
        await sendPasswordResetEmail(user.email, user.studentName, resetUrl);
    } catch (err) {
        console.error('Failed to send password reset email:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again later.' });
    }

    res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
});


// @desc  Reset password using token from email
// @route POST /api/student/reset-password
// @access Public
export const resetStudentPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.password = password; // pre-save hook hashes it
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
});




// @desc  Get student profile
// @route GET /api/student/me
// @access Private
export const getStudentProfile = asyncHandler(async (req, res) => {
    const user = req.user; // set by protect middleware
    res.json({
        success: true,
        student: { _id: user._id, name: user.studentName, email: user.email },
    });
});


// ============================================================
// SESSION DATE HELPER
// ============================================================
const generateSessionDates = (preferredDate, count) => {
    const sessionsCount = (typeof count === 'number' && Number.isFinite(count) && count > 0) ? count : 6;
    const MAX_ITERATIONS = sessionsCount + 60;
    const sessionDates = [];

    if (!preferredDate || typeof preferredDate !== 'string') return sessionDates;

    const dateParts = preferredDate.split('-').map(Number);
    if (dateParts.length !== 3 || dateParts.some(isNaN)) return sessionDates;

    let currentDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
    if (isNaN(currentDate.getTime())) return sessionDates;

    let iterations = 0;
    while (sessionDates.length < sessionsCount && iterations < MAX_ITERATIONS) {
        iterations++;
        if (currentDate.getUTCDay() !== 0) {
            const yyyy = currentDate.getUTCFullYear();
            const mm = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(currentDate.getUTCDate()).padStart(2, '0');
            sessionDates.push(`${yyyy}-${mm}-${dd}`);
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    return sessionDates;
};


// ============================================================
// PROMO CODE
// ============================================================
export const validatePromoCode = asyncHandler(async (req, res) => {
    const { code } = req.body;
    const now = new Date();

    if (!code) return res.status(400).json({ message: 'Promo code is required.' });

    const promo = await PromoCode.findOne({ code: code.toUpperCase() });
    if (!promo) return res.status(404).json({ message: 'Promo code not found or invalid.' });
    if (!promo.isActive) return res.status(400).json({ message: 'Promo code is not active.' });
    if (promo.expiryDate && promo.expiryDate < now) return res.status(400).json({ message: 'Promo code has expired.' });

    res.json({
        message: 'Promo code applied successfully!',
        code: promo.code,
        discountPercentage: promo.discountPercentage,
    });
});


// ============================================================
// PAYMENT: INITIATE
// ============================================================
export const initiatePaymentAndBooking = asyncHandler(async (req, res) => {
    // req.user is set by protect middleware (JWT)
    const studentId = req.user._id.toString();
    const { bookingPayload } = req.body;
    const { paymentAmount, currency = 'AUD' } = bookingPayload;

    try {
        const amountInCents = Math.round(paymentAmount * 100);
        const cleanCancelUrl = `${FRONTEND_URL}/enrollment?step=3`;

        console.log(`Creating eWAY Shared Payment URL for studentId: ${studentId} amount: $${paymentAmount}`);

        const response = await ewayClient.createTransaction(rapid.Enum.Method.RESPONSIVE_SHARED, {
            Payment: { TotalAmount: amountInCents, CurrencyCode: currency },
            Customer: { Reference: studentId },
            RedirectUrl: `${FRONTEND_URL}/payment-status?studentId=${studentId}`,
            CancelUrl: cleanCancelUrl,
            TransactionType: "Purchase",
            PartnerAgreementGuid: studentId,
            DeviceID: 'NODESDK',
        });

        if (response.getErrors().length > 0) {
            const errors = response.getErrors().map(e => rapid.getMessage(e, "en"));
            return res.status(500).json({ success: false, message: errors.join(' | ') || 'eWAY initialization failed.' });
        }

        const redirectURL = response.get('SharedPaymentUrl');
        const accessCode = response.get('AccessCode');

        if (!redirectURL) return res.status(500).json({ success: false, message: 'eWAY did not return a Redirect URL.' });

        await PendingPayload.findOneAndUpdate(
            { accessCode },
            { accessCode, payload: bookingPayload, studentId },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, redirectUrl: redirectURL, accessCode, message: 'Redirecting to eWAY secure payment page.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error during eWAY payment initiation.' });
    }
});


// ============================================================
// PAYMENT: FINISH
// ============================================================
export const finishEwayPaymentAndBooking = asyncHandler(async (req, res) => {
    const { accessCode, bookingPayload } = req.body;
    // Use authenticated user from middleware
    const studentId = req.user?._id?.toString() || req.body?.studentId;

    if (!accessCode) return res.status(400).json({ success: false, message: "Missing eWAY AccessCode." });
    if (!studentId) return res.status(401).json({ success: false, message: "Authentication failed. Missing student ID." });

    let transactionSucceeded = false;
    let transactionID = null;
    let errorDetails = 'Payment processing failed.';
    let classRequestsToSave = [];

    try {
        const response = await ewayClient.queryTransaction(accessCode);
        const transaction = response.get('Transactions[0]');

        if (!transaction) throw new Error("Transaction result not found with the provided AccessCode.");

        if (transaction.TransactionStatus) {
            transactionSucceeded = true;
            transactionID = String(transaction.TransactionID);

            const alreadyProcessed = await ClassRequest.findOne({ transactionId: transactionID }).lean();
            if (alreadyProcessed) {
                await PendingPayload.deleteOne({ accessCode });
                return res.status(200).json({ success: true, message: 'Payment already processed. Your booking is confirmed.', alreadyProcessed: true });
            }
        } else {
            const responseMessage = transaction.ResponseMessage || '';
            const errorCodes = responseMessage.split(', ').filter(Boolean).map(code => {
                try { return rapid.getMessage(code, "en"); } catch { return code; }
            });
            const failureReason = errorCodes.join(' | ') || 'Transaction declined by bank.';
            errorDetails = `Payment declined: ${failureReason}`;
            transactionID = String(transaction.TransactionID || 'N/A');

            try {
                const cachedEntry = await PendingPayload.findOneAndDelete({ accessCode });
                const failedPayload = cachedEntry ? cachedEntry.payload : bookingPayload;

                if (failedPayload) {
                    const courseDetails = failedPayload.courseDetails || {};
                    const studentDetails = failedPayload.studentDetails || {};
                    const guardianDetails = failedPayload.guardianDetails || {};
                    const rawAmount = failedPayload.paymentAmount;
                    const amount = (typeof rawAmount === 'number' && Number.isFinite(rawAmount) && rawAmount > 0) ? rawAmount : 0;

                    await ClassRequest.create({
                        courseId: courseDetails.courseId || 'unknown',
                        courseTitle: courseDetails.courseTitle || 'Unknown Course',
                        studentId,
                        studentName: studentDetails.first && studentDetails.last ? `${studentDetails.first} ${studentDetails.last}` : 'Unknown Student',
                        purchaseType: failedPayload.scheduleDetails?.purchaseType || 'TRIAL',
                        preferredDate: failedPayload.scheduleDetails?.preferredDate || null,
                        scheduleTime: failedPayload.scheduleDetails?.preferredTime || null,
                        subject: courseDetails.subject || 'N/A',
                        studentDetails: { firstName: studentDetails.first || '', lastName: studentDetails.last || '', email: studentDetails.email || guardianDetails.email || '' },
                        paymentStatus: 'failed',
                        transactionId: transactionID,
                        amountPaid: amount,
                        failureReason,
                        currency: 'AUD',
                        status: 'rejected',
                    });

                    const customerEmail = studentDetails.email || guardianDetails.email;
                    if (customerEmail && customerEmail.includes('@')) {
                        await sendPaymentFailureEmail(customerEmail, {
                            studentName: studentDetails.first ? `${studentDetails.first} ${studentDetails.last || ''}`.trim() : 'Valued Customer',
                            courseTitle: courseDetails.courseTitle || 'Course',
                            amountAttempted: amount > 0 ? amount.toFixed(2) : '0.00',
                            currency: 'AUD',
                            failureReason,
                            transactionId: transactionID,
                        }).catch(e => console.error('Failed to send payment failure email:', e.message));
                    }
                }
            } catch (trackingErr) {
                console.error('Failed to create failed payment tracking record:', trackingErr?.message);
            }

            return res.status(400).json({ success: false, message: `Payment declined. ${errorCodes[0] || 'Transaction declined by bank.'}` });
        }

        // ── Finalize booking ──
        const cachedEntry = await PendingPayload.findOneAndDelete({ accessCode });
        const resolvedPayload = cachedEntry ? cachedEntry.payload : bookingPayload;

        if (!resolvedPayload) throw new Error("Payment successful, but booking data was lost during redirect. Please contact support.");

        // ── REPEAT booking ──
        if (resolvedPayload.type === 'REPEAT') {
            const repeatRequests = (resolvedPayload.sessionDates || []).map((dateStr, i) => new ClassRequest({
                courseId: resolvedPayload.courseId || 'unknown',
                courseTitle: `${(resolvedPayload.courseName || 'Course').split('(')[0].trim()} (Repeat ${i + 1}/${resolvedPayload.repeatWeeks})`,
                studentId,
                studentName: resolvedPayload.studentName || 'Unknown Student',
                purchaseType: 'TRIAL',
                preferredDate: dateStr,
                scheduleTime: resolvedPayload.timeSlot || 'N/A',
                subject: resolvedPayload.courseSubject || 'N/A',
                studentDetails: {
                    firstName: (resolvedPayload.studentName || '').split(' ')[0] || '',
                    lastName: (resolvedPayload.studentName || '').split(' ').slice(1).join(' ') || '',
                    email: resolvedPayload.studentEmail || '',
                },
                status: 'pending', paymentStatus: 'paid', transactionId: transactionID,
                amountPaid: resolvedPayload.sessionPrice || 0, currency: resolvedPayload.currency || 'AUD',
            }));

            await ClassRequest.insertMany(repeatRequests);

            const emailRecipient = resolvedPayload.studentEmail;
            if (emailRecipient && emailRecipient.includes('@')) {
                await sendCourseConfirmationEmail(emailRecipient, {
                    courseTitle: resolvedPayload.courseName || 'Course', transactionId: transactionID,
                    amountPaid: resolvedPayload.paymentAmount || 0, currency: resolvedPayload.currency || 'AUD',
                }, { name: resolvedPayload.studentName || 'Student' }, repeatRequests).catch(e => console.error('Failed to send repeat email:', e.message));
            }

            await sendNewPurchaseNotification({
                studentName: resolvedPayload.studentName, studentEmail: resolvedPayload.studentEmail,
                courseTitle: resolvedPayload.courseName, amountPaid: resolvedPayload.paymentAmount,
                transactionId: transactionID, purchaseType: `REPEAT (${resolvedPayload.repeatWeeks} sessions)`,
            }, repeatRequests).catch(e => console.error('Failed to send notification:', e.message));

            return res.status(201).json({
                success: true,
                message: `Payment successful! ${repeatRequests.length} repeat class(es) booked. Confirmation email sent.`,
                requestsCreated: repeatRequests.length, dates: resolvedPayload.sessionDates, transactionId: transactionID,
            });
        }

        // ── Standard booking ──
        const courseDetails = resolvedPayload.courseDetails || {};
        const scheduleDetails = resolvedPayload.scheduleDetails || {};
        const studentDetails = resolvedPayload.studentDetails || {};
        const guardianDetails = resolvedPayload.guardianDetails || {};
        const rawPaymentAmount = resolvedPayload.paymentAmount;
        const promoCode = resolvedPayload.promoCode || null;
        const appliedDiscountAmount = Number(resolvedPayload.appliedDiscountAmount) || 0;

        const paymentAmount = (typeof rawPaymentAmount === 'number' && Number.isFinite(rawPaymentAmount) && rawPaymentAmount > 0) ? rawPaymentAmount : null;
        if (!paymentAmount) return res.status(400).json({ success: false, message: 'Invalid payment amount in booking data.' });
        if (!courseDetails.courseTitle) return res.status(400).json({ success: false, message: 'Missing course title in booking data.' });

        const {
            purchaseType = 'TRIAL', preferredDate = null, preferredTime = null,
            preferredWeekStart = null, preferredTimeMonFri = null, preferredTimeSaturday = null,
            postcode = null, numberOfSessions = 1,
        } = scheduleDetails;

        const nameToUse = studentDetails?.first && studentDetails?.last ? `${studentDetails.first} ${studentDetails.last}` : "New Student";
        const emailToUse = studentDetails?.email || guardianDetails?.email || req.user?.email || 'unknown@example.com';

        let student = await User.findByIdAndUpdate(
            studentId,
            { $set: { email: emailToUse, studentName: nameToUse, guardianEmail: guardianDetails?.email, guardianPhone: guardianDetails?.phone } },
            { new: true, upsert: false }
        );
        if (!student) student = req.user;

        const courseExists = student.courses.some(c => c.name === courseDetails.courseTitle);
        const isTrial = purchaseType === 'TRIAL';
        const initialPreferredDate = isTrial ? preferredDate : preferredWeekStart;
        const initialPreferredTime = isTrial ? preferredTime : preferredTimeMonFri;

        if (!initialPreferredDate || !initialPreferredTime) {
            return res.status(400).json({ success: false, message: "Missing preferred date or time for booking." });
        }

        if (isTrial) {
            classRequestsToSave.push({
                courseId: courseDetails.courseId, courseTitle: courseDetails.courseTitle,
                studentId, studentName: student.studentName, purchaseType: 'TRIAL',
                preferredDate, scheduleTime: preferredTime, postcode,
                subject: courseDetails.subject || 'N/A',
                studentDetails: { firstName: studentDetails?.first || '', lastName: studentDetails?.last || '', email: emailToUse },
                paymentStatus: 'paid', transactionId: transactionID, amountPaid: paymentAmount,
                currency: 'AUD', promoCodeUsed: promoCode, discountApplied: appliedDiscountAmount,
            });
        } else {
            const startDate = preferredWeekStart || preferredDate;
            const safeCount = (typeof numberOfSessions === 'number' && Number.isFinite(numberOfSessions) && numberOfSessions > 0) ? numberOfSessions : 6;
            const dates = generateSessionDates(startDate, safeCount);
            if (!dates || dates.length === 0) return res.status(500).json({ success: false, message: 'Failed to generate session dates.' });

            const sessionsToCreate = Math.min(safeCount, dates.length);
            const perSessionCost = paymentAmount / sessionsToCreate;

            for (let i = 0; i < sessionsToCreate; i++) {
                const dateObj = new Date(Date.UTC(...dates[i].split('-').map((v, idx) => idx === 1 ? Number(v) - 1 : Number(v))));
                const dayOfWeek = dateObj.getUTCDay();
                const sessionTime = (dayOfWeek >= 1 && dayOfWeek <= 5) ? preferredTimeMonFri : preferredTimeSaturday;
                classRequestsToSave.push({
                    courseId: courseDetails.courseId,
                    courseTitle: `${courseDetails.courseTitle} (Session ${i + 1}/${sessionsToCreate})`,
                    studentId, studentName: student.studentName, purchaseType: 'STARTER_PACK',
                    preferredDate: dates[i], scheduleTime: sessionTime,
                    preferredTimeMonFri, preferredTimeSaturday, postcode,
                    subject: courseDetails.subject || 'N/A',
                    studentDetails: { firstName: studentDetails?.first || '', lastName: studentDetails?.last || '', email: emailToUse },
                    paymentStatus: 'paid', transactionId: transactionID, amountPaid: perSessionCost,
                    currency: 'AUD', promoCodeUsed: promoCode,
                });
            }
        }

        await ClassRequest.insertMany(classRequestsToSave.map(d => new ClassRequest(d)));

        let newCourse = null;
        if (!courseExists) {
            newCourse = {
                name: courseDetails.courseTitle,
                description: isTrial ? `Trial session for ${courseDetails.courseTitle}` : `Starter Pack for ${courseDetails.courseTitle}`,
                teacher: 'Pending Teacher', duration: isTrial ? '1 hour trial' : `${numberOfSessions} sessions total`,
                preferredDate: isTrial ? preferredDate : preferredWeekStart,
                preferredTime: initialPreferredTime, status: 'pending', enrollmentDate: new Date(), zoomMeetingUrl: '',
                preferredTimeMonFri: isTrial ? null : preferredTimeMonFri,
                preferredTimeSaturday: isTrial ? null : preferredTimeSaturday,
                sessionsRemaining: isTrial ? 1 : numberOfSessions,
                paymentStatus: 'paid', transactionId: transactionID, amountPaid: paymentAmount,
            };
            student.courses.push(newCourse);
            await student.save();
        }

        const isValidEmail = (e) => typeof e === 'string' && e.trim().length > 3 && e.includes('@');
        const emailRecipient = isValidEmail(studentDetails?.email) ? studentDetails.email.trim()
            : isValidEmail(guardianDetails?.email) ? guardianDetails.email.trim()
                : isValidEmail(student.email) ? student.email.trim() : null;

        if (emailRecipient) {
            await sendCourseConfirmationEmail(emailRecipient, {
                courseTitle: courseDetails.courseTitle || 'Course', purchaseType: purchaseType || 'TRIAL',
                amountPaid: paymentAmount.toFixed(2), currency: 'AUD', transactionId: transactionID || 'N/A',
                promoCode: promoCode || null, discountApplied: appliedDiscountAmount || 0,
            }, { name: student.studentName || 'Valued Student' }, classRequestsToSave)
                .catch(e => console.error('Failed to send confirmation email:', e.message));
        }

        await sendNewPurchaseNotification({
            studentName: student.studentName || nameToUse, studentEmail: emailRecipient || 'N/A',
            courseTitle: courseDetails.courseTitle || 'Course', purchaseType: purchaseType || 'TRIAL',
            amountPaid: paymentAmount.toFixed(2), currency: 'AUD', transactionId: transactionID || 'N/A',
            promoCode: promoCode || null, discountApplied: appliedDiscountAmount || 0,
        }, classRequestsToSave).catch(e => console.error('Failed to send company notification:', e.message));

        res.status(201).json({
            success: true,
            message: 'Payment successful. Booking submitted to admin. Confirmation email sent.',
            course: newCourse || student.courses.find(c => c.name === courseDetails.courseTitle),
        });

    } catch (error) {
        console.error('Error in eWAY finish payment/booking flow:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Server error during eWAY payment confirmation.' });
    }
});


// ============================================================
// COURSES
// ============================================================
export const getUserCourses = asyncHandler(async (req, res) => {
    // req.user is the Mongoose user document from protect middleware
    const user = req.user;
    res.status(200).json({ courses: user.courses });
});


// ============================================================
// DEPRECATED BOOKING
// ============================================================
export const createBooking = asyncHandler(async (req, res) => {
    return res.status(405).json({ success: false, message: "Use /initiate-payment endpoint for new bookings." });
});


// ============================================================
// FEEDBACK
// ============================================================
export const submitFeedback = asyncHandler(async (req, res) => {
    const studentMongooseId = req.user._id;
    const studentName = req.user.studentName;
    const studentEmail = req.user.email;

    const {
        courseName, teacherName, sessionDate, sessionTime,
        clarityRating, engagingRating, contentRating, overallSatisfaction,
        likes, improvements, additionalComments,
    } = req.body;

    if (!courseName || !teacherName || !sessionDate || !clarityRating || !engagingRating || !contentRating) {
        return res.status(400).json({ message: 'Missing required class or rating information.' });
    }

    const newFeedback = new FeedbackModel({
        student: studentMongooseId,
        studentName: studentName || 'N/A',
        studentEmail: studentEmail || 'N/A',
        courseName, teacherName, sessionDate, sessionTime,
        clarityRating, engagingRating, contentRating, overallSatisfaction,
        likes: likes || '', improvements: improvements || '', additionalComments: additionalComments || '',
    });

    const createdFeedback = await newFeedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully!', feedback: createdFeedback });
});


// ============================================================
// REPEAT CLASSES
// ============================================================
export const requestRepeatClasses = asyncHandler(async (req, res) => {
    const student = req.user;
    const { courseId, dayOfWeek, timeSlot, repeatWeeks } = req.body;

    if (!courseId || !timeSlot || dayOfWeek === undefined) {
        return res.status(400).json({ success: false, message: "Missing required fields: courseId, dayOfWeek, timeSlot." });
    }

    const parsedDay = parseInt(dayOfWeek, 10);
    if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 6) {
        return res.status(400).json({ success: false, message: "dayOfWeek must be 1 (Mon) through 6 (Sat)." });
    }

    const weeks = parseInt(repeatWeeks, 10);
    if (isNaN(weeks) || weeks < 1 || weeks > 12) {
        return res.status(400).json({ success: false, message: "repeatWeeks must be between 1 and 12." });
    }

    const course = student.courses.id(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found in your enrollment." });

    const auFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' });
    const todayStr = auFormatter.format(new Date());
    const todayParts = todayStr.split('-').map(Number);
    let cursor = new Date(Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2]));
    const currentDayUTC = cursor.getUTCDay();
    let daysToAdd = parsedDay - currentDayUTC;
    if (daysToAdd <= 0) daysToAdd += 7;
    cursor.setUTCDate(cursor.getUTCDate() + daysToAdd);

    const sessionDates = [];
    for (let i = 0; i < weeks; i++) {
        sessionDates.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}-${String(cursor.getUTCDate()).padStart(2, '0')}`);
        cursor.setUTCDate(cursor.getUTCDate() + 7);
    }

    const classRequests = sessionDates.map((dateStr, i) => new ClassRequest({
        courseId: course._id, courseTitle: `${course.name.split('(')[0].trim()} (Repeat ${i + 1}/${weeks})`,
        studentId: student._id.toString(), studentName: student.studentName,
        purchaseType: 'TRIAL', preferredDate: dateStr, scheduleTime: timeSlot,
        status: 'pending', paymentStatus: 'unpaid', amountPaid: 0,
    }));

    await ClassRequest.insertMany(classRequests);
    res.status(201).json({
        success: true,
        message: `${weeks} recurring class request(s) created!`,
        requestsCreated: classRequests.length, dates: sessionDates,
    });
});


// ============================================================
// REPEAT PAYMENT
// ============================================================
function extractYearLevel(courseName) {
    const match = (courseName || '').match(/Year\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
}

function getSessionPriceForYear(classRanges, yearLevel) {
    if (!yearLevel || !classRanges) return null;
    for (const [range, prices] of Object.entries(classRanges)) {
        const [low, high] = range.split('-').map(Number);
        if (yearLevel >= low && yearLevel <= high) return prices.sessionPrice;
    }
    return null;
}

export const initiateRepeatPayment = asyncHandler(async (req, res) => {
    const student = req.user;
    const { courseId, dayOfWeek, timeSlot, repeatWeeks } = req.body;

    if (!courseId || !timeSlot || dayOfWeek === undefined) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const parsedDay = parseInt(dayOfWeek, 10);
    if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 6) {
        return res.status(400).json({ success: false, message: "dayOfWeek must be 1 (Mon) through 6 (Sat)." });
    }

    const weeks = parseInt(repeatWeeks, 10);
    if (isNaN(weeks) || weeks < 1 || weeks > 12) {
        return res.status(400).json({ success: false, message: "repeatWeeks must be between 1 and 12." });
    }

    const course = student.courses.id(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found." });

    const yearLevel = extractYearLevel(course.name);
    if (!yearLevel) return res.status(400).json({ success: false, message: "Could not determine year level from course." });

    const pricing = await PricingModel.findOne({ _singletonKey: 'global_pricing' });
    if (!pricing) return res.status(500).json({ success: false, message: "Pricing configuration not found." });

    const classRanges = Object.fromEntries(pricing.classRanges);
    const sessionPrice = getSessionPriceForYear(classRanges, yearLevel);
    if (!sessionPrice || sessionPrice <= 0) {
        return res.status(400).json({ success: false, message: `No pricing found for Year ${yearLevel}.` });
    }

    const totalAmount = sessionPrice * weeks;

    try {
        const amountInCents = Math.round(totalAmount * 100);
        const studentId = student._id.toString();

        const response = await ewayClient.createTransaction(rapid.Enum.Method.RESPONSIVE_SHARED, {
            Payment: { TotalAmount: amountInCents, CurrencyCode: 'AUD' },
            Customer: { Reference: studentId },
            RedirectUrl: `${FRONTEND_URL}/payment-status?studentId=${studentId}`,
            CancelUrl: `${FRONTEND_URL}/my-courses`,
            TransactionType: "Purchase",
            PartnerAgreementGuid: studentId,
            DeviceID: 'NODESDK',
        });

        if (response.getErrors().length > 0) {
            const errors = response.getErrors().map(e => rapid.getMessage(e, "en"));
            return res.status(500).json({ success: false, message: errors.join(' | ') });
        }

        const redirectURL = response.get('SharedPaymentUrl');
        const accessCode = response.get('AccessCode');
        if (!redirectURL) return res.status(500).json({ success: false, message: 'eWAY did not return a Redirect URL.' });

        // Generate session dates
        const auFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' });
        const todayStr = auFormatter.format(new Date());
        const todayParts = todayStr.split('-').map(Number);
        let cursor = new Date(Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2]));
        let daysToAdd = parsedDay - cursor.getUTCDay();
        if (daysToAdd <= 0) daysToAdd += 7;
        cursor.setUTCDate(cursor.getUTCDate() + daysToAdd);

        const sessionDates = [];
        for (let i = 0; i < weeks; i++) {
            sessionDates.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}-${String(cursor.getUTCDate()).padStart(2, '0')}`);
            cursor.setUTCDate(cursor.getUTCDate() + 7);
        }

        const repeatPayload = {
            type: 'REPEAT', courseId: course._id.toString(), courseName: course.name,
            courseSubject: course.subject || 'N/A', studentId,
            studentName: student.studentName, studentEmail: student.email,
            dayOfWeek: parsedDay, timeSlot, repeatWeeks: weeks,
            sessionDates, sessionPrice, paymentAmount: totalAmount, currency: 'AUD',
        };

        await PendingPayload.findOneAndUpdate(
            { accessCode },
            { accessCode, payload: repeatPayload, studentId },
            { upsert: true, new: true }
        );

        res.status(200).json({
            success: true, redirectUrl: redirectURL, accessCode, totalAmount, sessionPrice, weeks,
            message: `Redirecting to eWAY to pay $${totalAmount} AUD for ${weeks} repeat sessions.`,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error.' });
    }
});
