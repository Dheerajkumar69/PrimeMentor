// backend/middlewares/authTeacherMiddleware.js
import jwt from 'jsonwebtoken';
import TeacherModel from '../models/TeacherModel.js';

export const protectTeacher = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token found' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const teacher = await TeacherModel.findById(decoded.id).select('-password');

    if (!teacher) return res.status(401).json({ message: 'Teacher not found' });

    // Double-check approval status on every request.
    // This catches tokens that were issued before this middleware was hardened,
    // and immediately locks out any teacher whose status is later changed to
    // 'pending' or 'rejected' by an admin WITHOUT waiting for token expiry.
    if (teacher.status !== 'approved') {
        return res.status(403).json({
            message: teacher.status === 'rejected'
                ? 'Your application has been rejected. Please contact support.'
                : 'Your account is pending admin approval. Please wait for your account to be reviewed.',
        });
    }

    req.user = teacher;
    next();
  } catch (err) {
    console.error('❌ JWT verification error:', err.message);
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};
