// backend/controllers/userController.js

import asyncHandler from 'express-async-handler';
import User from '../models/UserModel.js'; 
import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import ClassRequest from '../models/ClassRequest.js';
// 🛑 FIX: Updated to use the recommended @clerk/express package 🛑
import { clerkClient } from '@clerk/express'; 

dotenv.config();

// 🛑 NEW: Initialize Stripe Client 🛑
import Stripe from 'stripe'; 
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
    console.error("FATAL ERROR: STRIPE_SECRET_KEY is not defined in .env");
}
// Pass the API key directly to Stripe for initialization
const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2020-08-27', // Use a stable API version
}); 
// 🛑 END Stripe Initialization 🛑


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


// 🛑 MODIFIED: Controller for Payment and Booking (Now using Stripe Payment Intent) 🛑
export const processPaymentAndBooking = asyncHandler(async (req, res) => {
    const studentClerkId = getClerkUserIdFromToken(req);

    if (!studentClerkId) {
        return res.status(401).json({ success: false, message: "Authentication failed. Please log in again." });
    }

    const { 
        courseDetails, 
        scheduleDetails, 
        studentDetails, 
        guardianDetails,
        paymentMethodId, // 🛑 NEW: Expecting Stripe PaymentMethod ID 🛑
        amount, // Amount in cents
        currency,
        cardHolderEmail,
        customerName,
    } = req.body;

    // --- Variables initialized for payment response ---
    let transactionSucceeded = false;
    let transactionID = null;
    let errorDetails = 'Payment processing failed.';
    // --- END Variables ---

    try {
        // --- 1. Process STRIPE Payment Intent ---
        
        if (!paymentMethodId) {
            throw new Error("Missing secure payment details. Ensure frontend uses Stripe Elements.");
        }

        console.log(`Creating Stripe Payment Intent for clerkId: ${studentClerkId} amount: ${amount}`);

        // Create and Confirm the Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Amount in cents
            currency: currency.toLowerCase(), // 'aud'
            payment_method: paymentMethodId,
            confirm: true,
            off_session: false, // Ensure confirmation occurs immediately
            receipt_email: cardHolderEmail,
            description: `Course enrollment for ${courseDetails.courseTitle}`,
            metadata: {
                clerkId: studentClerkId,
                courseTitle: courseDetails.courseTitle,
                purchaseType: scheduleDetails.purchaseType
            }
        });
        
        // Check the status of the Payment Intent
        if (paymentIntent.status === 'succeeded') {
            transactionSucceeded = true;
            transactionID = paymentIntent.id;
        } else if (paymentIntent.status === 'requires_action') {
             // 3D Secure or other action required. The frontend should handle this,
             // but we return the client_secret so the client can confirm it.
             console.log("Stripe requires additional action. Sending client secret back.");
             // This branch is usually hit only if 'confirm: false' or requires manual confirmation.
             // If confirm: true is used, the intent will likely go straight to succeeded or failed.
             
             // For a successful end-to-end flow, we need to handle the intent client secret.
             // For simplicity, if this is hit, we return a success but with the client secret.
             return res.status(200).json({ 
                success: true, 
                requiresAction: true,
                clientSecret: paymentIntent.client_secret,
                message: 'Payment requires additional action (3DS). Proceeding to final step.'
             });

        } else {
            // General failure (e.g., declined)
            errorDetails = `Payment declined by Stripe. Status: ${paymentIntent.status}`;
            throw new Error(errorDetails);
        }
        
        // 🛑 END CORE STRIPE LOGIC 🛑


        if (!transactionSucceeded) {
            console.error(`Transaction failed: ${errorDetails} (ID: ${transactionID})`);
            return res.status(402).json({ 
                success: false, 
                message: `Payment failed. Reason: ${errorDetails.split(',')[0] || 'Transaction declined by bank.'}` 
            });
        }
        
        console.log(`✅ Stripe Payment Successful. Transaction ID: ${transactionID}`);


        // --- 2. Finalize Booking (Booking Logic) ---
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
            clerkUser = await clerkClient.users.getUser(studentClerkId);
        } catch (clerkError) {
            if (!emailToUse) {
                emailToUse = 'unknown_clerk_failure@example.com';
            }
        }
        
        if (!emailToUse && clerkUser) {
            emailToUse = clerkUser?.emailAddresses[0]?.emailAddress || 'unknown@example.com';
        }
        
        let student = await User.findOneAndUpdate(
            { clerkId: studentClerkId },
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
            return res.status(409).json({ success: false, message: 'You have already enrolled in this course.' });
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
            studentId: studentClerkId,
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
            // 🛑 Payment Details 🛑
            paymentStatus: 'paid', 
            transactionId: transactionID, // Using Stripe Payment Intent ID
            amountPaid: amount / 100,
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
            // 🛑 Payment Details 🛑
            paymentStatus: 'paid', 
            transactionId: transactionID, // Using Stripe Payment Intent ID
            amountPaid: amount / 100,
        };
        student.courses.push(newCourse);
        await student.save();

        // Final successful response (not requires_action)
        res.status(201).json({ 
            success: true, 
            message: 'Payment successful. Booking submitted to admin for assignment.', 
            course: newCourse 
        });

    } catch (error) {
        console.error('Error in Stripe payment/booking flow:', error.message);
        // Handle Stripe Errors
        if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
             return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message || 'Server error during payment and booking. Please try again.' });
    }
});

// 🛑 REMOVED: Old createBooking is redundant 🛑
export const createBooking = asyncHandler(async (req, res) => {
    return res.status(405).json({ success: false, message: "Use /process-payment endpoint for new bookings." });
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