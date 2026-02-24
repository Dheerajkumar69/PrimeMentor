// backend/controllers/adminController.js

import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import User from '../models/UserModel.js';
import TeacherModel from '../models/TeacherModel.js';
import ClassRequest from '../models/ClassRequest.js';
import PastClassModel from '../models/PastClassModel.js';
import FeedbackModel from '../models/FeedbackModel.js';
import Assessment from '../models/AssessmentModel.js';
import AdminModel from '../models/AdminModel.js';
import Syllabus from '../models/SyllabusModel.js';
import TeacherAvailability from '../models/TeacherAvailabilityModel.js';
import generateToken from '../utils/generateToken.js';
import { createZoomMeeting, getAvailableHost } from '../utils/zoomIntegration.js';
import { sendAssessmentApprovalEmail, sendClassAssignmentEmail } from '../utils/emailService.js';

// Admin credentials are now stored in MongoDB via AdminModel.
// Run `node seedAdmin.js` to create/update the admin account.

// ======================== INTERNAL HELPER: Time-conflict detection ========================

/**
 * Parse a time string like "14:30" or "2:30 PM" into { hours, minutes } in 24h format.
 */
const parseTime24 = (timeStr) => {
    if (!timeStr) return null;
    const trimmed = timeStr.trim();

    // HH:MM (24h format)
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) return { hours: parseInt(match24[1], 10), minutes: parseInt(match24[2], 10) };

    // h:mm AM/PM
    const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match12) {
        let h = parseInt(match12[1], 10);
        const m = parseInt(match12[2], 10);
        const period = match12[3].toUpperCase();
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return { hours: h, minutes: m };
    }
    return null;
};

/**
 * Build a Date object from a date string (YYYY-MM-DD or ISO) and a time object { hours, minutes }.
 */
const buildDateTime = (dateStr, timeParsed) => {
    if (!dateStr || !timeParsed) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    d.setHours(timeParsed.hours, timeParsed.minutes, 0, 0);
    return d;
};

/**
 * Extract the first time from a schedule-time string that may be a range
 * like "3:00 PM - 4:00 PM" or a simple "15:00".
 */
const extractStartTime = (scheduleTimeStr) => {
    if (!scheduleTimeStr) return null;
    // Try splitting on " - " to get the start portion
    const parts = scheduleTimeStr.split(/\s*-\s*/);
    return parseTime24(parts[0]);
};

/**
 * Given a teacher ID and a proposed slot { date (Date), durationMin },
 * find all conflicting ClassRequests and Assessments.
 * Returns an array of conflict objects.
 */
const _findConflicts = async (teacherId, proposedStart, durationMin = 60, excludeAssessmentId = null) => {
    const proposedEnd = new Date(proposedStart.getTime() + durationMin * 60 * 1000);
    const conflicts = [];

    // 1. Check ClassRequests (accepted classes)
    const classRequests = await ClassRequest.find({
        teacherId,
        status: 'accepted',
    }).lean();

    for (const cr of classRequests) {
        const startTime = extractStartTime(cr.scheduleTime);
        if (!startTime || !cr.preferredDate) continue;

        const crStart = buildDateTime(cr.preferredDate, startTime);
        if (!crStart) continue;
        const crEnd = new Date(crStart.getTime() + 60 * 60 * 1000); // assume 1hr classes

        // Overlap check: two intervals overlap if start1 < end2 AND start2 < end1
        if (proposedStart < crEnd && crStart < proposedEnd) {
            conflicts.push({
                type: 'class',
                title: cr.courseTitle,
                studentName: cr.studentName,
                date: cr.preferredDate,
                time: cr.scheduleTime,
                id: cr._id,
            });
        }
    }

    // 2. Check Assessments (scheduled free assessments)
    const assessmentQuery = {
        teacherIds: teacherId,
        status: 'Scheduled',
    };
    if (excludeAssessmentId) {
        assessmentQuery._id = { $ne: excludeAssessmentId };
    }
    const assessments = await Assessment.find(assessmentQuery).lean();

    for (const a of assessments) {
        const startTime = parseTime24(a.scheduledTime);
        if (!startTime || !a.scheduledDate) continue;

        const aStart = buildDateTime(a.scheduledDate, startTime);
        if (!aStart) continue;
        const aEnd = new Date(aStart.getTime() + 30 * 60 * 1000); // assessments are 30min

        if (proposedStart < aEnd && aStart < proposedEnd) {
            conflicts.push({
                type: 'assessment',
                title: `Free Assessment: ${a.subject}`,
                studentName: `${a.studentFirstName} ${a.studentLastName}`,
                date: a.scheduledDate,
                time: a.scheduledTime,
                id: a._id,
            });
        }
    }

    return conflicts;
};

// 🛑 NEW FUNCTION: deleteTeacherById 🛑
export const deleteTeacherById = asyncHandler(async (req, res) => {
    const teacherId = req.params.id;

    // Find and delete the teacher record
    const result = await TeacherModel.findByIdAndDelete(teacherId);

    if (!result) {
        res.status(404);
        throw new Error('Teacher not found or already deleted.');
    }

    res.json({ message: `Teacher with ID ${teacherId} deleted successfully.` });
});

// 🛑 NEW: Add a teacher from the Admin Panel
export const addTeacher = asyncHandler(async (req, res) => {
    const {
        name, email, password, address, mobileNumber, subject,
        accountHolderName, bankName, ifscCode, accountNumber,
        aadharCard, panCard, status
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Name, email, and password are required.');
    }
    if (password.length < 8) {
        res.status(400);
        throw new Error('Password must be at least 8 characters.');
    }

    // Check for duplicate email
    const exists = await TeacherModel.findOne({ email });
    if (exists) {
        res.status(409);
        throw new Error('A teacher with this email already exists.');
    }

    // Get uploaded files
    const imagePath = req.files?.image?.[0]?.filename || null;
    const cvPath = req.files?.cvFile?.[0]?.filename || null;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const teacher = await TeacherModel.create({
        name, email, password: hashedPassword,
        image: imagePath, address, mobileNumber, subject,
        accountHolderName, bankName, ifscCode, accountNumber,
        aadharCard, panCard, cvFile: cvPath,
        status: status || 'approved' // Admin-created teachers default to approved
    });

    // Return created teacher without password
    const teacherObj = teacher.toObject();
    delete teacherObj.password;

    res.status(201).json(teacherObj);
});

