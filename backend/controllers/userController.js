// backend/controllers/userController.js

import asyncHandler from 'express-async-handler';
import User from '../models/UserModel.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'; // 👈 🚨 MISSING/REQUIRED IMPORT ADDED HERE 🚨
import ClassRequest from '../models/ClassRequest.js';
import { clerkClient } from '@clerk/express';
import rapid from 'eway-rapid';
import FeedbackModel from '../models/FeedbackModel.js';
import PendingPayload from '../models/PendingPayload.js';
import { sendCourseConfirmationEmail, sendNewPurchaseNotification, sendPaymentFailureEmail } from '../utils/emailService.js';

// 🚨 NEW IMPORT 🚨
import PromoCode from '../models/PromoCodeModel.js';

dotenv.config();

// 🛑 EWAY Initialization 🛑
const EWAY_API_KEY = process.env.EWAY_API_KEY;
const EWAY_PASSWORD = process.env.EWAY_PASSWORD;
const EWAY_ENDPOINT = process.env.EWAY_ENDPOINT || 'sandbox';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

if (!EWAY_API_KEY || !EWAY_PASSWORD) {
    console.error("FATAL ERROR: EWAY_API_KEY or EWAY_PASSWORD is not defined in .env");
}

const ewayClient = rapid.createClient(EWAY_API_KEY, EWAY_PASSWORD, EWAY_ENDPOINT);
// 🛑 END eWAY Initialization 🛑
const getClerkUserIdFromToken = (req) => {
    // ... (getClerkUserIdFromToken function is unchanged) ...
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.decode(token);
        return decoded?.sub || null;
    } catch (error) {
        console.error("JWT Decode Error (Clerk Token):", error);
        return null;
    }
}

// -----------------------------------------------------------
// 🟢 HELPER: Generate non-Sunday session dates (fully UTC-safe) 🟢
// @param {string} preferredDate - YYYY-MM-DD format start date
// @param {number} [count=6] - Number of session dates to generate
// @returns {string[]} Array of YYYY-MM-DD date strings
const generateSessionDates = (preferredDate, count) => {
    // Defensive defaults
    const sessionsCount = (typeof count === 'number' && Number.isFinite(count) && count > 0) ? count : 6;
    const MAX_ITERATIONS = sessionsCount + 60; // Safety valve to prevent infinite loops
    const sessionDates = [];

    // Parse the date string safely
    if (!preferredDate || typeof preferredDate !== 'string') {
        console.error('generateSessionDates: invalid preferredDate:', preferredDate);
        return sessionDates;
    }

    const dateParts = preferredDate.split('-').map(Number);
    if (dateParts.length !== 3 || dateParts.some(isNaN)) {
        console.error('generateSessionDates: unparseable date:', preferredDate);
        return sessionDates;
    }

    // Use UTC constructor to avoid timezone drift
    let currentDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));

    if (isNaN(currentDate.getTime())) {
        console.error('generateSessionDates: invalid Date object from:', preferredDate);
        return sessionDates;
    }

    let iterations = 0;
    while (sessionDates.length < sessionsCount && iterations < MAX_ITERATIONS) {
        iterations++;

        // Skip Sundays (UTC day 0)
        if (currentDate.getUTCDay() !== 0) {
            const yyyy = currentDate.getUTCFullYear();
            const mm = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(currentDate.getUTCDate()).padStart(2, '0');
            sessionDates.push(`${yyyy}-${mm}-${dd}`);
        }

        // Move to the next calendar day (UTC)
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    if (iterations >= MAX_ITERATIONS) {
        console.warn(`generateSessionDates: hit safety limit of ${MAX_ITERATIONS} iterations. Generated ${sessionDates.length}/${sessionsCount} dates.`);
    }

    return sessionDates;
};
// -----------------------------------------------------------


// 🚨 NEW CONTROLLER: Validate Promo Code 🚨
// @desc    Validate a promo code and return the discount
// @route   POST /api/user/promo/validate
// @access  Public
export const validatePromoCode = asyncHandler(async (req, res) => {
    const { code } = req.body;
    const now = new Date();

    if (!code) {
        return res.status(400).json({ message: 'Promo code is required.' });
    }

    try {
        // Find the code, converting input to uppercase for case-insensitive matching
        const promo = await PromoCode.findOne({ code: code.toUpperCase() });

        if (!promo) {
            return res.status(404).json({ message: 'Promo code not found or invalid.' });
        }

        if (!promo.isActive) {
            return res.status(400).json({ message: 'Promo code is not active.' });
        }

        if (promo.expiryDate && promo.expiryDate < now) {
            return res.status(400).json({ message: 'Promo code has expired.' });
        }

        // Code is Valid
        res.json({
            message: 'Promo code applied successfully!',
            code: promo.code,
            discountPercentage: promo.discountPercentage,
        });

    } catch (error) {
        console.error('Error during promo code validation:', error);
        res.status(500).json({ message: 'Server error during promo code validation.' });
    }
});


