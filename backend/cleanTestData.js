/**
 * One-time cleanup script: remove fake/seeded test data from the local database.
 * Usage: node cleanTestData.js
 *
 * This script removes:
 *   1. ClassRequest documents for seeded students (Bob Smith, Alice Johnson, test test)
 *   2. User documents for those same fake students
 *   3. The test teacher (test@teacher.com) created by seedTestTeacher.js
 *
 * Safe to run multiple times — it only deletes matching records.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
}

await mongoose.connect(mongoUri);
console.log('✅ Connected to MongoDB');

const db = mongoose.connection.db;

// --- 1. Delete fake ClassRequest records ---
const fakeStudentNames = ['Bob Smith', 'Alice Johnson', 'test test'];
const crResult = await db.collection('classrequests').deleteMany({
    studentName: { $in: fakeStudentNames },
});
console.log(`🗑️  Deleted ${crResult.deletedCount} fake ClassRequest(s)`);

// --- 2. Delete fake User records ---
const userResult = await db.collection('users').deleteMany({
    studentName: { $in: fakeStudentNames },
});
console.log(`🗑️  Deleted ${userResult.deletedCount} fake User(s)`);

// --- 3. Delete the test teacher ---
const teacherResult = await db.collection('teachers').deleteMany({
    email: 'test@teacher.com',
});
console.log(`🗑️  Deleted ${teacherResult.deletedCount} test Teacher(s)`);

// --- 4. Summary ---
const remainingPayments = await db.collection('classrequests').countDocuments({ paymentStatus: 'paid' });
console.log(`\n📊 Remaining paid ClassRequests in DB: ${remainingPayments}`);

await mongoose.disconnect();
console.log('✅ Done. Database cleaned.');
process.exit(0);