// 🛑 NEW: Update a teacher's details from the Admin Panel
export const updateTeacher = asyncHandler(async (req, res) => {
    const teacherId = req.params.id;
    const teacher = await TeacherModel.findById(teacherId);

    if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found.');
    }

    // Fields that can be updated
    const updatableFields = [
        'name', 'email', 'mobileNumber', 'address', 'subject', 'status',
        'accountHolderName', 'bankName', 'ifscCode', 'accountNumber',
        'aadharCard', 'panCard'
    ];

    updatableFields.forEach(field => {
        if (req.body[field] !== undefined) {
            teacher[field] = req.body[field];
        }
    });

    // Handle file uploads if present
    if (req.files?.image?.[0]?.filename) {
        teacher.image = req.files.image[0].filename;
    }
    if (req.files?.cvFile?.[0]?.filename) {
        teacher.cvFile = req.files.cvFile[0].filename;
    }

    // Handle password change (optional)
    if (req.body.password && req.body.password.length >= 8) {
        const salt = await bcrypt.genSalt(10);
        teacher.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedTeacher = await teacher.save();
    const teacherObj = updatedTeacher.toObject();
    delete teacherObj.password;

    res.json(teacherObj);
});

// 🛑 NEW: Replace a teacher — reassign all their active classes & assessments to another teacher
export const replaceTeacher = asyncHandler(async (req, res) => {
    const { oldTeacherId } = req.params;
    const { newTeacherId } = req.body;

    if (!newTeacherId) {
        res.status(400);
        throw new Error('newTeacherId is required.');
    }
    if (oldTeacherId === newTeacherId) {
        res.status(400);
        throw new Error('Cannot replace a teacher with themselves.');
    }

    const [oldTeacher, newTeacher] = await Promise.all([
        TeacherModel.findById(oldTeacherId).select('name'),
        TeacherModel.findById(newTeacherId).select('name email'),
    ]);

    if (!oldTeacher) { res.status(404); throw new Error('Old teacher not found.'); }
    if (!newTeacher) { res.status(404); throw new Error('New teacher not found.'); }

    // Reassign active ClassRequests
    const classResult = await ClassRequest.updateMany(
        { teacherId: oldTeacherId, status: 'accepted' },
        { $set: { teacherId: newTeacherId } }
    );

    // Reassign scheduled Assessments
    const assessmentResult = await Assessment.updateMany(
        { teacherId: oldTeacherId, status: 'Scheduled' },
        { $set: { teacherId: newTeacherId, teacherName: newTeacher.name, teacherEmail: newTeacher.email } }
    );

    res.json({
        message: `Replaced ${oldTeacher.name} with ${newTeacher.name}.`,
        classesReassigned: classResult.modifiedCount,
        assessmentsReassigned: assessmentResult.modifiedCount,
    });
});


// @desc      Authenticate admin user and get token
// @route     POST /api/admin/login
// @access    Public (unprotected)
export const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Email and password are required.');
    }

    // Look up admin in MongoDB
    const admin = await AdminModel.findOne({ email });

    if (!admin) {
        res.status(401);
        throw new Error('Invalid email or password for Admin access.');
    }

    // Compare password with bcrypt hash
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
        res.status(401);
        throw new Error('Invalid email or password for Admin access.');
    }

    // Successful login: Generate a JWT with the admin's real MongoDB _id
    const token = generateToken(admin._id);

    res.json({
        message: 'Admin login successful',
        token: token,
        adminId: admin._id,
    });
});


// @desc      Get all students with their course details (KEEP AS IS)
// @route     GET /api/admin/students
// @access    Private (Admin Only)
export const getAllStudents = asyncHandler(async (req, res) => {
    // Retrieve all User records. 
    // Select specific student fields, including embedded courses.
    const students = await User.find({}).select('clerkId studentName email courses createdAt');

    res.json(students);
});

// @desc      Get all teachers for the Admin Table View
// @route     GET /api/admin/teachers
// @access    Private (Admin Only)
export const getAllTeachers = asyncHandler(async (req, res) => {
    // ✅ FIX: Set anti-caching headers to force a full response (200 OK) every time.
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const teachers = await TeacherModel.find({}).select('_id name email mobileNumber subject image createdAt status');

    res.json(teachers);
});


// @desc      Get a single teacher's full details (including sensitive info)
// @route     GET /api/admin/teacher/:id
// @access    Private (Admin Only)
export const getTeacherDetailsById = asyncHandler(async (req, res) => {
    const teacherId = req.params.id;

    // Fetch the full teacher record (excluding password)
    const teacher = await TeacherModel.findById(teacherId).select('-password');

    if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found.');
    }

    res.json(teacher);
});


// @desc      Get all syllabus entries
// @route     GET /api/admin/syllabus
// @access    Private (Admin Only)
export const getSyllabus = asyncHandler(async (req, res) => {
    const syllabi = await Syllabus.find({}).sort({ createdAt: -1 }).lean();
    res.json(syllabi);
});

// @desc      Add a new syllabus entry with PDF upload
// @route     POST /api/admin/syllabus
// @access    Private (Admin Only)
export const addSyllabus = asyncHandler(async (req, res) => {
    const { subject, grade, board, description } = req.body;

    if (!subject || !grade || !board) {
        res.status(400);
        throw new Error('Subject, grade, and board are required.');
    }

    if (!req.file) {
        res.status(400);
        throw new Error('A PDF file is required.');
    }

    const syllabus = await Syllabus.create({
        subject,
        grade,
        board,
        description: description || '',
        pdfFile: req.file.filename,
    });

    res.status(201).json(syllabus);
});

// @desc      Delete a syllabus entry and its PDF file
// @route     DELETE /api/admin/syllabus/:id
// @access    Private (Admin Only)
export const deleteSyllabus = asyncHandler(async (req, res) => {
    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
        res.status(404);
        throw new Error('Syllabus not found.');
    }

    // Remove the PDF file from disk
    if (syllabus.pdfFile) {
        const filePath = path.join('uploads', syllabus.pdfFile);
        fs.unlink(filePath, (err) => {
            if (err) console.warn(`Could not delete file ${filePath}:`, err.message);
        });
    }

    await Syllabus.findByIdAndDelete(req.params.id);

    res.json({ message: 'Syllabus deleted successfully.' });
});

