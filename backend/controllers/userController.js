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
import { sendCourseConfirmationEmail } from '../utils/emailService.js';

// 🚨 NEW IMPORT 🚨
import PromoCode from '../models/PromoCodeModel.js';

dotenv.config();

// 🛑 EWAY Initialization (UNCHANGED) 🛑
// ... (eWAY Initialization code is unchanged) ...
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
// 🟢 HELPER: Generate the 6 non-Sunday session dates 🟢
// ... (generateSessionDates function is unchanged) ...
const generateSessionDates = (preferredDate) => {
    const sessionsCount = 6;
    const sessionDates = [];

    console.log('[SERVER DEBUG] Input preferredDate:', preferredDate);

    const dateParts = preferredDate.split('-').map(Number);
    // Use UTC constructor: new Date(year, monthIndex, day). 
    let currentDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));

    console.log('[SERVER DEBUG] Initial currentDate UTC time:', currentDate.toUTCString());
    console.log('[SERVER DEBUG] Initial currentDate UTC Day (0=Sun, 4=Thu):', currentDate.getUTCDay());

    // We only need to account for Sundays (day 0)
    while (sessionDates.length < sessionsCount) {

        // CRITICAL: Use getUTCDay() since the object was created using Date.UTC()
        if (currentDate.getUTCDay() !== 0) {

            // Push the YYYY-MM-DD string representation using UTC components
            const yyyy = currentDate.getUTCFullYear();
            const mm = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(currentDate.getUTCDate()).padStart(2, '0');
            const newDateStr = `${yyyy}-${mm}-${dd}`;

            sessionDates.push(newDateStr);
            console.log(`[SERVER DEBUG] Session ${sessionDates.length}: Found date ${newDateStr} (Day: ${currentDate.getUTCDay()})`);

        } else {
            console.log(`[SERVER DEBUG] Skipping date: ${currentDate.getUTCFullYear()}-${currentDate.getUTCMonth() + 1}-${currentDate.getUTCDate()} (Sunday)`);
        }

        // Move to the next calendar day (using UTC date setters)
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    console.log('[SERVER DEBUG] Final generated sessionDates array:', sessionDates);
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

        // --- 2. Send Redirect URL and AccessCode back to Frontend ---
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
    const { accessCode, clerkId, bookingPayload } = req.body;

    if (!accessCode || !clerkId) {
        return res.status(400).json({ success: false, message: "Missing eWAY AccessCode or Clerk ID." });
    }

    console.log('[SERVER DEBUG] Received bookingPayload:', JSON.stringify(bookingPayload, null, 2));


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
            transactionID = transaction.TransactionID;
            console.log(`✅ eWAY Payment Successful. Transaction ID: ${transactionID}`);
        } else {
            // Handle payment failure
            const responseMessage = transaction.ResponseMessage;
            const errorCodes = responseMessage.split(', ').map(errorCode => rapid.getMessage(errorCode, "en"));
            errorDetails = `Payment declined by eWAY. Messages: ${errorCodes.join(' | ')}`;
            console.error(`eWAY Transaction Failed: ${errorDetails}`);

            throw new Error(`Payment declined. Reason: ${errorCodes[0] || 'Transaction declined by bank.'}`);
        }

        // --- 2. Finalize Booking (Booking Logic) ---
        if (!bookingPayload) {
            throw new Error("Payment successful, but booking data was lost during redirect. Please contact support.");
        }

        const {
            courseDetails,
            scheduleDetails,
            studentDetails,
            guardianDetails,
            paymentAmount,
            // 🚨 NEW FIELDS FROM PAYLOAD 🚨
            promoCode,
            appliedDiscountAmount
        } = bookingPayload;

        const {
            purchaseType,
            preferredDate,
            preferredTime,
            preferredWeekStart,
            preferredTimeMonFri,
            preferredTimeSaturday,
            postcode,
            numberOfSessions
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

        // Check for existing course enrollment (UNCHANGED)
        const courseExists = student.courses.some(c => c.name === courseDetails.courseTitle);
        if (courseExists) {
            console.warn(`User ${clerkId} already has course ${courseDetails.courseTitle}. Email not resent.`);
            return res.status(200).json({
                success: true,
                message: 'Payment successful. Course already enrolled.',
                course: student.courses.find(c => c.name === courseDetails.courseTitle)
            });
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
            console.log('[SERVER DEBUG] Creating single TRIAL session...');
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
                paymentStatus: 'paid',
                transactionId: transactionID,
                amountPaid: paymentAmount,
                // 🚨 ADD PROMO CODE INFO 🚨
                promoCodeUsed: promoCode,
                discountApplied: appliedDiscountAmount,
            });
        } else {
            // Case 2: STARTER_PACK - numberOfSessions sessions, multiple ClassRequests
            console.log('[SERVER DEBUG] Creating STARTER_PACK sessions...');
            const startDateForSessions = preferredWeekStart || preferredDate;
            console.log('[SERVER DEBUG] startDateForSessions (preferredWeekStart):', startDateForSessions);

            if (!startDateForSessions) {
                return res.status(400).json({ success: false, message: "Missing start date for starter pack sessions." });
            }

            // CRITICAL: Use the helper to generate the correct dates (Australian dates)
            const dates = generateSessionDates(startDateForSessions);
            const sessionsToCreate = Number.isInteger(numberOfSessions) && numberOfSessions > 0 ? Number(numberOfSessions) : dates.length;

            // Calculate the total cost BEFORE discount was applied, then distribute the discounted amount.
            // For simplicity and matching the paymentAmount, we calculate perSessionCost based on the final paid amount.
            const perSessionCost = paymentAmount / sessionsToCreate;

            const sessionDatesToUse = dates.slice(0, sessionsToCreate);
            console.log('[SERVER DEBUG] sessionDatesToUse from generateSessionDates:', sessionDatesToUse);

            for (let i = 0; i < sessionDatesToUse.length; i++) {
                const sessionDate = sessionDatesToUse[i];
                const dateParts = sessionDate.split('-').map(Number);
                const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                const dayOfWeek = dateObj.getDay();
                console.log(`[SERVER DEBUG] Session ${i + 1} Date: ${sessionDate}, Local Day of Week (0=Sun): ${dayOfWeek}`);

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
                    paymentStatus: 'paid',
                    transactionId: transactionID,
                    amountPaid: perSessionCost,
                    // 🚨 ADD PROMO CODE INFO 🚨
                    promoCodeUsed: promoCode,
                    // Note: Discount is only recorded on the first session's ClassRequest for simplicity,
                    // or calculated proportionally, but since the `amountPaid` is already discounted, 
                    // recording the total `appliedDiscountAmount` on all records is redundant.
                    // We record the total discount on the User's main course record below.
                });
            }
            console.log('[SERVER DEBUG] Class requests saved to DB:', classRequestsToSave.map(r => ({ date: r.preferredDate, time: r.scheduleTime, title: r.courseTitle })));
        }

        // Save ALL generated class requests
        await ClassRequest.insertMany(classRequestsToSave.map(data => new ClassRequest(data)));
        console.log(`Successfully created ${classRequestsToSave.length} ClassRequest(s) for admin.`);

        // --- 4. Add ONE Course Record to Student (User Model) ---
        const newCourse = {
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
        console.log('[SERVER DEBUG] Student course record updated in UserModel:', newCourse.preferredDate, newCourse.preferredTime);


        // 🛑 --- 5. SEND CONFIRMATION EMAIL (NEW STEP) --- 🛑
        const emailRecipient = student.email || student.guardianEmail;
        const emailCourseDetails = {
            courseTitle: courseDetails.courseTitle,
            purchaseType: purchaseType,
            amountPaid: paymentAmount.toFixed(2),
            currency: 'AUD',
            transactionId: transactionID,
            // 🚨 PASS PROMO INFO TO EMAIL 🚨
            promoCode: promoCode,
            discountApplied: appliedDiscountAmount,
        };
        const emailStudentDetails = {
            name: student.studentName,
        };

        if (emailRecipient) {
            try {
                console.log('[SERVER DEBUG] Sending purchase confirmation email to:', emailRecipient);
                await sendCourseConfirmationEmail(emailRecipient, emailCourseDetails, emailStudentDetails, classRequestsToSave);
                console.log('✅ Purchase confirmation email sent to:', emailRecipient);
            } catch (emailErr) {
                console.error('⚠️ Failed to send purchase confirmation email to:', emailRecipient, '| Error:', emailErr.message);
            }
        } else {
            console.warn(`Cannot send email: Recipient email is missing for Clerk ID: ${clerkId}`);
        }
        // ----------------------------------------------------

        // Final successful response
        res.status(201).json({
            success: true,
            message: 'Payment successful. Booking submitted to admin for assignment. Confirmation email sent.',
            course: newCourse
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