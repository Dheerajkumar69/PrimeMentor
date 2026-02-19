// backend/routes/adminRoutes.js

import express from 'express';
import upload from '../config/multer.js';
import {
    getAllStudents,
    getAllTeachers,
    getSyllabus,
    addSyllabus,
    deleteSyllabus,
    getPendingClassRequests,
    assignTeacher,
    adminLogin,
    getTeacherDetailsById,
    deleteTeacherById,
    addTeacher,
    updateTeacher,
    replaceTeacher,
    addZoomLink,
    getAcceptedClassRequests,
    getAllPastClassSubmissions,
    getAllFeedback,
    approveAssessment,
    updateAssessmentTeachers,
    getTeacherSchedule,
    checkTeacherAvailability,
} from '../controllers/adminController.js';
import { adminOnlyMiddleware } from '../middlewares/adminMiddleware.js';

const router = express.Router();

// --- PUBLIC ROUTES (No Middleware) ---
router.post('/login', adminLogin);

// 🛑 All Admin routes MUST be protected by the admin-only check. 🛑
router.use(adminOnlyMiddleware);

router.get('/students', getAllStudents);

// Teacher routes
const teacherUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'cvFile', maxCount: 1 }
]);
router.get('/teachers', getAllTeachers);
router.get('/teacher/:id', getTeacherDetailsById);
router.post('/teacher', teacherUpload, addTeacher);
router.put('/teacher/:id', teacherUpload, updateTeacher);
router.delete('/teacher/:id', deleteTeacherById);
router.put('/replace-teacher/:oldTeacherId', replaceTeacher);

router.get('/syllabus', getSyllabus);
router.post('/syllabus', upload.single('pdfFile'), addSyllabus);
router.delete('/syllabus/:id', deleteSyllabus);

// --- Class Request Routes (Protected) ---
router.get('/pending-requests', getPendingClassRequests);
router.put('/assign-teacher/:requestId', assignTeacher);
router.put('/add-zoom-link/:requestId', addZoomLink);

// Fetch Accepted Classes
router.get('/accepted-requests', getAcceptedClassRequests);

// Fetch Past Class Submissions
router.get('/past-classes', getAllPastClassSubmissions);

// Fetch All Student Feedback
router.get('/feedback', getAllFeedback);

// Approve a free assessment (assign teacher + create Zoom + send emails)
router.put('/assessment/:assessmentId/approve', approveAssessment);

// Update teachers on an already-scheduled assessment
router.put('/assessment/:assessmentId/update-teachers', updateAssessmentTeachers);

// Teacher Schedule & Availability
router.get('/teacher/:id/schedule', getTeacherSchedule);
router.post('/check-teacher-availability', checkTeacherAvailability);

export default router;