// --- NEW FUNCTIONALITY FOR ADMIN CLASS REQUESTS (UNCHANGED) ---

// @desc      Get all pending class requests for Admin to review
// @route     GET /api/admin/pending-requests
// @access    Private (Admin Only)
export const getPendingClassRequests = asyncHandler(async (req, res) => {
    const requests = await ClassRequest.find({ status: 'pending' })
        .sort({ enrollmentDate: 1 })
        .lean();

    res.json(requests);
});

// @desc      Admin approves a request and assigns a teacher
// @route     PUT /api/admin/assign-teacher/:requestId
// @access    Private (Admin Only)
export const assignTeacher = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
        res.status(400);
        throw new Error('Teacher ID is required for assignment.');
    }

    // 1. Find and validate the request and teacher
    const request = await ClassRequest.findById(requestId);
    const teacher = await TeacherModel.findById(teacherId).select('name email');

    // We check for 'pending' here, which means the Admin needs a new view for 'accepted' classes to add the link
    if (!request || !teacher || request.status !== 'pending') {
        res.status(404);
        throw new Error('Class Request, Teacher not found, or Request already processed.');
    }

    // 2. ⛔ CONFLICT CHECK — Prevent double-booking for paid classes
    let conflictCheckSkipped = false;
    const startTime = extractStartTime(request.scheduleTime);
    if (startTime && request.preferredDate) {
        const proposedStart = buildDateTime(request.preferredDate, startTime);
        if (proposedStart) {
            const conflicts = await _findConflicts(teacherId, proposedStart, 60); // 1 hour classes
            if (conflicts.length > 0) {
                res.status(409);
                throw new Error(
                    `Scheduling conflict! ${teacher.name} is already booked at that time: ${conflicts.map(c => `${c.title} (${c.time})`).join(', ')}. Please choose a different teacher or time.`
                );
            }
        } else {
            conflictCheckSkipped = true;
        }
    } else {
        conflictCheckSkipped = true;
    }

    // 3. Update the ClassRequest with the assigned teacher and status
    // Note: The status is changed to 'accepted' which means it's ready for the zoom link.
    const updatedRequest = await ClassRequest.findByIdAndUpdate(
        requestId,
        { teacherId: teacherId, status: 'accepted' },
        { new: true, runValidators: false }
    );

    if (!updatedRequest) {
        res.status(500);
        throw new Error('Failed to update class request status.');
    }

    // 3. Update the Student's course entry
    const student = await User.findOne({ clerkId: request.studentId });

    if (student) {
        // Find the course based on the course name and pending status, or a robust unique identifier if available.
        const courseIndex = student.courses.findIndex(c =>
            c.name === request.courseTitle && c.status === 'pending'
        );

        if (courseIndex !== -1) {
            try {
                student.courses[courseIndex].teacher = teacher.name;
                student.courses[courseIndex].status = 'active';

                // CRITICAL: Update the zoomMeetingUrl in the Student's course if it's been manually added to the ClassRequest (though it's unlikely to be present at this stage).
                // The next controller (addZoomLink) will handle the final update.
                // student.courses[courseIndex].zoomMeetingUrl = request.zoomMeetingLink || student.courses[courseIndex].zoomMeetingUrl;

                student.markModified('courses');
                await student.save();

            } catch (studentSaveError) {
                console.error(`Error saving student ${student.studentName} course update:`, studentSaveError);
            }
        } else {
            console.warn(`Could not find pending course for student ${student.studentName} with title ${request.courseTitle}`);
        }
    } else {
        console.error(`Student with Clerk ID ${request.studentId} not found.`);
    }

    // 4. Send notification emails to student and teacher (non-blocking)
    const emailDetails = {
        studentName: request.studentName,
        teacherName: teacher.name,
        courseTitle: request.courseTitle,
        subject: request.subject,
        purchaseType: request.purchaseType,
        preferredDate: request.preferredDate,
        scheduleTime: request.scheduleTime,
    };

    // Email to student
    if (student && student.email) {
        try {
            await sendClassAssignmentEmail(
                student.email,
                request.studentName,
                'student',
                emailDetails
            );
            console.log('✅ Student class assignment email sent to:', student.email);
        } catch (emailErr) {
            console.error('⚠️ Failed to send student class assignment email:', emailErr.message);
        }
    }

    // Email to teacher
    if (teacher.email) {
        try {
            await sendClassAssignmentEmail(
                teacher.email,
                teacher.name,
                'teacher',
                emailDetails
            );
            console.log('✅ Teacher class assignment email sent to:', teacher.email);
        } catch (emailErr) {
            console.error('⚠️ Failed to send teacher class assignment email:', emailErr.message);
        }
    }

    res.json({
        message: 'Teacher assigned and class request approved successfully. Notification emails sent.',
        request: updatedRequest,
        assignedTeacherName: teacher.name,
        ...(conflictCheckSkipped && {
            warning: 'Conflict check was skipped because the class request is missing a preferred date or schedule time. Please verify manually that there is no scheduling overlap.',
        }),
    });
});


// 🛑 NEW FUNCTION: addZoomLink 🛑
// @desc      Admin manually adds a Zoom link to an 'accepted' class request
// @route     PUT /api/admin/add-zoom-link/:requestId
// @access    Private (Admin Only)
export const addZoomLink = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { zoomMeetingLink } = req.body;

    if (!zoomMeetingLink) {
        res.status(400);
        throw new Error('Zoom Meeting Link is required.');
    }

    // 1. Find the ClassRequest
    const request = await ClassRequest.findById(requestId);

    if (!request || request.status !== 'accepted') {
        res.status(404);
        throw new Error(`Class Request not found or not in 'accepted' status.`);
    }

    // 2. Update the ClassRequest with the Zoom link
    request.zoomMeetingLink = zoomMeetingLink;
    const updatedRequest = await request.save();

    // 3. Update the Student's corresponding course entry (CRITICAL STEP)
    const student = await User.findOne({ clerkId: request.studentId });

    if (student) {
        // Find the course based on the course name and active status
        const courseIndex = student.courses.findIndex(c =>
            c.name === request.courseTitle && c.status === 'active'
        );

        if (courseIndex !== -1) {
            try {
                // Update the zoomMeetingUrl in the Student's course
                student.courses[courseIndex].zoomMeetingUrl = zoomMeetingLink;
                student.markModified('courses');
                await student.save();
            } catch (studentSaveError) {
                console.error(`Error saving student ${student.studentName} course update with Zoom link:`, studentSaveError);
            }
        } else {
            console.warn(`Could not find active course for student ${student.studentName} with title ${request.courseTitle} to update Zoom link.`);
        }
    }

    res.json({
        message: 'Zoom meeting link added successfully.',
        request: updatedRequest,
    });
});

