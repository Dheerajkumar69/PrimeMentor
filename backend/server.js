// backend/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import teacherRouter from './routes/teacherRoutes.js';
import userRoutes from './routes/userRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js'; 
import contactRoutes from './routes/contactRoutes.js';
import adminRoutes from './routes/adminRoutes.js'; 
import { clerkMiddleware } from '@clerk/express'; 

dotenv.config();

// ... (Environment Variable Validations remain the same) ...

// Express
const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration Update ---
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://primementor.com.au'; 

// 🎯 CRITICAL FIX: Ensure all necessary origins are explicitly listed.
const allowedOrigins = [
    'http://localhost:5173', // Local development
    FRONTEND_URL, // e.g., https://primementor.com.au (the origin reported in the error)
    `https://www.${FRONTEND_URL.replace(/https?:\/\//, '')}`, // e.g., https://www.primementor.com.au
    
    // Explicitly add a common API subdomain just in case it's used as an origin.
    // NOTE: This usually isn't necessary, but is a good safeguard.
    `https://api.${FRONTEND_URL.replace(/https?:\/\//, '')}` 
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or same-server requests)
        if (!origin) return callback(null, true); 
        
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            console.error('CORS Blocked Origin:', origin); // Log blocked origins for debugging
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Ensure all methods are allowed
    allowedHeaders: ['Content-Type', 'Authorization'], // Ensure necessary headers are allowed
}));
// --- End CORS Configuration Update ---


app.use(express.json());
connectDB(); 

// ADD the clerkMiddleware as a global middleware
app.use(clerkMiddleware()); 

// Static uploads
app.use('/images', express.static('uploads'));

// Routes
console.log('✅ Registering teacher routes...');
app.use('/api/teacher', teacherRouter);

console.log('✅ Registering student/user routes...');
app.use('/api/user', userRoutes);

console.log('✅ Registering assessment routes...');
app.use('/api/assessments', assessmentRoutes); 

console.log('✅ Registering admin routes...');
app.use('/api/admin', adminRoutes); 

console.log('✅ Registering contact routes...');
app.use('/api/contact', contactRoutes); 

// Global error handler
app.use((err, req, res, next) => {
    console.error('💥 Error:', err);
    // Clerk errors now have an httpStatus property
    if (err?.clerkError || err?.httpStatus) { 
        const status = err.httpStatus || err.statusCode || 401;
        return res.status(status).json({ message: err.message || 'Unauthorized' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
});

// Root
app.get('/', (req, res) => {
    res.send('Prime Mentor Backend API is running!');
});

// Start server
app.listen(PORT, () => console.log(`✅ Server started on http://localhost:${PORT}`));