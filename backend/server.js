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

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * DEBUG logging – see every incoming request
 */
app.use((req, res, next) => {
  console.log(
    `[REQ] ${req.method} ${req.url} | Origin: ${req.headers.origin || 'N/A'}`
  );
  next();
});

/**
 * CORS – hard-coded for now
 */
const allowedOrigins = [
  'https://primementor.com.au',
  'https://www.primementor.com.au',
  'http://localhost:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        console.log('[CORS] No Origin header -> allowed');
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        console.log('[CORS] Allowed Origin:', origin);
        return callback(null, true);
      }

      console.error('[CORS] Blocked Origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ❌ REMOVE THIS – it was crashing the app
// app.options('*', cors());

app.use(express.json());
connectDB();

// If Clerk causes issues you can temporarily comment this out
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
  console.error('💥 Error middleware caught:', err);

  if (err?.clerkError || err?.httpStatus) {
    const status = err.httpStatus || err.statusCode || 401;
    return res
      .status(status)
      .json({ message: err.message || 'Unauthorized' });
  }

  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