// 🛑 NEW FUNCTION: getAcceptedClassRequests
export const getAcceptedClassRequests = asyncHandler(async (req, res) => {
    const requests = await ClassRequest.find({ status: 'accepted' })
        .populate('teacherId', 'name email')
        .sort({ enrollmentDate: 1 })
        .lean();

    res.json(requests);
});


// 🛑 NEW FUNCTIONALITY: Fetch Past Class Submissions for Admin 🛑
// @desc      Get all submitted past class records
// @route     GET /api/admin/past-classes
// @access    Private (Admin Only)
export const getAllPastClassSubmissions = asyncHandler(async (req, res) => {
    const pastClasses = await PastClassModel.find({})
        .sort({ sessionDate: -1, sessionTime: -1 })
        .lean();

    res.json(pastClasses);
});


// 🟢 NEW FUNCTION: Get All Student Feedback 🟢
// @desc    Get all submitted student feedback for Admin
// @route   GET /api/admin/feedback
// @access  Private (Admin Only)
export const getAllFeedback = asyncHandler(async (req, res) => {
    const feedbackList = await FeedbackModel.find({})
        .sort({ submittedAt: -1 }) // Sort newest first
        .lean();

    res.json(feedbackList);
});

// @desc    Admin approves a free assessment: assigns multiple teachers, creates Zoom meeting, sends emails
// @route   PUT /api/admin/assessment/:assessmentId/approve
// @access  Private (Admin Only)
export const approveAssessment = asyncHandler(async (req, res) => {
    const { assessmentId } = req.params;
    // Accept teacherIds (array) — also support legacy teacherId (string) for backward compat
    const { teacherIds, teacherId, scheduledDate, scheduledTime } = req.body;

    // Validate assessmentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
        res.status(400);
        throw new Error('Invalid assessment ID format.');
    }

    // Normalise to an array
    let resolvedTeacherIds = teacherIds && teacherIds.length > 0
        ? teacherIds
        : (teacherId ? [teacherId] : []);

    // 1. Validate required fields
    if (resolvedTeacherIds.length === 0 || !scheduledDate || !scheduledTime) {
        res.status(400);
        throw new Error('At least one teacher, scheduledDate, and scheduledTime are all required.');
    }

    // Validate all teacher IDs are valid ObjectIds
    for (const id of resolvedTeacherIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400);
            throw new Error(`Invalid teacher ID format: ${id}`);
        }
    }

    // Deduplicate teacher IDs
    resolvedTeacherIds = [...new Set(resolvedTeacherIds)];

    // Validate scheduledDate format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
        res.status(400);
        throw new Error('Invalid date format. Use YYYY-MM-DD (e.g., 2026-03-15).');
    }

    // Validate scheduledTime format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(scheduledTime)) {
        res.status(400);
        throw new Error('Invalid time format. Use HH:MM (e.g., 14:30).');
    }

    // 2. Find the assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
        res.status(404);
        throw new Error('Assessment not found.');
    }

    if (assessment.status === 'Completed') {
        res.status(400);
        throw new Error('Assessment is already Completed. Cannot add more meetings.');
    }
    if (assessment.status === 'Canceled') {
        res.status(400);
        throw new Error('Assessment is Canceled. Cannot add meetings to a canceled assessment.');
    }

    // Cap meetings to prevent unbounded growth
    const MAX_MEETINGS = 10;
    const existingMeetingCount = Array.isArray(assessment.meetings) ? assessment.meetings.length : 0;
    if (existingMeetingCount >= MAX_MEETINGS) {
        res.status(400);
        throw new Error(`Maximum of ${MAX_MEETINGS} meetings per assessment reached.`);
    }

    // 3. Find all selected teachers
    const teachers = await TeacherModel.find({ _id: { $in: resolvedTeacherIds } });
    if (teachers.length === 0) {
        res.status(404);
        throw new Error('No valid teachers found for the given IDs.');
    }

    // Warn if some teacher IDs didn't match (but don't block)
    if (teachers.length < resolvedTeacherIds.length) {
        console.warn(`⚠️ ${resolvedTeacherIds.length - teachers.length} teacher ID(s) did not match any records.`);
    }

    // 4. ⛔ CONFLICT CHECK — Prevent double-booking
    const proposedStart = new Date(`${scheduledDate}T${scheduledTime}:00`);
    if (isNaN(proposedStart.getTime())) {
        res.status(400);
        throw new Error('Invalid date/time format. Use YYYY-MM-DD for date and HH:MM for time.');
    }

    const allConflicts = [];
    for (const teacher of teachers) {
        const teacherConflicts = await _findConflicts(teacher._id, proposedStart, 30, assessment._id);
        if (teacherConflicts.length > 0) {
            allConflicts.push({ teacherName: teacher.name, teacherId: teacher._id, conflicts: teacherConflicts });
        }
    }

    if (allConflicts.length > 0) {
        res.status(409);
        throw new Error(
            `Scheduling conflict! ${allConflicts.map(c => `${c.teacherName} is busy (${c.conflicts.map(x => x.title + ' at ' + x.time).join(', ')})`).join('; ')}. Please choose a different time.`
        );
    }

    // 5. Create Zoom meeting
    const studentName = `${assessment.studentFirstName} ${assessment.studentLastName}`;
    const teacherNamesStr = teachers.map(t => t.name).join(', ');
    const meetingTopic = `Free Assessment: ${assessment.subject} — ${studentName} (Year ${assessment.class})`;

    // ==================== IST-BASED SCHEDULING ====================
    // Admin enters date & time in IST (Asia/Kolkata).
    // The `proposedStart` Date was parsed from the raw strings above (e.g. "2026-02-20T14:30:00")
    // and represents the SERVER's local interpretation. We need the IST interpretation.

    // Build an IST-anchored UTC time: parse the admin's input as IST
    // IST = UTC+5:30, so we construct the ISO string with +05:30 offset
    const istDateTimeISO = `${scheduledDate}T${scheduledTime}:00+05:30`;
    const meetingStartUTC = new Date(istDateTimeISO); // Correct UTC instant

    if (isNaN(meetingStartUTC.getTime())) {
        res.status(400);
        throw new Error('Invalid date/time format. Use YYYY-MM-DD for date and HH:MM for time.');
    }

    // Guard against scheduling in the past (compare in IST)
    const nowIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istNow = new Date(nowIST);
    // proposedStart was built without TZ info, so compare using the same "naive" approach
    if (proposedStart < istNow) {
        res.status(400);
        throw new Error('Cannot schedule an assessment in the past (IST). Please choose a future date and time.');
    }

    // Determine the student's timezone (stored at registration) or fallback to UTC
    const studentTz = assessment.studentTimezone || 'UTC';
    console.log(`🌍 Student timezone: ${studentTz} | Admin scheduled (IST): ${scheduledDate} ${scheduledTime}`);

    // Auto-select an available Zoom host (supports 2 simultaneous meetings)
    let selectedHost;
    try {
        selectedHost = await getAvailableHost(meetingStartUTC, 30);
        console.log(`🎯 Selected Zoom host: ${selectedHost}`);
    } catch (hostErr) {
        console.error('❌ Failed to determine available Zoom host:', hostErr.message);
        selectedHost = process.env.ZOOM_HOST_EMAIL || 'me';
    }

    // Create Zoom meeting — pass the student's IANA timezone so Zoom shows correct local time
    let zoomData;
    try {
        zoomData = await createZoomMeeting(meetingTopic, meetingStartUTC, 30, studentTz, selectedHost);
        console.log('✅ Zoom meeting created:', zoomData.meetingId, '| Host:', zoomData.hostEmail);
    } catch (zoomError) {
        console.error('❌ Zoom meeting creation failed:', zoomError.message);
        res.status(502);
        throw new Error(`Failed to create Zoom meeting: ${zoomError.message}`);
    }

    // 5. Build meeting object and push into meetings[]
    const meetingObj = {
        teacherIds: teachers.map(t => t._id),
        teacherNames: teachers.map(t => t.name),
        teacherEmails: teachers.map(t => t.email),
        scheduledDate: meetingStartUTC,
        scheduledTime,
        zoomMeetingLink: zoomData.joinUrl,
        zoomStartLink: zoomData.startUrl,
        zoomMeetingId: String(zoomData.meetingId),
        zoomHostEmail: zoomData.hostEmail || selectedHost,
    };

    if (!Array.isArray(assessment.meetings)) {
        assessment.meetings = [];
    }
    assessment.meetings.push(meetingObj);

    // Legacy flat fields — always reflect the LATEST meeting for backward compat
    const primaryTeacher = teachers[0];
    assessment.teacherId = primaryTeacher._id;
    assessment.teacherName = primaryTeacher.name;
    assessment.teacherEmail = primaryTeacher.email;
    assessment.teacherIds = teachers.map(t => t._id);
    assessment.teacherNames = teachers.map(t => t.name);
    assessment.teacherEmails = teachers.map(t => t.email);
    assessment.scheduledDate = meetingStartUTC;
    assessment.scheduledTime = scheduledTime;
    assessment.zoomMeetingLink = zoomData.joinUrl;
    assessment.zoomStartLink = zoomData.startUrl;
    assessment.zoomMeetingId = String(zoomData.meetingId);
    assessment.zoomHostEmail = zoomData.hostEmail || selectedHost;
    assessment.status = 'Scheduled';

    const updatedAssessment = await assessment.save();
    console.log('✅ Assessment updated to Scheduled:', updatedAssessment._id);
    const meetingNumber = assessment.meetings.length;

    // 6. Format dates/times for emails
    // IST for teacher emails
    const istDateFormatted = meetingStartUTC.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const istTimeFormatted = meetingStartUTC.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true
    });

    // Student's local timezone for student/parent emails
    const studentDateFormatted = meetingStartUTC.toLocaleDateString('en-AU', {
        timeZone: studentTz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const studentTimeFormatted = meetingStartUTC.toLocaleTimeString('en-AU', {
        timeZone: studentTz, hour: '2-digit', minute: '2-digit', hour12: true
    });
    // Get a short timezone label for the student (e.g. "AEDT", "EST", "IST")
    const studentTzLabel = meetingStartUTC.toLocaleTimeString('en-AU', {
        timeZone: studentTz, timeZoneName: 'short'
    }).split(' ').pop(); // Extract just the timezone abbreviation

    // 7. Send emails (non-blocking — don't fail the request if email fails)
    // Student email — shows time in STUDENT's local timezone
    const studentEmailDetails = {
        studentName,
        teacherName: teacherNamesStr,
        subject: assessment.subject,
        yearLevel: assessment.class,
        scheduledDate: studentDateFormatted,
        scheduledTime: `${studentTimeFormatted} ${studentTzLabel}`,
        zoomLink: zoomData.joinUrl,
        zoomStartLink: zoomData.startUrl,
    };

    if (assessment.studentEmail) {
        try {
            await sendAssessmentApprovalEmail(
                assessment.studentEmail,
                studentName,
                'student',
                studentEmailDetails
            );
            console.log('✅ Student email sent to:', assessment.studentEmail);
        } catch (emailErr) {
            console.error('⚠️ Failed to send student email:', emailErr.message);
        }
        // Rate-limit buffer: Resend allows max 2 req/s
        await new Promise(r => setTimeout(r, 600));
    }

    // Also send to parent email if it's different from student email
    if (assessment.parentEmail && assessment.parentEmail !== assessment.studentEmail) {
        try {
            await sendAssessmentApprovalEmail(
                assessment.parentEmail,
                studentName,
                'student',
                studentEmailDetails
            );
            console.log('✅ Parent email sent to:', assessment.parentEmail);
        } catch (emailErr) {
            console.error('⚠️ Failed to send parent email:', emailErr.message);
        }
        // Rate-limit buffer
        await new Promise(r => setTimeout(r, 600));
    }

    // Send to ALL selected teachers — shows time in IST
    for (const teacher of teachers) {
        const teacherEmailDetails = {
            studentName,
            teacherName: teacher.name,
            subject: assessment.subject,
            yearLevel: assessment.class,
            scheduledDate: istDateFormatted,
            scheduledTime: `${istTimeFormatted} IST`,
            zoomLink: zoomData.joinUrl,
            zoomStartLink: zoomData.startUrl,
        };

        try {
            await sendAssessmentApprovalEmail(
                teacher.email,
                teacher.name,
                'teacher',
                teacherEmailDetails
            );
            console.log('✅ Teacher email sent to:', teacher.email);
        } catch (emailErr) {
            console.error(`⚠️ Failed to send teacher email to ${teacher.email}:`, emailErr.message);
        }
        // Rate-limit buffer between teacher emails
        if (teachers.indexOf(teacher) < teachers.length - 1) {
            await new Promise(r => setTimeout(r, 600));
        }
    }

    // 8. Return success response
    res.json({
        message: `Meeting #${meetingNumber} created! Zoom meeting created and emails sent to ${teachers.length} teacher(s).`,
        assessment: updatedAssessment,
        zoom: {
            meetingId: zoomData.meetingId,
            joinUrl: zoomData.joinUrl,
        },
    });
});