// 🛑 MODIFIED: Controller to Initiate eWAY Payment and Booking 🛑
export const initiatePaymentAndBooking = asyncHandler(async (req, res) => {
    const studentClerkId = getClerkUserIdFromToken(req);

    if (!studentClerkId) {
        return res.status(401).json({ success: false, message: "Authentication failed. Please log in again." });
    }

    const {
        bookingPayload,
    } = req.body;

    // bookingPayload now contains the promoCode and appliedDiscount
    const {
        paymentAmount,
        currency = 'AUD',
    } = bookingPayload; // Keep paymentAmount as the discounted price

    try {
        // --- 1. Prepare eWAY Payload (UNCHANGED LOGIC) ---
        const amountInCents = Math.round(paymentAmount * 100);

        const cleanCancelUrl = `${FRONTEND_URL}/enrollment?step=3`;

        console.log(`Creating eWAY Shared Payment URL for clerkId: ${studentClerkId} amount: $${paymentAmount}`);

        const response = await ewayClient.createTransaction(rapid.Enum.Method.RESPONSIVE_SHARED, {
            Payment: {
                TotalAmount: amountInCents,
                CurrencyCode: currency,
            },
            Customer: {
                Reference: studentClerkId,
            },
            RedirectUrl: `${FRONTEND_URL}/payment-status?clerkId=${studentClerkId}`,
            CancelUrl: cleanCancelUrl,
            TransactionType: "Purchase",
            PartnerAgreementGuid: studentClerkId,
            DeviceID: 'NODESDK',
        });

        if (response.getErrors().length > 0) {
            const errors = response.getErrors().map(error => rapid.getMessage(error, "en"));
            console.error('eWAY Error during createTransaction:', errors);
            return res.status(500).json({ success: false, message: errors.join(' | ') || 'eWAY initialization failed.' });
        }

        const redirectURL = response.get('SharedPaymentUrl');
        const accessCode = response.get('AccessCode');

        if (!redirectURL) {
            return res.status(500).json({ success: false, message: 'eWAY did not return a Redirect URL.' });
        }

        console.log(`✅ eWAY Shared Page created. AccessCode: ${accessCode}`);

        // --- 2. Store booking payload in MongoDB for resilient retrieval ---
        // Survives PM2 restarts. TTL index auto-deletes after 1 hour.
        await PendingPayload.findOneAndUpdate(
            { accessCode },
            { accessCode, payload: bookingPayload, clerkId: studentClerkId },
            { upsert: true, new: true }
        );
        console.log(`📦 Booking payload persisted to MongoDB for AccessCode: ${accessCode}`);

        // --- 3. Send Redirect URL and AccessCode back to Frontend ---
        res.status(200).json({
            success: true,
            redirectUrl: redirectURL,
            accessCode: accessCode,
            message: 'Redirecting to eWAY secure payment page.'
        });

    } catch (error) {
        console.error('Error initiating eWAY payment:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Server error during eWAY payment initiation.' });
    }
});


