// backend/controllers/userController.js

import asyncHandler from 'express-async-handler';
import User from '../models/UserModel.js'; 
import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import ClassRequest from '../models/ClassRequest.js';
import { clerkClient } from '@clerk/express'; 

dotenv.config();

// 🛑 NEW: Initialize eWAY Client 🛑
import rapid from 'eway-rapid'; 
const EWAY_API_KEY = process.env.EWAY_API_KEY;
const EWAY_PASSWORD = process.env.EWAY_PASSWORD;
const EWAY_ENDPOINT = process.env.EWAY_ENDPOINT || 'sandbox'; // Default to sandbox
// This variable MUST be set to your live domain in the .env file (e.g., https://primementor.com.au)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

if (!EWAY_API_KEY || !EWAY_PASSWORD) {
    console.error("FATAL ERROR: EWAY_API_KEY or EWAY_PASSWORD is not defined in .env");
}

const ewayClient = rapid.createClient(EWAY_API_KEY, EWAY_PASSWORD, EWAY_ENDPOINT);
// 🛑 END eWAY Initialization 🛑


const getClerkUserIdFromToken = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return null;
    }
    
    try {
        const decoded = jwt.decode(token);
        // Clerk tokens use 'sub' (subject) to store the user ID
        return decoded?.sub || null; 
    } catch (error) {
        console.error("JWT Decode Error (Clerk Token):", error);
        return null;
    }
}