// @desc    Admin adds a follow-up meeting to an already-scheduled assessment
// @route   PUT /api/admin/assessment/:assessmentId/add-meeting
// @access  Private (Admin Only)
// Re-uses approveAssessment — the guard now allows Scheduled assessments.
export const addMeeting = approveAssessment;


// @desc    Admin updates teachers on an already-scheduled assessment
// @route   PUT /api/admin/assessment/:assessmentId/update-teachers
// @access  Private (Admin Only)
export const updateAssessmentTeachers = asyncHandler(async (req, res) => {
    const { assessmentId } = req.params;
    let { teacherIds } = req.body;

    // Validate assessmentId
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
        res.status(400);
        throw new Error('Invalid assessment ID format.');
    }

    // Validate teacherIds is a non-empty array
    if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
        res.status(400);
        throw new Error('teacherIds must be a non-empty array.');
    }

    // Cap maximum teachers to prevent abuse
    if (teacherIds.length > 50) {
        res.status(400);
        throw new Error('Cannot assign more than 50 teachers to a single assessment.');
    }

    // Validate each teacherId is a valid ObjectId
    for (const id of teacherIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400);
            throw new Error(`Invalid teacher ID format: ${id}`);
        }
    }

    // Deduplicate
    teacherIds = [...new Set(teacherIds)];

    // 1. Find the assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
        res.status(404);
        throw new Error('Assessment not found.');
    }

    if (assessment.status !== 'Scheduled') {
        res.status(400);
        throw new Error('Can only update teachers on a Scheduled assessment.');
    }

    // 2. Find all selected teachers
    const teachers = await TeacherModel.find({ _id: { $in: teacherIds } });
    if (teachers.length === 0) {
        res.status(404);
        throw new Error('No valid teachers found for the given IDs.');
    }

    // Warn if some teacher IDs didn't match
    if (teachers.length < teacherIds.length) {
        console.warn(`⚠️ ${teacherIds.length - teachers.length} teacher ID(s) did not match any records.`);
    }

    // 3. Update teacher fields
    const primaryTeacher = teachers[0];
    assessment.teacherId = primaryTeacher._id;
    assessment.teacherName = primaryTeacher.name;
    assessment.teacherEmail = primaryTeacher.email;

    assessment.teacherIds = teachers.map(t => t._id);
    assessment.teacherNames = teachers.map(t => t.name);
    assessment.teacherEmails = teachers.map(t => t.email);

    const updatedAssessment = await assessment.save();
    console.log('✅ Assessment teachers updated:', updatedAssessment._id);

    // 4. Re-send Zoom host email to all teachers
    const studentName = `${assessment.studentFirstName} ${assessment.studentLastName}`;
    const formattedDate = assessment.scheduledDate
        ? assessment.scheduledDate.toLocaleDateString('en-AU', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })
        : 'TBD';

    for (const teacher of teachers) {
        const emailDetails = {
            studentName,
            teacherName: teacher.name,
            subject: assessment.subject,
            yearLevel: assessment.class,
            scheduledDate: formattedDate,
            scheduledTime: assessment.scheduledTime,
            zoomLink: assessment.zoomMeetingLink,
            zoomStartLink: assessment.zoomStartLink,
        };

        try {
            await sendAssessmentApprovalEmail(
                teacher.email,
                teacher.name,
                'teacher',
                emailDetails
            );
            console.log('✅ Teacher re-assignment email sent to:', teacher.email);
        } catch (emailErr) {
            console.error(`⚠️ Failed to send teacher email to ${teacher.email}:`, emailErr.message);
        }
        // Rate-limit buffer between teacher emails
        if (teachers.indexOf(teacher) < teachers.length - 1) {
            await new Promise(r => setTimeout(r, 600));
        }
    }

    res.json({
        message: `Teachers updated! Emails sent to ${teachers.length} teacher(s).`,
        assessment: updatedAssessment,
    });
});


