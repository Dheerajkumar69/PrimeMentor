// backend/controllers/adminController.js

import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import User from '../models/UserModel.js';
import TeacherModel from '../models/TeacherModel.js';
import ClassRequest from '../models/ClassRequest.js';
import PastClassModel from '../models/PastClassModel.js';
import FeedbackModel from '../models/FeedbackModel.js';
import Assessment from '../models/AssessmentModel.js';
import Syllabus from '../models/SyllabusModel.js';
import generateToken from '../utils/generateToken.js';
import { createZoomMeeting } from '../utils/zoomIntegration.js';
import { sendAssessmentApprovalEmail, sendClassAssignmentEmail } from '../utils/emailService.js';

// --- Hardcoded Admin Credentials (Matching Frontend) ---
const HARDCODED_ADMIN_EMAIL = 'admin@primementor.com.au';
const HARDCODED_ADMIN_PASSWORD = 'Adminprime@315';
const DUMMY_ADMIN_ID = 'admin_root_id';

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

    // Check against hardcoded credentials
    if (email === HARDCODED_ADMIN_EMAIL && password === HARDCODED_ADMIN_PASSWORD) {
        // Successful login: Generate a token for future requests
        const token = generateToken(DUMMY_ADMIN_ID);

        res.json({
            message: 'Admin login successful',
            token: token,
            adminId: DUMMY_ADMIN_ID,
        });
    } else {
        res.status(401); // Unauthorized
        throw new Error('Invalid email or password for Admin access.');
    }
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

    // 2. Update the ClassRequest with the assigned teacher and status
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
        assignedTeacherName: teacher.name
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

// @desc    Admin approves a free assessment: assigns teacher, creates Zoom meeting, sends emails
// @route   PUT /api/admin/assessment/:assessmentId/approve
// @access  Private (Admin Only)
export const approveAssessment = asyncHandler(async (req, res) => {
    const { assessmentId } = req.params;
    const { teacherId, scheduledDate, scheduledTime } = req.body;

    // 1. Validate required fields
    if (!teacherId || !scheduledDate || !scheduledTime) {
        res.status(400);
        throw new Error('teacherId, scheduledDate, and scheduledTime are all required.');
    }

    // 2. Find the assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
        res.status(404);
        throw new Error('Assessment not found.');
    }

    if (assessment.status === 'Scheduled' || assessment.status === 'Completed') {
        res.status(400);
        throw new Error(`Assessment is already ${assessment.status}. Cannot approve again.`);
    }

    // 3. Find the teacher
    const teacher = await TeacherModel.findById(teacherId);
    if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found.');
    }

    // 4. Create Zoom meeting
    const studentName = `${assessment.studentFirstName} ${assessment.studentLastName}`;
    const meetingTopic = `Free Assessment: ${assessment.subject} — ${studentName} (Year ${assessment.class})`;

    // Build the start time from date + time
    const meetingStartTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    if (isNaN(meetingStartTime.getTime())) {
        res.status(400);
        throw new Error('Invalid date/time format. Use YYYY-MM-DD for date and HH:MM for time.');
    }

    let zoomData;
    try {
        zoomData = await createZoomMeeting(meetingTopic, meetingStartTime, 30); // 30 min duration
        console.log('✅ Zoom meeting created:', zoomData.meetingId);
    } catch (zoomError) {
        console.error('❌ Zoom meeting creation failed:', zoomError.message);
        res.status(502);
        throw new Error(`Failed to create Zoom meeting: ${zoomError.message}`);
    }

    // 5. Update the assessment record
    assessment.teacherId = teacher._id;
    assessment.teacherName = teacher.name;
    assessment.teacherEmail = teacher.email;
    assessment.scheduledDate = meetingStartTime;
    assessment.scheduledTime = scheduledTime;
    assessment.zoomMeetingLink = zoomData.joinUrl;
    assessment.zoomStartLink = zoomData.startUrl;
    assessment.zoomMeetingId = String(zoomData.meetingId);
    assessment.status = 'Scheduled';

    const updatedAssessment = await assessment.save();
    console.log('✅ Assessment updated to Scheduled:', updatedAssessment._id);

    // 6. Format date for emails
    const formattedDate = meetingStartTime.toLocaleDateString('en-AU', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const emailDetails = {
        studentName,
        teacherName: teacher.name,
        subject: assessment.subject,
        yearLevel: assessment.class,
        scheduledDate: formattedDate,
        scheduledTime: scheduledTime,
        zoomLink: zoomData.joinUrl,       // For students/parents (join as participant)
        zoomStartLink: zoomData.startUrl, // For teacher (start as host)
    };

    // 7. Send emails (non-blocking — don't fail the request if email fails)
    // Send to student email
    if (assessment.studentEmail) {
        try {
            await sendAssessmentApprovalEmail(
                assessment.studentEmail,
                studentName,
                'student',
                emailDetails
            );
            console.log('✅ Student email sent to:', assessment.studentEmail);
        } catch (emailErr) {
            console.error('⚠️ Failed to send student email:', emailErr.message);
        }
    }

    // Also send to parent email if it's different from student email
    if (assessment.parentEmail && assessment.parentEmail !== assessment.studentEmail) {
        try {
            await sendAssessmentApprovalEmail(
                assessment.parentEmail,
                studentName,
                'student',
                emailDetails
            );
            console.log('✅ Parent email sent to:', assessment.parentEmail);
        } catch (emailErr) {
            console.error('⚠️ Failed to send parent email:', emailErr.message);
        }
    }

    try {
        // Email to teacher
        await sendAssessmentApprovalEmail(
            teacher.email,
            teacher.name,
            'teacher',
            emailDetails
        );
        console.log('✅ Teacher email sent to:', teacher.email);
    } catch (emailErr) {
        console.error('⚠️ Failed to send teacher email:', emailErr.message);
    }

    // 8. Return success response
    res.json({
        message: 'Assessment approved! Zoom meeting created and emails sent.',
        assessment: updatedAssessment,
        zoom: {
            meetingId: zoomData.meetingId,
            joinUrl: zoomData.joinUrl,
        },
    });
});
