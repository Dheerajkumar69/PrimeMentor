// backend/routes/adminRoutes.js

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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
    addMeeting,
    updateAssessmentTeachers,
    getTeacherSchedule,
    checkTeacherAvailability,
    uploadTimetableCSV,
    getNextAvailableSlot,
} from '../controllers/adminController.js';
import { getPricing, updatePricing } from '../controllers/pricingController.js';
import { adminOnlyMiddleware } from '../middlewares/adminMiddleware.js';

const router = express.Router();

// --- PUBLIC ROUTES (No Middleware) ---
router.post('/login', adminLogin);
router.get('/pricing', getPricing);

// 🛑 All Admin routes MUST be protected by the admin-only check. 🛑
router.use(adminOnlyMiddleware);

router.get('/students', getAllStudents);
router.put('/pricing', updatePricing);

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

// Add a follow-up meeting to an already-scheduled assessment
router.put('/assessment/:assessmentId/add-meeting', addMeeting);

// Update teachers on an already-scheduled assessment
router.put('/assessment/:assessmentId/update-teachers', updateAssessmentTeachers);

// Teacher Schedule & Availability
router.get('/teacher/:id/schedule', getTeacherSchedule);
router.post('/check-teacher-availability', checkTeacherAvailability);

// CSV Timetable Upload & Next Available Slot
// --- Dedicated multer for CSV: type filter + 2MB limit ---
const csvUploadDir = path.resolve('uploads');
if (!fs.existsSync(csvUploadDir)) fs.mkdirSync(csvUploadDir, { recursive: true });

const csvStorage = multer.diskStorage({
    destination: csvUploadDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const csvUpload = multer({
    storage: csvStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.csv') {
            return cb(new Error('Only .csv files are allowed.'), false);
        }
        cb(null, true);
    },
});
router.post('/upload-timetable', csvUpload.single('csvFile'), uploadTimetableCSV);
router.get('/teacher/:id/next-available-slot', getNextAvailableSlot);

export default router;