// ======================== TEACHER SCHEDULE & AVAILABILITY ========================

// @desc    Get a teacher's full schedule (all accepted classes + scheduled assessments)
// @route   GET /api/admin/teacher/:id/schedule
// @access  Private (Admin Only)
export const getTeacherSchedule = asyncHandler(async (req, res) => {
    const teacherId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        res.status(400);
        throw new Error('Invalid teacher ID format.');
    }

    const teacher = await TeacherModel.findById(teacherId).select('name email subject');
    if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found.');
    }

    // 1. Get accepted class requests
    const classRequests = await ClassRequest.find({
        teacherId,
        status: 'accepted',
    }).lean();

    const classSlots = classRequests.map(cr => ({
        type: 'class',
        title: cr.courseTitle || 'Class',
        studentName: cr.studentName,
        date: cr.preferredDate || null,
        time: cr.scheduleTime || cr.preferredTimeMonFri || null,
        subject: cr.subject || 'N/A',
        id: cr._id,
    }));

    // 2. Get scheduled assessments where this teacher is assigned
    const assessments = await Assessment.find({
        teacherIds: teacherId,
        status: 'Scheduled',
    }).lean();

    const assessmentSlots = assessments.map(a => ({
        type: 'assessment',
        title: `Free Assessment: ${a.subject}`,
        studentName: `${a.studentFirstName} ${a.studentLastName}`,
        date: a.scheduledDate ? a.scheduledDate.toISOString().split('T')[0] : null,
        time: a.scheduledTime || null,
        subject: a.subject,
        id: a._id,
        zoomLink: a.zoomMeetingLink || null,
    }));

    // 3. Get teacher availability from CSV uploads
    const availabilitySlots = await TeacherAvailability.find({ teacherId }).lean();
    const availability = availabilitySlots.map(slot => ({
        type: 'availability',
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject || '',
        lastUpdatedFromCSV: slot.lastUpdatedFromCSV,
    }));

    res.json({
        teacher: { _id: teacher._id, name: teacher.name, email: teacher.email, subject: teacher.subject },
        schedule: [...classSlots, ...assessmentSlots],
        availability,
    });
});