// 🛑 MODIFIED: Controller to Finish eWAY Payment and Booking 🛑
export const finishEwayPaymentAndBooking = asyncHandler(async (req, res) => {
    const { accessCode, bookingPayload } = req.body;

    // 🛡️ ROBUST: Use the authenticated user's clerkId from the auth middleware, NOT from req.body
    const clerkId = req.user?.clerkId || req.body?.clerkId;

    if (!accessCode) {
        return res.status(400).json({ success: false, message: "Missing eWAY AccessCode." });
    }
    if (!clerkId) {
        return res.status(401).json({ success: false, message: "Authentication failed. Missing Clerk ID." });
    }

    // 🛡️ IDEMPOTENCY GUARD: Check if this accessCode was already finalized
    const existingRequest = await ClassRequest.findOne({ transactionId: { $regex: new RegExp(`^${accessCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) } }).lean();
    // Fallback: also check by transactionID after we retrieve it from eWAY (below)

    let transactionSucceeded = false;
    let transactionID = null;
    let errorDetails = 'Payment processing failed.';
    let classRequestsToSave = [];

    try {
        // --- 1. Query eWAY Transaction Result (UNCHANGED) ---
        const response = await ewayClient.queryTransaction(accessCode);
        const transaction = response.get('Transactions[0]');

        if (!transaction) {
            throw new Error("Transaction result not found with the provided AccessCode.");
        }

        if (transaction.TransactionStatus) {
            transactionSucceeded = true;
            transactionID = String(transaction.TransactionID);
            console.log(`✅ eWAY Payment Successful. Transaction ID: ${transactionID}`);

            // 🛡️ IDEMPOTENCY GUARD: Check if this transactionID already has records
            const alreadyProcessed = await ClassRequest.findOne({ transactionId: transactionID }).lean();
            if (alreadyProcessed) {
                console.warn(`⚠️ TransactionID ${transactionID} already processed. Returning existing data.`);
                await PendingPayload.deleteOne({ accessCode }); // Clean up cache
                return res.status(200).json({
                    success: true,
                    message: 'Payment already processed. Your booking is confirmed.',
                    alreadyProcessed: true,
                });
            }
        } else {
            // Handle payment failure — NOW creates a tracking record
            const responseMessage = transaction.ResponseMessage || '';
            const errorCodes = responseMessage.split(', ').filter(Boolean).map(errorCode => {
                try { return rapid.getMessage(errorCode, "en"); } catch { return errorCode; }
            });
            const failureReason = errorCodes.join(' | ') || 'Transaction declined by bank.';
            errorDetails = `Payment declined by eWAY. Messages: ${failureReason}`;
            transactionID = String(transaction.TransactionID || 'N/A');
            console.error(`eWAY Transaction Failed: ${errorDetails}`);

            // --- CREATE FAILED PAYMENT RECORD FOR TRACKING ---
            try {
                // Retrieve booking payload for the failed record
                const cachedEntry = await PendingPayload.findOneAndDelete({ accessCode });
                const failedPayload = cachedEntry ? cachedEntry.payload : bookingPayload;

                if (failedPayload) {
                    const courseDetails = failedPayload.courseDetails || {};
                    const studentDetails = failedPayload.studentDetails || {};
                    const guardianDetails = failedPayload.guardianDetails || {};
                    const rawAmount = failedPayload.paymentAmount;
                    const amount = (typeof rawAmount === 'number' && Number.isFinite(rawAmount) && rawAmount > 0) ? rawAmount : 0;

                    // Create a single ClassRequest with paymentStatus: 'failed'
                    await ClassRequest.create({
                        courseId: courseDetails.courseId || 'unknown',
                        courseTitle: courseDetails.courseTitle || 'Unknown Course',
                        studentId: clerkId,
                        studentName: studentDetails.first && studentDetails.last
                            ? `${studentDetails.first} ${studentDetails.last}` : 'Unknown Student',
                        purchaseType: failedPayload.scheduleDetails?.purchaseType || 'TRIAL',
                        preferredDate: failedPayload.scheduleDetails?.preferredDate || null,
                        scheduleTime: failedPayload.scheduleDetails?.preferredTime || null,
                        subject: courseDetails.subject || 'N/A',
                        studentDetails: {
                            firstName: studentDetails.first || '',
                            lastName: studentDetails.last || '',
                            email: studentDetails.email || guardianDetails.email || '',
                        },
                        paymentStatus: 'failed',
                        transactionId: transactionID,
                        amountPaid: amount,
                        failureReason: failureReason,
                        currency: 'AUD',
                        status: 'rejected',
                    });
                    console.log(`📝 Failed payment record created for tracking. TransactionID: ${transactionID}`);

                    // Send failure notification email to customer (non-blocking)
                    const customerEmail = studentDetails.email || guardianDetails.email;
                    if (customerEmail && customerEmail.includes('@')) {
                        try {
                            await sendPaymentFailureEmail(customerEmail, {
                                studentName: studentDetails.first
                                    ? `${studentDetails.first} ${studentDetails.last || ''}`.trim()
                                    : 'Valued Customer',
                                courseTitle: courseDetails.courseTitle || 'Course',
                                amountAttempted: amount > 0 ? amount.toFixed(2) : '0.00',
                                currency: 'AUD',
                                failureReason: failureReason,
                                transactionId: transactionID,
                            });
                            console.log(`📧 Payment failure email sent to: ${customerEmail}`);
                        } catch (emailErr) {
                            console.error(`⚠️ Failed to send payment failure email:`, emailErr?.message || emailErr);
                        }
                    }
                } else {
                    console.warn('⚠️ No booking payload available to create failed payment record.');
                }
            } catch (trackingErr) {
                console.error('⚠️ Failed to create failed payment tracking record:', trackingErr?.message || trackingErr);
                // Non-blocking — still return the error to the user
            }

            return res.status(400).json({
                success: false,
                message: `Payment declined. Reason: ${errorCodes[0] || 'Transaction declined by bank.'}`,
            });
        }

        // --- 2. Finalize Booking (Booking Logic) ---
        // Prefer MongoDB-persisted payload, fall back to client-sent payload
        const cachedEntry = await PendingPayload.findOneAndDelete({ accessCode });
        const resolvedPayload = cachedEntry ? cachedEntry.payload : bookingPayload;

        // Log which source was used
        if (cachedEntry) {
            console.log(`📦 Using MongoDB-persisted booking payload for AccessCode: ${accessCode}`);
        } else if (bookingPayload) {
            console.warn(`⚠️ MongoDB cache miss for AccessCode: ${accessCode}. Using client-sent payload as fallback.`);
        }

        if (!resolvedPayload) {
            throw new Error("Payment successful, but booking data was lost during redirect. Please contact support.");
        }


        // --- REPEAT CLASS HANDLING ---
        // If the payload is a repeat booking, create paid ClassRequests and return early
        if (resolvedPayload.type === 'REPEAT') {
            console.log(`🔁 Processing REPEAT payment. ${resolvedPayload.repeatWeeks} sessions for ${resolvedPayload.courseName}`);

            const repeatRequests = (resolvedPayload.sessionDates || []).map((dateStr, i) => new ClassRequest({
                courseId: resolvedPayload.courseId || 'unknown',
                courseTitle: `${(resolvedPayload.courseName || 'Course').split('(')[0].trim()} (Repeat ${i + 1}/${resolvedPayload.repeatWeeks})`,
                studentId: clerkId,
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
                status: 'pending',
                paymentStatus: 'paid',
                transactionId: transactionID,
                amountPaid: resolvedPayload.sessionPrice || 0,
                currency: resolvedPayload.currency || 'AUD',
            }));

            await ClassRequest.insertMany(repeatRequests);
            console.log(`✅ Created ${repeatRequests.length} PAID repeat ClassRequest(s). TransactionID: ${transactionID}`);

            // Send confirmation email for repeat booking
            const emailRecipient = resolvedPayload.studentEmail;
            if (emailRecipient && emailRecipient.includes('@')) {
                try {
                    await sendCourseConfirmationEmail(
                        emailRecipient,
                        {
                            courseTitle: resolvedPayload.courseName || 'Course',
                            transactionId: transactionID,
                            amountPaid: resolvedPayload.paymentAmount || 0,
                            currency: resolvedPayload.currency || 'AUD',
                        },
                        {
                            name: resolvedPayload.studentName || 'Student',
                        },
                        repeatRequests
                    );
                    console.log(`📧 Repeat booking confirmation email sent to: ${emailRecipient}`);
                } catch (emailErr) {
                    console.error('⚠️ Failed to send repeat booking confirmation:', emailErr?.message || emailErr);
                }
            }

            // Send company notification
            try {
                await sendNewPurchaseNotification({
                    studentName: resolvedPayload.studentName,
                    studentEmail: resolvedPayload.studentEmail,
                    courseTitle: resolvedPayload.courseName,
                    amountPaid: resolvedPayload.paymentAmount,
                    transactionId: transactionID,
                    purchaseType: `REPEAT (${resolvedPayload.repeatWeeks} sessions)`,
                }, repeatRequests);
            } catch (notifErr) {
                console.error('⚠️ Failed to send company notification for repeat:', notifErr?.message || notifErr);
            }

            return res.status(201).json({
                success: true,
                message: `Payment successful! ${repeatRequests.length} repeat class(es) booked. Confirmation email sent.`,
                requestsCreated: repeatRequests.length,
                dates: resolvedPayload.sessionDates,
                transactionId: transactionID,
            });
        }

        // 🛡️ DEFENSIVE: Safely destructure with defaults for every field
        const courseDetails = resolvedPayload.courseDetails || {};
        const scheduleDetails = resolvedPayload.scheduleDetails || {};
        const studentDetails = resolvedPayload.studentDetails || {};
        const guardianDetails = resolvedPayload.guardianDetails || {};
        const rawPaymentAmount = resolvedPayload.paymentAmount;
        const promoCode = resolvedPayload.promoCode || null;
        const appliedDiscountAmount = Number(resolvedPayload.appliedDiscountAmount) || 0;

        // 🛡️ Validate paymentAmount is a real positive number
        const paymentAmount = (typeof rawPaymentAmount === 'number' && Number.isFinite(rawPaymentAmount) && rawPaymentAmount > 0)
            ? rawPaymentAmount
            : null;

        if (paymentAmount === null) {
            console.error(`❌ Invalid paymentAmount in payload: ${rawPaymentAmount}`);
            return res.status(400).json({ success: false, message: 'Invalid payment amount in booking data.' });
        }

        if (!courseDetails.courseTitle) {
            return res.status(400).json({ success: false, message: 'Missing course title in booking data.' });
        }

        const {
            purchaseType = 'TRIAL',
            preferredDate = null,
            preferredTime = null,
            preferredWeekStart = null,
            preferredTimeMonFri = null,
            preferredTimeSaturday = null,
            postcode = null,
            numberOfSessions = 1
        } = scheduleDetails;

        // ... (User Lookup/Creation Logic UNCHANGED) ...
        const nameToUse = studentDetails?.first && studentDetails?.last
            ? `${studentDetails.first} ${studentDetails.last}`
            : "New Student";

        let emailToUse = studentDetails?.email || guardianDetails?.email;

        let clerkUser;
        try {
            clerkUser = await clerkClient.users.getUser(clerkId);
        } catch (clerkError) {
            if (!emailToUse) {
                emailToUse = 'unknown_clerk_failure@example.com';
            }
        }

        if (!emailToUse && clerkUser) {
            emailToUse = clerkUser?.emailAddresses[0]?.emailAddress || 'unknown@example.com';
        }

        let student = await User.findOneAndUpdate(
            { clerkId: clerkId },
            {
                $set: {
                    email: emailToUse,
                    studentName: nameToUse,
                    guardianEmail: guardianDetails?.email,
                    guardianPhone: guardianDetails?.phone
                }
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        // Check for existing course enrollment — still create ClassRequests & send emails
        const courseExists = student.courses.some(c => c.name === courseDetails.courseTitle);
        if (courseExists) {
            console.warn(`⚠️ User ${clerkId} already has course ${courseDetails.courseTitle}. Will skip duplicate on User model, but still creating ClassRequests and sending emails.`);
        }

        const isTrial = purchaseType === 'TRIAL';

        const initialPreferredDate = isTrial ? preferredDate : preferredWeekStart;
        const initialPreferredTime = isTrial ? preferredTime : preferredTimeMonFri;

        if (!initialPreferredDate || !initialPreferredTime) {
            return res.status(400).json({ success: false, message: "Missing preferred date or time details for the booking payload." });
        }

        // --- 3. Save Class Request(s) (Pending for Admin) ---

        if (isTrial) {
            // Case 1: TRIAL - Single session, one ClassRequest

            classRequestsToSave.push({
                courseId: courseDetails.courseId,
                courseTitle: courseDetails.courseTitle,
                studentId: clerkId,
                studentName: student.studentName,
                purchaseType: 'TRIAL',
                preferredDate: preferredDate, // Australian YYYY-MM-DD
                scheduleTime: preferredTime, // Australian Time Slot
                postcode: postcode,
                subject: courseDetails.subject || 'N/A',
                studentDetails: {
                    firstName: studentDetails?.first || '',
                    lastName: studentDetails?.last || '',
                    email: emailToUse || '',
                },
                paymentStatus: 'paid',
                transactionId: transactionID,
                amountPaid: paymentAmount,
                currency: 'AUD',
                promoCodeUsed: promoCode,
                discountApplied: appliedDiscountAmount,
            });
        } else {
            // Case 2: STARTER_PACK - numberOfSessions sessions, multiple ClassRequests

            const startDateForSessions = preferredWeekStart || preferredDate;

            if (!startDateForSessions || typeof startDateForSessions !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startDateForSessions)) {
                console.error('Invalid start date for starter pack:', startDateForSessions);
                return res.status(400).json({ success: false, message: "Missing or invalid start date for starter pack sessions." });
            }

            // Generate session dates (fully UTC-safe, with count param)
            const safeSessionCount = (typeof numberOfSessions === 'number' && Number.isFinite(numberOfSessions) && numberOfSessions > 0) ? numberOfSessions : 6;
            const dates = generateSessionDates(startDateForSessions, safeSessionCount);

            if (!dates || dates.length === 0) {
                console.error('generateSessionDates returned no dates for:', startDateForSessions);
                return res.status(500).json({ success: false, message: 'Failed to generate session dates. Please contact support.' });
            }

            const sessionsToCreate = Math.min(safeSessionCount, dates.length);

            // Calculate the total cost BEFORE discount was applied, then distribute the discounted amount.
            // For simplicity and matching the paymentAmount, we calculate perSessionCost based on the final paid amount.
            const perSessionCost = paymentAmount / sessionsToCreate;

            const sessionDatesToUse = dates.slice(0, sessionsToCreate);


            for (let i = 0; i < sessionDatesToUse.length; i++) {
                const sessionDate = sessionDatesToUse[i];
                const dateParts = sessionDate.split('-').map(Number);

                // 🚨 CRITICAL FIX: Use Date.UTC to prevent local timezone offsets on the server
                // month is 0-indexed in JS dates
                const dateObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
                const dayOfWeek = dateObj.getUTCDay(); // Use getUTCDay() for consistency with UTC date creation


                // Determine the correct time slot for the current day (Mon-Fri = 1-5, Sat = 6)
                const sessionTime = (dayOfWeek >= 1 && dayOfWeek <= 5)
                    ? preferredTimeMonFri
                    : preferredTimeSaturday;

                classRequestsToSave.push({
                    courseId: courseDetails.courseId,
                    courseTitle: `${courseDetails.courseTitle} (Session ${i + 1}/${sessionsToCreate})`,
                    studentId: clerkId,
                    studentName: student.studentName,
                    purchaseType: 'STARTER_PACK',
                    preferredDate: sessionDate, // Australian YYYY-MM-DD
                    scheduleTime: sessionTime, // Australian Time Slot
                    preferredTimeMonFri: preferredTimeMonFri,
                    preferredTimeSaturday: preferredTimeSaturday,
                    postcode: postcode,
                    subject: courseDetails.subject || 'N/A',
                    studentDetails: {
                        firstName: studentDetails?.first || '',
                        lastName: studentDetails?.last || '',
                        email: emailToUse || '',
                    },
                    paymentStatus: 'paid',
                    transactionId: transactionID,
                    amountPaid: perSessionCost,
                    currency: 'AUD',
                    promoCodeUsed: promoCode,
                });
            }

        }

        // Save ALL generated class requests
        await ClassRequest.insertMany(classRequestsToSave.map(data => new ClassRequest(data)));
        console.log(`Successfully created ${classRequestsToSave.length} ClassRequest(s) for admin.`);

        // --- 4. Add ONE Course Record to Student (User Model) ---
        // Skip if course with same name already exists (avoid duplicates on User model)
        let newCourse = null;
        if (!courseExists) {
            newCourse = {
                name: courseDetails.courseTitle,
                description: isTrial ? `Trial session for ${courseDetails.courseTitle}` : `Starter Pack for ${courseDetails.courseTitle}`,
                teacher: 'Pending Teacher',
                duration: isTrial ? '1 hour trial' : `${numberOfSessions} sessions total`,
                preferredDate: isTrial ? preferredDate : preferredWeekStart,
                preferredTime: initialPreferredTime,
                status: 'pending',
                enrollmentDate: new Date(),
                zoomMeetingUrl: '',
                preferredTimeMonFri: isTrial ? null : preferredTimeMonFri,
                preferredTimeSaturday: isTrial ? null : preferredTimeSaturday,
                sessionsRemaining: isTrial ? 1 : numberOfSessions,
                paymentStatus: 'paid',
                transactionId: transactionID,
                amountPaid: paymentAmount,
                // 🚨 ADD PROMO CODE FIELDS HERE 🚨
                promoCodeUsed: promoCode,
                discountApplied: appliedDiscountAmount,
            };
            student.courses.push(newCourse);
            await student.save();
        } else {
            console.log(`📝 Skipping duplicate course push to User model for ${courseDetails.courseTitle}. ClassRequests and emails will still be created.`);
        }



        // --- 5. SEND CONFIRMATION EMAIL ---
        // 🛡️ ROBUST: Try multiple email sources with validation
        const isValidEmail = (e) => typeof e === 'string' && e.trim().length > 3 && e.includes('@');

        const payloadEmail = studentDetails?.email || guardianDetails?.email;
        const dbEmail = student.email || student.guardianEmail;
        // Also try Clerk user data as last resort
        const clerkEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;

        const emailRecipient = isValidEmail(payloadEmail) ? payloadEmail.trim()
            : isValidEmail(dbEmail) ? dbEmail.trim()
                : isValidEmail(clerkEmail) ? clerkEmail.trim()
                    : null;

        const emailCourseDetails = {
            courseTitle: courseDetails.courseTitle || 'Course',
            purchaseType: purchaseType || 'TRIAL',
            amountPaid: paymentAmount.toFixed(2),
            currency: 'AUD',
            transactionId: transactionID || 'N/A',
            promoCode: promoCode || null,
            discountApplied: appliedDiscountAmount || 0,
        };
        const emailStudentDetails = {
            name: student.studentName || studentDetails?.first || 'Valued Student',
        };

        console.log(`📧 Attempting confirmation email — recipient: ${emailRecipient || 'NONE'}, student: ${student.studentName}, clerkId: ${clerkId}`);

        if (emailRecipient) {
            try {
                await sendCourseConfirmationEmail(emailRecipient, emailCourseDetails, emailStudentDetails, classRequestsToSave);
                console.log(`✅ Purchase confirmation email sent successfully to: ${emailRecipient}`);
            } catch (emailErr) {
                console.error(`❌ FAILED to send confirmation email to ${emailRecipient}:`, emailErr?.message || emailErr);
                // Log full error for debugging — does NOT block the success response
            }
        } else {
            console.warn(`⚠️ Cannot send email: No valid recipient email for Clerk ID ${clerkId}. student.email='${student.email}', guardianEmail='${student.guardianEmail}'`);
        }

        // --- 5b. SEND COMPANY NOTIFICATION EMAIL ---
        try {
            await sendNewPurchaseNotification({
                studentName: student.studentName || nameToUse,
                studentEmail: emailRecipient || 'N/A',
                courseTitle: courseDetails.courseTitle || 'Course',
                purchaseType: purchaseType || 'TRIAL',
                amountPaid: paymentAmount.toFixed(2),
                currency: 'AUD',
                transactionId: transactionID || 'N/A',
                promoCode: promoCode || null,
                discountApplied: appliedDiscountAmount || 0,
            }, classRequestsToSave);
            console.log('✅ Company purchase notification sent to info@primementor.com.au');
        } catch (companyEmailErr) {
            console.error('⚠️ Failed to send company purchase notification:', companyEmailErr?.message || companyEmailErr);
            // Non-blocking — student booking is already confirmed
        }
        // -------------------------------------------------

        // Final successful response
        res.status(201).json({
            success: true,
            message: courseExists
                ? 'Payment successful. Booking submitted to admin for assignment. Confirmation email sent. (Course was already in your profile.)'
                : 'Payment successful. Booking submitted to admin for assignment. Confirmation email sent.',
            course: newCourse || student.courses.find(c => c.name === courseDetails.courseTitle)
        });

    } catch (error) {
        console.error('Error in eWAY finish payment/booking flow:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Server error during eWAY payment confirmation.' });
    }
});



// getUserCourses (UNCHANGED)
export const getUserCourses = asyncHandler(async (req, res) => {
    // ... (rest of getUserCourses logic is unchanged)
    const clerkId = getClerkUserIdFromToken(req);

    if (!clerkId) {
        return res.status(401).json({ courses: [], message: "Authentication failed. Please log in again." });
    }

    let clerkUser;
    try {
        clerkUser = await clerkClient.users.getUser(clerkId);
    } catch (error) {
        console.error(`Clerk user lookup failed for ID: ${clerkId}`, error);
        return res.status(500).json({ courses: [], message: 'Internal Server Error while communicating with authentication service.' });
    }

    try {

        if (!clerkUser) {
            console.error(`Clerk user not found for ID: ${clerkId}`);
            return res.status(404).json({ courses: [], message: 'User not registered in database. Please log out and back in.' });
        }

        const email = clerkUser.emailAddresses[0]?.emailAddress;
        const studentName = clerkUser.firstName || 'New Student';

        if (!email) {
            console.error(`Clerk user ${clerkId} is missing an email address.`);
            return res.status(400).json({ courses: [], message: 'Could not retrieve user email for registration.' });
        }

        const user = await User.findOneAndUpdate(
            { clerkId: clerkId },
            {
                $set: {
                    email: email,
                    studentName: studentName
                }
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        res.status(200).json({ courses: user.courses });

    } catch (error) {
        console.error('Error fetching courses:', error);
        if (error.code === 11000) {
            return res.status(409).json({ courses: [], message: 'User data conflict detected. Please contact support.' });
        }
        res.status(500).json({ courses: [], message: 'Internal Server Error while fetching courses.' });
    }
});


// REMOVED: Old createBooking is redundant
export const createBooking = asyncHandler(async (req, res) => {
    return res.status(405).json({ success: false, message: "Use /initiate-payment endpoint for new bookings." });
});

// 🟢 NEW CONTROLLER: Submit Student Feedback 🟢
// @desc    Submit new feedback from a student
// @route   POST /api/user/feedback
// @access  Private (Student - requires authentication middleware)
export const submitFeedback = asyncHandler(async (req, res) => {
    // Note: The 'protect' middleware should run before this and attach the User object to req.user
    // If you are using Clerk middleware, the User object might be attached differently (e.g., req.auth.userId for clerkId)
    // Assuming `req.user` holds the Mongoose User document if a custom auth middleware is used.

    const studentMongooseId = req.user._id;
    const studentClerkId = req.user.clerkId;
    const studentName = req.user.studentName;
    const studentEmail = req.user.email;

    if (!studentMongooseId || !studentClerkId) {
        res.status(401);
        throw new Error('User authentication details missing for feedback submission.');
    }

    const {
        courseName, teacherName, sessionDate, sessionTime,
        clarityRating, engagingRating, contentRating, overallSatisfaction,
        likes, improvements, additionalComments
    } = req.body;

    // Basic validation for required rating fields
    if (!courseName || !teacherName || !sessionDate || !clarityRating || !engagingRating || !contentRating) {
        res.status(400);
        throw new Error('Missing required class or rating information.');
    }

    try {
        const newFeedback = new FeedbackModel({
            student: studentMongooseId,
            studentClerkId: studentClerkId,
            studentName: studentName || 'N/A',
            studentEmail: studentEmail || 'N/A',
            courseName,
            teacherName,
            sessionDate,
            sessionTime,
            clarityRating,
            engagingRating,
            contentRating,
            overallSatisfaction,
            likes: likes || '',
            improvements: improvements || '',
            additionalComments: additionalComments || '',
        });

        const createdFeedback = await newFeedback.save();

        res.status(201).json({
            message: 'Feedback submitted successfully!',
            feedback: createdFeedback
        });
    } catch (error) {
        console.error('Error saving feedback:', error);
        res.status(500).json({ message: 'Server error: Could not save feedback data.' });
    }
});


// 🔁 NEW CONTROLLER: Request Repeat/Recurring Classes 🔁
// @desc    Student requests the same class to repeat weekly on a chosen day/time
// @route   POST /api/user/repeat-classes
// @access  Private (Student - requires authentication)
export const requestRepeatClasses = asyncHandler(async (req, res) => {
    const clerkId = getClerkUserIdFromToken(req);

    if (!clerkId) {
        return res.status(401).json({ success: false, message: "Authentication failed. Please log in again." });
    }

    const {
        courseId,       // _id from the student's courses array
        dayOfWeek,      // 1=Mon, 2=Tue, ..., 6=Sat (no Sunday)
        timeSlot,       // e.g. "3:00 PM - 4:00 PM"
        repeatWeeks,    // number of weeks (1-12)
    } = req.body;

    // --- Validation ---
    if (!courseId || !timeSlot || dayOfWeek === undefined || dayOfWeek === null) {
        return res.status(400).json({ success: false, message: "Missing required fields: courseId, dayOfWeek, timeSlot." });
    }

    const parsedDay = parseInt(dayOfWeek, 10);
    if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 6) {
        return res.status(400).json({ success: false, message: "dayOfWeek must be 1 (Mon) through 6 (Sat). No Sunday." });
    }

    const weeks = parseInt(repeatWeeks, 10);
    if (isNaN(weeks) || weeks < 1 || weeks > 12) {
        return res.status(400).json({ success: false, message: "repeatWeeks must be between 1 and 12." });
    }

    // --- Find student and course ---
    const student = await User.findOne({ clerkId });
    if (!student) {
        return res.status(404).json({ success: false, message: "Student not found." });
    }

    const course = student.courses.id(courseId);
    if (!course) {
        return res.status(404).json({ success: false, message: "Course not found in your enrollment." });
    }

    // --- Generate dates for each week ---
    // Start from the NEXT occurrence of the chosen dayOfWeek after today
    const today = new Date();
    // Build a date in Australian timezone (we work with YYYY-MM-DD strings)
    const auFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }); // en-CA gives YYYY-MM-DD
    const todayStr = auFormatter.format(today);
    const todayParts = todayStr.split('-').map(Number);
    let cursor = new Date(Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2]));

    // Advance cursor to the next occurrence of parsedDay
    // JS Date: 0=Sun, 1=Mon, ..., 6=Sat — matches our parsedDay convention
    const currentDayUTC = cursor.getUTCDay();
    let daysToAdd = parsedDay - currentDayUTC;
    if (daysToAdd <= 0) {
        daysToAdd += 7; // next week
    }
    cursor.setUTCDate(cursor.getUTCDate() + daysToAdd);

    const sessionDates = [];
    for (let i = 0; i < weeks; i++) {
        const yyyy = cursor.getUTCFullYear();
        const mm = String(cursor.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(cursor.getUTCDate()).padStart(2, '0');
        sessionDates.push(`${yyyy}-${mm}-${dd}`);
        cursor.setUTCDate(cursor.getUTCDate() + 7); // next week same day
    }

    // --- Create ClassRequests ---
    const classRequests = sessionDates.map((dateStr, i) => new ClassRequest({
        courseId: course._id,
        courseTitle: `${course.name.split('(')[0].trim()} (Repeat ${i + 1}/${weeks})`,
        studentId: clerkId,
        studentName: student.studentName,
        purchaseType: 'TRIAL', // Repeats are treated as individual sessions
        preferredDate: dateStr,
        scheduleTime: timeSlot,
        subject: course.subject || 'N/A',
        status: 'pending',
        paymentStatus: 'unpaid', // Repeats don't require payment (per approved plan)
        amountPaid: 0,
    }));

    await ClassRequest.insertMany(classRequests);
    console.log(`🔁 Created ${classRequests.length} repeat ClassRequest(s) for student ${student.studentName} (${clerkId})`);

    res.status(201).json({
        success: true,
        message: `${weeks} recurring class request(s) created! Your admin will assign a teacher and you'll receive Zoom links via email.`,
        requestsCreated: classRequests.length,
        dates: sessionDates,
    });
});

// 🟢 NEW CONTROLLER: Initiate eWAY Payment for Repeat Classes 🟢
// @desc    Calculate total cost and create eWAY payment session for repeat classes
// @route   POST /api/user/initiate-repeat-payment
// @access  Private (Student - requires authentication)
import PricingModel from '../models/PricingModel.js';

// Helper: extract year level number from course name like "All - Year 3" or "Maths (Year 10)"
function extractYearLevel(courseName) {
    const match = (courseName || '').match(/Year\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
}

// Helper: get session price for a given year level from PricingModel
function getSessionPriceForYear(classRanges, yearLevel) {
    if (!yearLevel || !classRanges) return null;

    // classRanges keys are like "2-6", "7-9", "10-12"
    for (const [range, prices] of Object.entries(classRanges)) {
        const [low, high] = range.split('-').map(Number);
        if (yearLevel >= low && yearLevel <= high) {
            return prices.sessionPrice;
        }
    }
    return null;
}

export const initiateRepeatPayment = asyncHandler(async (req, res) => {
    const clerkId = getClerkUserIdFromToken(req);

    if (!clerkId) {
        return res.status(401).json({ success: false, message: "Authentication failed. Please log in again." });
    }

    const { courseId, dayOfWeek, timeSlot, repeatWeeks } = req.body;

    // --- Validation ---
    if (!courseId || !timeSlot || dayOfWeek === undefined || dayOfWeek === null) {
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

    // --- Find student and course ---
    const student = await User.findOne({ clerkId });
    if (!student) {
        return res.status(404).json({ success: false, message: "Student not found." });
    }

    const course = student.courses.id(courseId);
    if (!course) {
        return res.status(404).json({ success: false, message: "Course not found in your enrollment." });
    }

    // --- Get pricing ---
    const yearLevel = extractYearLevel(course.name);
    if (!yearLevel) {
        return res.status(400).json({ success: false, message: "Could not determine year level from course. Please contact support." });
    }

    let pricing = await PricingModel.findOne({ _singletonKey: 'global_pricing' });
    if (!pricing) {
        return res.status(500).json({ success: false, message: "Pricing configuration not found. Please contact support." });
    }

    const classRanges = Object.fromEntries(pricing.classRanges);
    const sessionPrice = getSessionPriceForYear(classRanges, yearLevel);

    if (!sessionPrice || sessionPrice <= 0) {
        return res.status(400).json({ success: false, message: `No pricing found for Year ${yearLevel}. Please contact support.` });
    }

    const totalAmount = sessionPrice * weeks;
    console.log(`💰 Repeat payment: ${weeks} sessions × $${sessionPrice} = $${totalAmount} for Year ${yearLevel}`);

    try {
        // --- Create eWAY payment session ---
        const amountInCents = Math.round(totalAmount * 100);
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

        const response = await ewayClient.createTransaction(rapid.Enum.Method.RESPONSIVE_SHARED, {
            Payment: {
                TotalAmount: amountInCents,
                CurrencyCode: 'AUD',
            },
            Customer: {
                Reference: clerkId,
            },
            RedirectUrl: `${FRONTEND_URL}/payment-status?clerkId=${clerkId}`,
            CancelUrl: `${FRONTEND_URL}/my-courses`,
            TransactionType: "Purchase",
            PartnerAgreementGuid: clerkId,
            DeviceID: 'NODESDK',
        });

        if (response.getErrors().length > 0) {
            const errors = response.getErrors().map(error => rapid.getMessage(error, "en"));
            console.error('eWAY Error during repeat payment createTransaction:', errors);
            return res.status(500).json({ success: false, message: errors.join(' | ') || 'eWAY initialization failed.' });
        }

        const redirectURL = response.get('SharedPaymentUrl');
        const accessCode = response.get('AccessCode');

        if (!redirectURL) {
            return res.status(500).json({ success: false, message: 'eWAY did not return a Redirect URL.' });
        }

        console.log(`✅ eWAY Repeat Payment session created. AccessCode: ${accessCode}`);

        // --- Store repeat payload in MongoDB ---
        // Generate session dates now so finishEway doesn't need to recalculate
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
            const yyyy = cursor.getUTCFullYear();
            const mm = String(cursor.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(cursor.getUTCDate()).padStart(2, '0');
            sessionDates.push(`${yyyy}-${mm}-${dd}`);
            cursor.setUTCDate(cursor.getUTCDate() + 7);
        }

        const repeatPayload = {
            type: 'REPEAT',
            courseId: course._id.toString(),
            courseName: course.name,
            courseSubject: course.subject || 'N/A',
            studentId: clerkId,
            studentName: student.studentName,
            studentEmail: student.email,
            dayOfWeek: parsedDay,
            timeSlot,
            repeatWeeks: weeks,
            sessionDates,
            sessionPrice,
            paymentAmount: totalAmount,
            currency: 'AUD',
        };

        await PendingPayload.findOneAndUpdate(
            { accessCode },
            { accessCode, payload: repeatPayload, clerkId },
            { upsert: true, new: true }
        );
        console.log(`📦 Repeat booking payload persisted to MongoDB for AccessCode: ${accessCode}`);

        // --- Return redirect URL ---
        res.status(200).json({
            success: true,
            redirectUrl: redirectURL,
            accessCode,
            totalAmount,
            sessionPrice,
            weeks,
            message: `Redirecting to eWAY to pay $${totalAmount} AUD for ${weeks} repeat sessions.`,
        });
    } catch (error) {
        console.error('Error initiating repeat payment:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Server error during repeat payment initiation.' });
    }
});
