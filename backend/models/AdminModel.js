import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
}, { timestamps: true });

const AdminModel = mongoose.models.admin || mongoose.model('Admin', adminSchema);

export default AdminModel;