// @desc    Check if teacher(s) are available at a proposed date/time
// @route   POST /api/admin/check-teacher-availability
// @access  Private (Admin Only)
export const checkTeacherAvailability = asyncHandler(async (req, res) => {
    const { teacherIds, scheduledDate, scheduledTime, durationMinutes = 30, excludeAssessmentId } = req.body;

    if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
        res.status(400);
        throw new Error('teacherIds (array) is required.');
    }
    if (!scheduledDate || !scheduledTime) {
        res.status(400);
        throw new Error('scheduledDate and scheduledTime are required.');
    }

    const timeParsed = parseTime24(scheduledTime);
    if (!timeParsed) {
        res.status(400);
        throw new Error('Invalid scheduledTime format. Use HH:MM (e.g., 14:30).');
    }

    const proposedStart = buildDateTime(scheduledDate, timeParsed);
    if (!proposedStart) {
        res.status(400);
        throw new Error('Invalid scheduledDate format.');
    }

    const results = [];
    for (const tId of teacherIds) {
        if (!mongoose.Types.ObjectId.isValid(tId)) continue;
        const teacher = await TeacherModel.findById(tId).select('name');
        const conflicts = await _findConflicts(tId, proposedStart, durationMinutes, excludeAssessmentId || null);
        results.push({
            teacherId: tId,
            teacherName: teacher?.name || 'Unknown',
            available: conflicts.length === 0,
            conflicts,
        });
    }

    const allAvailable = results.every(r => r.available);
    res.json({ allAvailable, teachers: results });
});


// =====================================================================
//  CSV TIMETABLE UPLOAD
// =====================================================================

// Helper: Map day name strings to numbers (0=Sun, 1=Mon, ..., 6=Sat)
const DAY_NAME_TO_NUM = {
    sunday: 0, sun: 0,
    monday: 1, mon: 1,
    tuesday: 2, tue: 2,
    wednesday: 3, wed: 3,
    thursday: 4, thu: 4,
    friday: 5, fri: 5,
    saturday: 6, sat: 6,
};

