// backend/middlewares/adminMiddleware.js

import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import AdminModel from '../models/AdminModel.js';

export const adminOnlyMiddleware = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required. Access token missing.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify the admin exists in the database
        const admin = await AdminModel.findById(decoded.id).select('-password');

        if (admin && admin.role === 'admin') {
            req.admin = { id: admin._id, email: admin.email };
            return next();
        } else {
            return res.status(403).json({ message: 'Access denied. Insufficient privileges.' });
        }
    } catch (error) {
        console.error("JWT Verification failed:", error.message);
        return res.status(403).json({ message: 'Access denied. Invalid or expired administrative token.' });
    }
});