// 🛑 MODIFIED: Controller to Initiate eWAY Payment and Booking 🛑
export const initiatePaymentAndBooking = asyncHandler(async (req, res) => {
    const studentClerkId = getClerkUserIdFromToken(req);

    if (!studentClerkId) {
        return res.status(401).json({ success: false, message: "Authentication failed. Please log in again." });
    }

    const { 
        bookingPayload,
    } = req.body;
    
    const { 
        courseDetails, 
        scheduleDetails, 
        studentDetails, 
        guardianDetails,
        paymentAmount, // Amount in dollars (e.g., 100.00)
        currency = 'AUD',
    } = bookingPayload;

    try {
        // --- 1. Prepare eWAY Payload ---
        const amountInCents = Math.round(paymentAmount * 100); 
        const customerEmail = studentDetails?.email || guardianDetails?.email || 'unknown@example.com';
        const customerName = (studentDetails?.first && studentDetails?.last) 
            ? `${studentDetails.first} ${studentDetails.last}`
            : "Customer";
            
        // 🛑 CRITICAL FIX: The CancelUrl should point to a clean page (Step 3) 
        // to allow the user to re-attempt payment without interference.
        const cleanCancelUrl = `${FRONTEND_URL}/enrollment?step=3`;
        
        console.log(`Creating eWAY Shared Payment URL for clerkId: ${studentClerkId} amount: $${paymentAmount}`);

        const response = await ewayClient.createTransaction(rapid.Enum.Method.RESPONSIVE_SHARED, {
            Payment: {
                TotalAmount: amountInCents, // Required in cents
                CurrencyCode: currency,
            },
            Customer: {
                // eWAY requires a customer ID for shared page (can be arbitrary)
                Reference: studentClerkId, 
                FirstName: studentDetails?.first || '',
                LastName: studentDetails?.last || '',
                Email: customerEmail,
                Phone: studentDetails?.phone || guardianDetails?.phone || '',
            },
            // RedirectUrl: Correctly points to the dedicated success/verification page
            RedirectUrl: `${FRONTEND_URL}/payment-status?clerkId=${studentClerkId}`, 
            // 👇 USE CLEAN CANCEL URL
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


// 🛑 NEW: Controller to Finish eWAY Payment (Called after redirect) 🛑
export const finishEwayPaymentAndBooking = asyncHandler(async (req, res) => {
    const { accessCode, clerkId, bookingPayload } = req.body; 

    if (!accessCode || !clerkId) {
        return res.status(400).json({ success: false, message: "Missing eWAY AccessCode or Clerk ID." });
    }

    // --- Variables initialized for payment response ---
    let transactionSucceeded = false;
    let transactionID = null;
    let errorDetails = 'Payment processing failed.';
    // --- END Variables ---

    try {
        // --- 1. Query eWAY Transaction Result ---
        const response = await ewayClient.queryTransaction(accessCode);
        const transaction = response.get('Transactions[0]');

        if (!transaction) {
             throw new Error("Transaction result not found with the provided AccessCode.");
        }
        
        // Check the status
        if (transaction.TransactionStatus) {
            transactionSucceeded = true;
            transactionID = transaction.TransactionID;
            console.log(`✅ eWAY Payment Successful. Transaction ID: ${transactionID}`);
        } else {
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

        // --- User Lookup/Creation Logic ---
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
        
        const courseExists = student.courses.some(c => c.name === courseDetails.courseTitle);
        if (courseExists) {
            // Log warning but return success since payment succeeded
            console.warn(`User ${clerkId} already has course ${courseDetails.courseTitle} but payment just succeeded for ID: ${transactionID}.`);
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
        
        // --- 3. Save Class Request (Pending for Admin) ---
        const newRequest = new ClassRequest({
            courseId: courseDetails.courseId,
            courseTitle: courseDetails.courseTitle,
            studentId: clerkId,
            studentName: student.studentName, 
            purchaseType: purchaseType,
            preferredDate: isTrial ? preferredDate : preferredWeekStart, 
            scheduleTime: preferredTime, 
            preferredTimeMonFri: preferredTimeMonFri,
            preferredTimeSaturday: preferredTimeSaturday,
            postcode: postcode, 
            status: 'pending',
            subject: courseDetails.subject || 'N/A', 
            zoomMeetingLink: '',
            // 🛑 Payment Details (eWAY) 🛑
            paymentStatus: 'paid', 
            transactionId: transactionID, // Using eWAY Transaction ID
            amountPaid: paymentAmount, // Amount in dollars (sent in payload)
        });
        await newRequest.save();

        // --- 4. Add Course to Student (Status: pending) ---
        const newCourse = {
            name: courseDetails.courseTitle,
            description: isTrial ? `Trial session for ${courseDetails.courseTitle}` : `Starter Pack for ${courseDetails.courseTitle}`, 
            teacher: 'Pending Teacher', 
            duration: isTrial ? '1 hour trial' : `${numberOfSessions} sessions total`,
            preferredDate: initialPreferredDate, 
            preferredTime: initialPreferredTime, 
            status: 'pending', 
            enrollmentDate: new Date(),
            zoomMeetingUrl: '', 
            preferredTimeMonFri: isTrial ? null : preferredTimeMonFri,
            preferredTimeSaturday: isTrial ? null : preferredTimeSaturday,
            sessionsRemaining: isTrial ? 1 : numberOfSessions,
            // 🛑 Payment Details (eWAY) 🛑
            paymentStatus: 'paid', 
            transactionId: transactionID, // Using eWAY Transaction ID
            amountPaid: paymentAmount, // Amount in dollars (sent in payload)
        };
        student.courses.push(newCourse);
        await student.save();

        // Final successful response
        res.status(201).json({ 
            success: true, 
            message: 'Payment successful. Booking submitted to admin for assignment.', 
            course: newCourse 
        });

    } catch (error) {
        console.error('Error in eWAY finish payment/booking flow:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Server error during eWAY payment confirmation.' });
    }
});


// getUserCourses (No Change needed)
export const getUserCourses = asyncHandler(async (req, res) => {
    // 🛑 CRITICAL FIX: Get the user ID manually from the token instead of req.auth()
    const clerkId = getClerkUserIdFromToken(req);

    if (!clerkId) {
        // 🛑 Send an explicit 401 if authentication fails
        return res.status(401).json({ courses: [], message: "Authentication failed. Please log in again." });
    }

    let clerkUser;
    // 🛑 NEW FIX: Explicitly catch errors from Clerk client API calls 🛑
    try {
        clerkUser = await clerkClient.users.getUser(clerkId);
    } catch (error) {
        console.error(`Clerk user lookup failed for ID: ${clerkId}`, error);
        // If Clerk fails, we cannot proceed.
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


// 🛑 REMOVED: Old createBooking is redundant 🛑
export const createBooking = asyncHandler(async (req, res) => {
    return res.status(405).json({ success: false, message: "Use /initiate-payment endpoint for new bookings." });
});