// @desc    Upload a CSV file to set teacher availability/timetable
// @route   POST /api/admin/upload-timetable
// @access  Private (Admin Only)
export const uploadTimetableCSV = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No CSV file uploaded. Please upload a .csv file.');
    }

    let csvContent;
    try {
        csvContent = fs.readFileSync(req.file.path, 'utf-8');
    } catch (readErr) {
        // File read failed — clean up and bail
        try { fs.unlinkSync(req.file.path); } catch (_) { /* ignore */ }
        res.status(500);
        throw new Error('Failed to read the uploaded file.');
    } finally {
        // Always clean up the temp file
        try { if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (_) { /* ignore */ }
    }

    let records;
    try {
        records = csvParse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
        });
    } catch (parseErr) {
        res.status(400);
        throw new Error(`CSV parsing error: ${parseErr.message}`);
    }

    if (!records || records.length === 0) {
        res.status(400);
        throw new Error('CSV file is empty or has no data rows.');
    }

    // Validate required columns (flexible naming)
    const firstRow = records[0];
    const colKeys = Object.keys(firstRow).map(k => k.toLowerCase().trim());

    const findCol = (names) => {
        for (const name of names) {
            const idx = colKeys.findIndex(k => k.includes(name));
            if (idx !== -1) return Object.keys(firstRow)[idx];
        }
        return null;
    };

    const emailCol = findCol(['email', 'teacher_email', 'teacher email']);
    const dayCol = findCol(['day', 'day_of_week', 'dayofweek']);
    const startCol = findCol(['start', 'start_time', 'from']);
    const endCol = findCol(['end', 'end_time', 'to']);
    const subjectCol = findCol(['subject', 'course']);

    if (!emailCol || !dayCol || !startCol || !endCol) {
        res.status(400);
        throw new Error(
            `CSV must have columns for: email, day, start_time, end_time. ` +
            `Found columns: ${Object.keys(firstRow).join(', ')}. ` +
            `(Optional: subject)`
        );
    }

    // Build a map of teacher emails → teacher IDs for quick lookup
    const allTeachers = await TeacherModel.find({}).select('email name').lean();
    const emailToTeacher = {};
    for (const t of allTeachers) {
        if (t.email) emailToTeacher[t.email.toLowerCase().trim()] = t;
    }

    const results = { created: 0, skippedNoTeacher: 0, skippedInvalid: 0, errors: [] };
    const teacherIdsToReplace = new Set();
    const newSlots = [];

    for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNum = i + 2; // +2 because 1-indexed + header row

        const email = (row[emailCol] || '').toLowerCase().trim();
        const dayStr = (row[dayCol] || '').toLowerCase().trim();
        const start = (row[startCol] || '').trim();
        const end = (row[endCol] || '').trim();
        const subject = subjectCol ? (row[subjectCol] || '').trim() : '';

        // Validate email → teacher
        const teacher = emailToTeacher[email];
        if (!teacher) {
            results.skippedNoTeacher++;
            results.errors.push(`Row ${rowNum}: No teacher found for email "${email}"`);
            continue;
        }

        // Parse day
        const dayNum = DAY_NAME_TO_NUM[dayStr];
        if (dayNum === undefined) {
            results.skippedInvalid++;
            results.errors.push(`Row ${rowNum}: Invalid day "${row[dayCol]}"`);
            continue;
        }

        // Validate time format (HH:MM)
        const timeRegex = /^\d{1,2}:\d{2}$/;
        if (!timeRegex.test(start) || !timeRegex.test(end)) {
            results.skippedInvalid++;
            results.errors.push(`Row ${rowNum}: Invalid time format "${start}" / "${end}". Use HH:MM (e.g., 09:00)`);
            continue;
        }

        // Validate time semantics: start must be before end
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);
        if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) {
            results.skippedInvalid++;
            results.errors.push(`Row ${rowNum}: Non-numeric time values.`);
            continue;
        }
        if (sH > 23 || eH > 23 || sM > 59 || eM > 59) {
            results.skippedInvalid++;
            results.errors.push(`Row ${rowNum}: Time out of range (hours 0-23, minutes 0-59).`);
            continue;
        }
        if (sH * 60 + sM >= eH * 60 + eM) {
            results.skippedInvalid++;
            results.errors.push(`Row ${rowNum}: start_time (${start}) must be before end_time (${end}).`);
            continue;
        }

        teacherIdsToReplace.add(teacher._id.toString());
        newSlots.push({
            teacherId: teacher._id,
            teacherEmail: email,
            dayOfWeek: dayNum,
            startTime: start,
            endTime: end,
            subject,
            lastUpdatedFromCSV: new Date(),
        });
    }

    // Replace old availability for affected teachers, then insert new
    if (teacherIdsToReplace.size > 0) {
        const idsArray = Array.from(teacherIdsToReplace).map(id => new mongoose.Types.ObjectId(id));
        await TeacherAvailability.deleteMany({ teacherId: { $in: idsArray } });
    }

    if (newSlots.length > 0) {
        try {
            await TeacherAvailability.insertMany(newSlots, { ordered: false });
        } catch (insertErr) {
            // With ordered:false, partial inserts may succeed — count what made it
            if (insertErr.insertedDocs) {
                results.created = insertErr.insertedDocs.length;
            }
            const validationErrors = insertErr.writeErrors || [];
            for (const we of validationErrors) {
                results.errors.push(`DB validation error on row: ${we.errmsg || we.message}`);
            }
        }
        // Count what actually got inserted
        if (results.created === 0) {
            results.created = await TeacherAvailability.countDocuments({
                teacherId: { $in: Array.from(teacherIdsToReplace).map(id => new mongoose.Types.ObjectId(id)) },
                lastUpdatedFromCSV: { $gte: new Date(Date.now() - 60000) }, // inserted within last minute
            });
        }
    }

    res.json({
        message: `CSV processed. ${results.created} availability slots created for ${teacherIdsToReplace.size} teacher(s).`,
        details: results,
    });
});


// =====================================================================
//  NEXT AVAILABLE SLOT
// =====================================================================

// @desc    Get next available slot for a teacher based on their availability vs bookings
// @route   GET /api/admin/teacher/:id/next-available-slot
// @access  Private (Admin Only)
export const getNextAvailableSlot = asyncHandler(async (req, res) => {
    const teacherId = req.params.id;
    const rawDuration = parseInt(req.query.duration);
    const durationMin = (!isNaN(rawDuration) && rawDuration >= 15 && rawDuration <= 480) ? rawDuration : 60;

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        res.status(400);
        throw new Error('Invalid teacher ID format.');
    }

    const teacher = await TeacherModel.findById(teacherId).select('name email');
    if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found.');
    }

    // Get teacher's availability slots (from CSV)
    const availabilitySlots = await TeacherAvailability.find({ teacherId }).lean();
    if (availabilitySlots.length === 0) {
        res.json({
            teacherName: teacher.name,
            nextSlot: null,
            message: 'No availability data found for this teacher. Please upload a timetable CSV first.',
        });
        return;
    }

    // Group availability by dayOfWeek
    const availByDay = {};
    for (const slot of availabilitySlots) {
        if (!availByDay[slot.dayOfWeek]) availByDay[slot.dayOfWeek] = [];
        availByDay[slot.dayOfWeek].push(slot);
    }

    // Search the next 14 days for a free slot
    const now = new Date();
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + dayOffset);
        const dayOfWeek = checkDate.getDay(); // 0=Sun, 6=Sat

        const slotsForDay = availByDay[dayOfWeek];
        if (!slotsForDay) continue;

        for (const slot of slotsForDay) {
            // Parse start/end times of availability
            const parts = slot.startTime.split(':').map(Number);
            const endParts = slot.endTime.split(':').map(Number);
            if (parts.some(isNaN) || endParts.some(isNaN)) continue;
            const [sh, sm] = parts;
            const [eh, em] = endParts;

            // Iterate in 30-minute steps for finer slot detection
            let currentMin = sh * 60 + sm;
            const endMinTotal = eh * 60 + em;

            while (currentMin + durationMin <= endMinTotal) {
                const currentH = Math.floor(currentMin / 60);
                const currentM = currentMin % 60;

                const proposedStart = new Date(checkDate);
                proposedStart.setHours(currentH, currentM, 0, 0);

                // Don't suggest past times
                if (proposedStart <= now) {
                    currentMin += 30;
                    continue;
                }

                // Check for conflicts
                const conflicts = await _findConflicts(teacherId, proposedStart, durationMin);
                if (conflicts.length === 0) {
                    // Found a free slot!
                    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
                    const timeStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
                    res.json({
                        teacherName: teacher.name,
                        nextSlot: {
                            date: dateStr,
                            time: timeStr,
                            dayOfWeek,
                            dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
                            durationMinutes: durationMin,
                        },
                    });
                    return;
                }

                // Move to next 30-min block
                currentMin += 30;
            }
        }
    }

    res.json({
        teacherName: teacher.name,
        nextSlot: null,
        message: 'No available slots found in the next 14 days.',
    });
});
