// backend/middlewares/authMiddleware.js (MODIFIED)

import { verifyToken } from '@clerk/backend'; 
import asyncHandler from 'express-async-handler';
import User from '../models/UserModel.js'; // 🛑 NEW IMPORT: Mongoose User Model

export const protect = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token found' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 1. Verify token with Clerk
        const verifiedToken = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        });

        const clerkId = verifiedToken?.sub;

        if (!clerkId) {
            return res.status(401).json({ message: 'Invalid or missing user ID in token' });
        }

        // 2. Fetch/Upsert User in MongoDB using Clerk ID (THE FIX)
        const user = await User.findOneAndUpdate(
            { clerkId: clerkId },
            { 
                // Set defaults on insert if the user is new
                $setOnInsert: { 
                    email: verifiedToken.email, // Use email from the token if available
                    studentName: verifiedToken.name || 'New Student',
                }
            },
            { 
                new: true, // Return the updated/new document
                upsert: true, // Create if not found 🛑 CRITICAL FIX 🛑
                setDefaultsOnInsert: true 
            }
        );

        if (!user) {
            // Should not happen with upsert: true, but good safeguard
            return res.status(500).json({ message: 'Failed to create or find user record in database.' });
        }

        // 3. Attach the Mongoose User Document to req.user
        req.user = user;
        
        // You can still attach req.auth if other parts of the app rely on it
        req.auth = { userId: clerkId }; 
        
        next();
        
    } catch (error) {
        console.error('❌ Authentication failure:', error.message);
        res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
});