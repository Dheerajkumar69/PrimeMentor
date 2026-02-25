import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Define schemas inline (matching the real models)
const teacherSchema = new mongoose.Schema({
    name: String, email: { type: String, unique: true },
    password: String, image: String, address: String, mobileNumber: String,
    subject: String, accountHolderName: String, bankName: String,
    ifscCode: String, accountNumber: String, aadharCard: String, panCard: String,
    cvFile: String, status: String,
    resetPasswordToken: String, resetPasswordExpires: Date,
}, { timestamps: true });

const classRequestSchema = new mongoose.Schema({
    courseId: mongoose.Schema.Types.ObjectId,
    courseTitle: String, studentId: String, studentName: String,
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    purchaseType: String, preferredDate: String, scheduleTime: String,
    preferredTimeMonFri: String, preferredTimeSaturday: String,
    postcode: String, subject: String,
    status: { type: String, default: 'accepted' },
    enrollmentDate: { type: Date, default: Date.now },
    zoomMeetingLink: String,
    paymentStatus: String, transactionId: String, amountPaid: Number,
}, { timestamps: true });

const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);
const CR = mongoose.models.ClassRequest || mongoose.model('ClassRequest', classRequestSchema);

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected to MongoDB');

const teacher = await Teacher.findOne({ email: 'test@teacher.com' });
if (!teacher) { console.error('❌ Teacher not found!'); process.exit(1); }
console.log('Teacher ID:', teacher._id, '| Name:', teacher.name);

// Tomorrow (upcoming)
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

// Yesterday (past)
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];

await CR.create({
    courseId: new mongoose.Types.ObjectId(),
    courseTitle: 'Maths - Algebra Basics',
    studentId: 'student_001', studentName: 'Alice Johnson',
    teacherId: teacher._id, purchaseType: 'TRIAL',
    preferredDate: tomorrowStr, scheduleTime: '4:00pm - 5:00pm',
    subject: 'Maths', status: 'accepted',
    zoomMeetingLink: 'https://zoom.us/j/123456789',
    paymentStatus: 'paid', amountPaid: 50,
});

await CR.create({
    courseId: new mongoose.Types.ObjectId(),
    courseTitle: 'Science - Physics Intro',
    studentId: 'student_002', studentName: 'Bob Smith',
    teacherId: teacher._id, purchaseType: 'STARTER_PACK',
    preferredDate: yesterdayStr, scheduleTime: '10:00am - 11:00am',
    subject: 'Science', status: 'accepted',
    zoomMeetingLink: 'https://zoom.us/j/987654321',
    paymentStatus: 'paid', amountPaid: 100,
});

console.log('✅ Created 2 class requests:');
console.log('   1. Maths (tomorrow ' + tomorrowStr + ') → UPCOMING');
console.log('   2. Science (yesterday ' + yesterdayStr + ') → PAST');

await mongoose.disconnect();
process.exit(0);
