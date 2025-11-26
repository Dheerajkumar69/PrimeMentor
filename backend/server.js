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

// Make sure in your .env you have (NO trailing slash):
// FRONTEND_URL=https://primementor.com.au

// Express
const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration (FIXED) ---

// Raw value from env, or fallback to production URL
const RAW_FRONTEND_URL = process.env.FRONTEND_URL || 'https://primementor.com.au';

// Normalize: remove any trailing slash
const FRONTEND_ORIGIN = RAW_FRONTEND_URL.replace(/\/$/, '');

// Extract domain part (primementor.com.au)
const FRONTEND_DOMAIN = FRONTEND_ORIGIN.replace(/https?:\/\//, '');

// Whitelist of allowed origins
const allowedOrigins = [
  'http://localhost:5173',          // Local dev
  FRONTEND_ORIGIN,                  // https://primementor.com.au
  `https://www.${FRONTEND_DOMAIN}`, // https://www.primementor.com.au (if ever used)
];

console.log('CORS allowedOrigins:', allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow non-browser clients (Postman, curl, same-origin SSR without Origin header)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const msg = `CORS blocked origin: ${origin}`;
      console.error(msg);
      return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Handle preflight requests explicitly
app.options('*', cors());

// --- End CORS Configuration ---

app.use(express.json());
connectDB();

// Clerk middleware (auth) – after CORS so preflight works
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

// Root
app.get('/', (req, res) => {
  res.send('Prime Mentor Backend API is running!');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Error:', err);

  // Clerk errors now have an httpStatus property
  if (err?.clerkError || err?.httpStatus) {
    const status = err.httpStatus || err.statusCode || 401;
    return res
      .status(status)
      .json({ message: err.message || 'Unauthorized' });
  }

  // Generic server error
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () =>
  console.log(`✅ Server started on http://localhost:${PORT}`)
);
