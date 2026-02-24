/**
 * Admin Seeder Script
 * Usage: node seedAdmin.js
 * 
 * Creates or updates the admin account in MongoDB with hashed credentials.
 * Run this ONCE after deploying or whenever you need to reset admin credentials.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@primementor.com.au';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Adminprime@315';

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
}, { timestamps: true });

const Admin = mongoose.models.admin || mongoose.model('Admin', adminSchema);

async function seedAdmin() {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('❌ MONGODB_URI not found in environment. Set it in your .env file.');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

        const result = await Admin.findOneAndUpdate(
            { email: ADMIN_EMAIL },
            { email: ADMIN_EMAIL, password: hashedPassword, role: 'admin' },
            { upsert: true, new: true }
        );

        console.log(`✅ Admin account seeded successfully:`);
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   ID: ${result._id}`);
        console.log(`\n⚠️  For production, change the password via ADMIN_PASSWORD env var before running this script.`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeder failed:', error.message);
        process.exit(1);
    }
}

seedAdmin();
