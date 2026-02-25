// Seed a local test teacher with status 'approved'
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const teacherSchema = new mongoose.Schema({
    name: String, email: { type: String, unique: true },
    password: String, image: { type: String, default: '' },
    address: { type: String, default: '' }, mobileNumber: { type: String, default: '' },
    subject: { type: String, default: 'Maths' },
    accountHolderName: { type: String, default: '' }, bankName: { type: String, default: '' },
    ifscCode: { type: String, default: '' }, accountNumber: { type: String, default: '' },
    aadharCard: { type: String, default: '' }, panCard: { type: String, default: '' },
    cvFile: { type: String, default: '' },
    status: { type: String, default: 'approved' },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
}, { timestamps: true });

const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected to MongoDB');

const email = 'test@teacher.com';
const password = 'Test@12345';
const salt = await bcrypt.genSalt(10);
const hashed = await bcrypt.hash(password, salt);

await Teacher.findOneAndUpdate(
    { email },
    {
        name: 'Test Teacher',
        email,
        password: hashed,
        status: 'approved',
        subject: 'Maths',
    },
    { upsert: true, new: true }
);

console.log('✅ Test teacher created/updated!');
console.log('   Email:    test@teacher.com');
console.log('   Password: Test@12345');
console.log('   Status:   approved');

await mongoose.disconnect();
process.exit(0);
