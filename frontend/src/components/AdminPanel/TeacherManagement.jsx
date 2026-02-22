// frontend/src/components/AdminPanel/TeacherManagement.jsx

import React, { useState, useEffect, useContext } from 'react';
import {
    Briefcase, Mail, Trash2, Edit2, User, Phone, Clock, MapPin,
    DollarSign, CreditCard, IdCard, FileText, X, BookOpen,
    AlertCircle, Plus, Save, RefreshCw, Shield, Eye, EyeOff,
    Upload, UserPlus, Replace, ChevronDown, AlertTriangle, Calendar,
    FileSpreadsheet, CheckCircle, Loader2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AppContext } from '../../context/AppContext.jsx';
import TeacherTimetableModal from './TeacherTimetableModal.jsx';

// ======================== CONSTANTS ========================
const SUBJECTS = [
    'All', 'Science', 'Maths', 'English',
    'Science + Maths', 'Science + English', 'Maths + English',
    'All Subjects'
];

const STATUS_CONFIG = {
    pending: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
    approved: { label: 'Approved', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};

const EMPTY_FORM = {
    name: '', email: '', password: '', mobileNumber: '', address: '',
    subject: '', status: 'approved',
    accountHolderName: '', bankName: '', ifscCode: '', accountNumber: '',
    aadharCard: '', panCard: '',
};

// ======================== SMALL UI HELPERS ========================
const Section = ({ title, icon: Icon, children, fullWidth = false }) => (
    <div className={`space-y-4 border p-4 rounded-lg shadow-sm ${fullWidth ? 'md:col-span-2' : ''}`}>
        <h3 className='text-lg font-semibold text-gray-700 flex items-center border-b pb-2'>
            <Icon className='w-5 h-5 mr-2 text-blue-500' /> {title}
        </h3>
        <div className='space-y-3'>{children}</div>
    </div>
);

const Detail = ({ icon: Icon, label, children }) => (
    <div className='flex items-start text-sm'>
        <Icon className='w-4 h-4 mr-2 mt-1 text-gray-500 flex-shrink-0' />
        <div>
            <span className='font-medium text-gray-700 block'>{label}:</span>
            <span className='text-gray-600 break-words'>{children}</span>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

const InputField = ({ label, icon: Icon, type = 'text', required, ...props }) => (
    <div>
        <label className='block text-xs font-semibold text-gray-600 mb-1'>
            {label} {required && <span className='text-red-500'>*</span>}
        </label>
        <div className='relative'>
            {Icon && <Icon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />}
            <input
                type={type}
                className={`w-full border border-gray-300 rounded-lg py-2 ${Icon ? 'pl-9' : 'pl-3'} pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition`}
                required={required}
                {...props}
            />
        </div>
    </div>
);

const SelectField = ({ label, icon: Icon, options, ...props }) => (
    <div>
        <label className='block text-xs font-semibold text-gray-600 mb-1'>{label}</label>
        <div className='relative'>
            {Icon && <Icon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />}
            <select
                className={`w-full border border-gray-300 rounded-lg py-2 ${Icon ? 'pl-9' : 'pl-3'} pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition appearance-none bg-white`}
                {...props}
            >
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
            <ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none' />
        </div>
    </div>
);

// ======================== CONFIRM MODAL ========================
const ConfirmModal = ({ open, title, message, confirmLabel, confirmColor, icon: ConfIcon, onConfirm, onCancel }) => {
    if (!open) return null;

    const colorMap = {
        red: { bg: 'bg-red-600 hover:bg-red-700', iconBg: 'bg-red-100', iconText: 'text-red-600' },
        orange: { bg: 'bg-orange-600 hover:bg-orange-700', iconBg: 'bg-orange-100', iconText: 'text-orange-600' },
    };
    const colors = colorMap[confirmColor] || colorMap.red;
    const Icon = ConfIcon || AlertTriangle;

    return (
        <div className='fixed inset-0 z-[60] backdrop-blur-sm bg-black/40 flex justify-center items-center p-4'>
            <div className='bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in'>
                <div className='flex items-start gap-4'>
                    {/* Icon circle */}
                    <div className={`flex-shrink-0 w-11 h-11 rounded-full ${colors.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${colors.iconText}`} />
                    </div>
                    {/* Text */}
                    <div className='flex-1'>
                        <h3 className='text-lg font-bold text-gray-900'>{title}</h3>
                        <p className='mt-1.5 text-sm text-gray-600 leading-relaxed'>{message}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100'>
                    <button
                        type='button'
                        onClick={onCancel}
                        className='px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={onConfirm}
                        className={`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition shadow ${colors.bg}`}
                    >
                        {confirmLabel || 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ======================== DETAILS MODAL ========================
const TeacherDetailsModal = ({ teacher, onClose, backendUrl, adminToken, onEdit, onReplace, allTeachers, onViewTimetable }) => {
    const [showReplace, setShowReplace] = useState(false);
    const [replaceTarget, setReplaceTarget] = useState('');
    const [replacing, setReplacing] = useState(false);
    const [nextSlotLoading, setNextSlotLoading] = useState(false);
    const [nextSlotData, setNextSlotData] = useState(null); // { nextSlot, message }

    if (!teacher) return null;

    const fetchNextSlot = async () => {
        setNextSlotLoading(true);
        setNextSlotData(null);
        try {
            const res = await axios.get(`${backendUrl}/api/admin/teacher/${teacher._id}/next-available-slot`, {
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            setNextSlotData(res.data);
        } catch (err) {
            setNextSlotData({ nextSlot: null, message: err.response?.data?.message || 'Failed to fetch.' });
        } finally {
            setNextSlotLoading(false);
        }
    };

    const getFileUrl = (filename) => filename ? `${backendUrl}/images/${filename}` : null;
    const profileImageUrl = getFileUrl(teacher.image);
    const cvFileUrl = getFileUrl(teacher.cvFile);

    const handleReplace = async () => {
        if (!replaceTarget) return toast.error('Select a replacement teacher.');
        setReplacing(true);
        try {
            await onReplace(teacher._id, replaceTarget);
            setShowReplace(false);
            setReplaceTarget('');
        } finally {
            setReplacing(false);
        }
    };

    return (
        <div className='fixed inset-0 z-50 backdrop-blur-sm bg-black/30 flex justify-center items-center p-4'>
            <div className='bg-white p-6 sm:p-10 rounded-xl shadow-2xl text-slate-500 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative'>
                <h2 className='text-2xl font-bold text-gray-800 border-b pb-3 mb-6 flex items-center'>
                    <User className='w-6 h-6 mr-2 text-blue-500' /> {teacher.name}'s Full Profile
                </h2>

                <button type='button' onClick={onClose} className='absolute top-3 right-3 text-gray-500 hover:text-gray-900 transition' aria-label="Close">
                    <X size={20} />
                </button>

                {/* Profile Image and Status */}
                <div className="flex items-center space-x-6 mb-8">
                    <img
                        src={profileImageUrl || 'https://placehold.co/100x100/cccccc/000000?text=👤'}
                        alt={`${teacher.name} profile`}
                        className="h-24 w-24 rounded-full object-cover border-4 border-blue-500 shadow-md"
                    />
                    <div>
                        <p className='text-3xl font-extrabold text-gray-900'>{teacher.name}</p>
                        <p className='text-md text-gray-600 mb-2'>{teacher.email}</p>
                        <StatusBadge status={teacher.status} />
                    </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'>
                    {/* Personal Information */}
                    <Section title="Personal Information" icon={User}>
                        <Detail icon={Mail} label="Email">{teacher.email}</Detail>
                        <Detail icon={Phone} label="Mobile Number">{teacher.mobileNumber || 'N/A'}</Detail>
                        <Detail icon={MapPin} label="Address">{teacher.address || 'N/A'}</Detail>
                        <Detail icon={BookOpen} label="Subjects">{teacher.subject || 'N/A'}</Detail>
                        <Detail icon={Clock} label="Joined">{teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'N/A'}</Detail>
                    </Section>

                    {/* Banking Details */}
                    <Section title="Banking Details" icon={DollarSign}>
                        <Detail icon={User} label="Account Holder">{teacher.accountHolderName || 'N/A'}</Detail>
                        <Detail icon={CreditCard} label="Bank Name">{teacher.bankName || 'N/A'}</Detail>
                        <Detail icon={IdCard} label="IFSC Code">{teacher.ifscCode || 'N/A'}</Detail>
                        <Detail icon={CreditCard} label="Account Number">{teacher.accountNumber || 'N/A'}</Detail>
                    </Section>

                    {/* Documents */}
                    <Section title="Identification & Documents" icon={FileText} fullWidth>
                        <Detail icon={IdCard} label="Aadhar Card No.">{teacher.aadharCard || 'N/A'}</Detail>
                        <Detail icon={IdCard} label="PAN Card No.">{teacher.panCard || 'N/A'}</Detail>
                        <Detail icon={FileText} label="CV File">
                            {cvFileUrl ? (
                                <a href={cvFileUrl} target="_blank" rel="noopener noreferrer" className='text-blue-600 hover:text-blue-800 flex items-center text-sm'>
                                    View CV <FileText className='w-4 h-4 ml-1' />
                                </a>
                            ) : 'N/A'}
                        </Detail>
                    </Section>
                </div>

                {/* Action Buttons */}
                <div className='flex flex-wrap gap-3 mt-8 pt-6 border-t'>
                    <button
                        onClick={() => { onClose(); onEdit(teacher); }}
                        className='flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow'
                    >
                        <Edit2 className='w-4 h-4' /> Edit Teacher
                    </button>
                    <button
                        onClick={() => setShowReplace(!showReplace)}
                        className='flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition shadow'
                    >
                        <Replace className='w-4 h-4' /> Replace Teacher
                    </button>
                    <button
                        onClick={onViewTimetable}
                        className='flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white text-sm font-semibold rounded-lg hover:bg-purple-600 transition shadow'
                    >
                        <Calendar className='w-4 h-4' /> View Timetable
                    </button>
                    <button
                        onClick={fetchNextSlot}
                        disabled={nextSlotLoading}
                        className='flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white text-sm font-semibold rounded-lg hover:bg-teal-600 disabled:opacity-50 transition shadow'
                    >
                        {nextSlotLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Clock className='w-4 h-4' />}
                        Next Available Slot
                    </button>
                </div>

                {/* Next Available Slot Result */}
                {nextSlotData && (
                    <div className={`mt-3 p-3 rounded-lg border text-sm ${nextSlotData.nextSlot ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                        {nextSlotData.nextSlot ? (
                            <p className='font-medium text-teal-800'>
                                ✅ Next free slot: <strong>{nextSlotData.nextSlot.dayName}, {nextSlotData.nextSlot.date}</strong> at <strong>{nextSlotData.nextSlot.time}</strong>
                            </p>
                        ) : (
                            <p className='text-gray-600'>{nextSlotData.message || 'No slots available in the next 14 days.'}</p>
                        )}
                    </div>
                )}

                {/* Replace Teacher Inline Section */}
                {showReplace && (
                    <div className='mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-3'>
                        <p className='text-sm font-semibold text-orange-800'>
                            Reassign all active classes & scheduled assessments from <strong>{teacher.name}</strong> to:
                        </p>
                        <select
                            value={replaceTarget}
                            onChange={(e) => setReplaceTarget(e.target.value)}
                            className='w-full border border-orange-300 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-2 focus:ring-orange-400 bg-white'
                        >
                            <option value=''>-- Select Replacement Teacher --</option>
                            {allTeachers
                                .filter(t => t._id !== teacher._id)
                                .map(t => <option key={t._id} value={t._id}>{t.name} ({t.subject || 'No subject'})</option>)
                            }
                        </select>
                        <button
                            onClick={handleReplace}
                            disabled={replacing || !replaceTarget}
                            className='flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 transition'
                        >
                            <RefreshCw className={`w-4 h-4 ${replacing ? 'animate-spin' : ''}`} />
                            {replacing ? 'Reassigning...' : 'Confirm Replacement'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ======================== ADD / EDIT MODAL ========================
const TeacherFormModal = ({ mode, initialData, onClose, onSave, backendUrl }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [imageFile, setImageFile] = useState(null);
    const [cvFile, setCvFile] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setForm({
                name: initialData.name || '',
                email: initialData.email || '',
                password: '', // never pre-fill password
                mobileNumber: initialData.mobileNumber || '',
                address: initialData.address || '',
                subject: initialData.subject || '',
                status: initialData.status || 'pending',
                accountHolderName: initialData.accountHolderName || '',
                bankName: initialData.bankName || '',
                ifscCode: initialData.ifscCode || '',
                accountNumber: initialData.accountNumber || '',
                aadharCard: initialData.aadharCard || '',
                panCard: initialData.panCard || '',
            });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [mode, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const fd = new FormData();
            // Append non-empty text fields
            Object.entries(form).forEach(([key, val]) => {
                if (val) fd.append(key, val);
            });
            if (imageFile) fd.append('image', imageFile);
            if (cvFile) fd.append('cvFile', cvFile);

            await onSave(fd, mode === 'edit' ? initialData._id : null);
            onClose();
        } catch (err) {
            // onSave handles toast
        } finally {
            setSaving(false);
        }
    };

    const subjectOptions = SUBJECTS.filter(s => s !== 'All').map(s => ({ value: s, label: s }));
    const statusOptions = [
        { value: 'pending', label: '⏳ Pending' },
        { value: 'approved', label: '✅ Approved' },
        { value: 'rejected', label: '❌ Rejected' },
    ];

    const title = mode === 'add' ? 'Add New Teacher' : `Edit Teacher — ${initialData?.name}`;

    return (
        <div className='fixed inset-0 z-50 backdrop-blur-sm bg-black/30 flex justify-center items-center p-4'>
            <div className='bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto'>
                {/* Header */}
                <div className='sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b'>
                    <h2 className='text-xl font-bold text-gray-800 flex items-center gap-2'>
                        {mode === 'add' ? <UserPlus className='w-5 h-5 text-green-600' /> : <Edit2 className='w-5 h-5 text-blue-600' />}
                        {title}
                    </h2>
                    <button onClick={onClose} className='text-gray-500 hover:text-gray-900 transition' aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className='p-6 space-y-6'>
                    {/* --- Account Info --- */}
                    <fieldset className='border border-gray-200 rounded-lg p-4'>
                        <legend className='text-sm font-bold text-gray-700 px-2 flex items-center gap-1'>
                            <User className='w-4 h-4 text-blue-500' /> Account Information
                        </legend>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-2'>
                            <InputField label="Full Name" icon={User} name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
                            <InputField label="Email" icon={Mail} type="email" name="email" value={form.email} onChange={handleChange} required placeholder="teacher@example.com" />
                            <div>
                                <label className='block text-xs font-semibold text-gray-600 mb-1'>
                                    Password {mode === 'add' && <span className='text-red-500'>*</span>}
                                    {mode === 'edit' && <span className='text-gray-400 font-normal'>(leave blank to keep current)</span>}
                                </label>
                                <div className='relative'>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name='password'
                                        value={form.password}
                                        onChange={handleChange}
                                        required={mode === 'add'}
                                        minLength={8}
                                        placeholder={mode === 'edit' ? '••••••••' : 'Min 8 characters'}
                                        className='w-full border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition'
                                    />
                                    <button type='button' onClick={() => setShowPassword(!showPassword)} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'>
                                        {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                                    </button>
                                </div>
                            </div>
                            <SelectField label="Status" icon={Shield} name="status" value={form.status} onChange={handleChange} options={statusOptions} />
                        </div>
                    </fieldset>

                    {/* --- Personal Info --- */}
                    <fieldset className='border border-gray-200 rounded-lg p-4'>
                        <legend className='text-sm font-bold text-gray-700 px-2 flex items-center gap-1'>
                            <Phone className='w-4 h-4 text-blue-500' /> Personal Details
                        </legend>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-2'>
                            <InputField label="Phone Number" icon={Phone} name="mobileNumber" value={form.mobileNumber} onChange={handleChange} placeholder="+61 400 000 000" />
                            <SelectField label="Subject" icon={BookOpen} name="subject" value={form.subject} onChange={handleChange} options={[{ value: '', label: '-- Select Subject --' }, ...subjectOptions]} />
                            <div className='md:col-span-2'>
                                <InputField label="Address" icon={MapPin} name="address" value={form.address} onChange={handleChange} placeholder="123 Main St, City" />
                            </div>
                        </div>
                    </fieldset>

                    {/* --- Banking --- */}
                    <fieldset className='border border-gray-200 rounded-lg p-4'>
                        <legend className='text-sm font-bold text-gray-700 px-2 flex items-center gap-1'>
                            <DollarSign className='w-4 h-4 text-blue-500' /> Banking Details
                        </legend>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-2'>
                            <InputField label="Account Holder Name" icon={User} name="accountHolderName" value={form.accountHolderName} onChange={handleChange} />
                            <InputField label="Bank Name" icon={CreditCard} name="bankName" value={form.bankName} onChange={handleChange} />
                            <InputField label="IFSC Code" icon={IdCard} name="ifscCode" value={form.ifscCode} onChange={handleChange} />
                            <InputField label="Account Number" icon={CreditCard} name="accountNumber" value={form.accountNumber} onChange={handleChange} />
                        </div>
                    </fieldset>

                    {/* --- Documents --- */}
                    <fieldset className='border border-gray-200 rounded-lg p-4'>
                        <legend className='text-sm font-bold text-gray-700 px-2 flex items-center gap-1'>
                            <FileText className='w-4 h-4 text-blue-500' /> Identification & Documents
                        </legend>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-2'>
                            <InputField label="Aadhar Card No." icon={IdCard} name="aadharCard" value={form.aadharCard} onChange={handleChange} />
                            <InputField label="PAN Card No." icon={IdCard} name="panCard" value={form.panCard} onChange={handleChange} />
                            <div>
                                <label className='block text-xs font-semibold text-gray-600 mb-1'>
                                    Profile Picture {mode === 'edit' && initialData?.image && <span className='text-gray-400 font-normal'>(current: {initialData.image})</span>}
                                </label>
                                <label className='flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition text-sm text-gray-500'>
                                    <Upload className='w-4 h-4' />
                                    {imageFile ? imageFile.name : 'Choose file...'}
                                    <input type='file' accept='image/*' className='hidden' onChange={(e) => setImageFile(e.target.files[0])} />
                                </label>
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-gray-600 mb-1'>
                                    CV File {mode === 'edit' && initialData?.cvFile && <span className='text-gray-400 font-normal'>(current: {initialData.cvFile})</span>}
                                </label>
                                <label className='flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition text-sm text-gray-500'>
                                    <Upload className='w-4 h-4' />
                                    {cvFile ? cvFile.name : 'Choose file...'}
                                    <input type='file' accept='.pdf,.doc,.docx' className='hidden' onChange={(e) => setCvFile(e.target.files[0])} />
                                </label>
                            </div>
                        </div>
                    </fieldset>

                    {/* --- Submit --- */}
                    <div className='flex items-center justify-end gap-3 pt-2'>
                        <button type='button' onClick={onClose} className='px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition'>
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={saving}
                            className='flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow'
                        >
                            {saving ? <RefreshCw className='w-4 h-4 animate-spin' /> : <Save className='w-4 h-4' />}
                            {mode === 'add' ? 'Create Teacher' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ======================== TABLE ROW ========================
const TeacherRow = ({ teacher, onTeacherClick, onDelete, onEdit, onViewTimetable, backendUrl }) => {
    const loadClass = teacher.subject ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    const getImage = (filename) => filename ? `${backendUrl}/images/${filename}` : 'https://placehold.co/40x40/cccccc/000000?text=👤';
    const profileImageUrl = getImage(teacher.image);

    return (
        <tr className="border-t hover:bg-yellow-50 transition duration-150 cursor-pointer" onClick={() => onTeacherClick(teacher._id)}>
            {/* Name with Profile Picture */}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <div className="flex items-center space-x-3">
                    <img src={profileImageUrl} alt={`${teacher.name} profile`} className="h-8 w-8 rounded-full object-cover border" />
                    <span className='text-blue-600 hover:text-blue-800 font-semibold'>{teacher.name || 'N/A'}</span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.email || 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div className='flex items-center text-xs'>
                    <Phone className='w-3 h-3 mr-1 text-blue-500' />
                    <span className='font-medium'>{teacher.mobileNumber || 'N/A'}</span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${loadClass}`}>
                    {teacher.subject || 'Unspecified'}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
                <StatusBadge status={teacher.status} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div className='flex items-center text-xs'>
                    <Clock className='w-3 h-3 mr-1' />
                    {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'N/A'}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
                    <a href={`mailto:${teacher.email}`} className="text-indigo-600 hover:text-indigo-900 transition" title="Email"><Mail className="w-5 h-5" /></a>
                    <button className="text-purple-600 hover:text-purple-900 transition" title="View Timetable" onClick={() => onViewTimetable(teacher._id, teacher.name)}>
                        <Calendar className="w-5 h-5" />
                    </button>
                    <button className="text-orange-600 hover:text-orange-900 transition" title="Edit" onClick={() => onEdit(teacher._id)}>
                        <Edit2 className="w-5 h-5" />
                    </button>
                    <button className="text-red-600 hover:text-red-900 transition" title="Delete" onClick={() => onDelete(teacher._id)}>
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

// ======================== MAIN COMPONENT ========================
export default function TeacherManagement() {
    const { backendUrl, adminToken } = useContext(AppContext);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [subjectFilter, setSubjectFilter] = useState('All');

    // Modal states
    const [formModal, setFormModal] = useState({ open: false, mode: 'add', data: null });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', confirmLabel: '', confirmColor: 'red', icon: null, onConfirm: null });
    const [timetable, setTimetable] = useState({ open: false, teacherId: null, teacherName: '' });

    // CSV Upload state
    const [csvUploading, setCsvUploading] = useState(false);
    const [csvResult, setCsvResult] = useState(null); // { message, details }

    const showConfirm = (opts) => setConfirmDialog({ ...opts, open: true });
    const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, open: false, onConfirm: null }));

    const authHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // ---- Data Fetching ----
    const fetchTeachers = async () => {
        if (!backendUrl) { setLoading(false); return; }
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/api/admin/teachers?_t=${Date.now()}`, authHeaders);
            if (response.data) setTeachers(response.data);
        } catch (error) {
            toast.error("Failed to fetch teacher list.");
            console.error('Error fetching teachers:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeacherDetails = async (id) => {
        if (!backendUrl) return;
        setSelectedTeacher(null);
        try {
            const response = await axios.get(`${backendUrl}/api/admin/teacher/${id}`, authHeaders);
            setSelectedTeacher(response.data);
        } catch (error) {
            toast.error("Failed to fetch teacher details.");
            console.error('Error:', error.response?.data || error.message);
        }
    };

    useEffect(() => {
        if (adminToken && backendUrl) fetchTeachers();
        else setLoading(false);
    }, [adminToken, backendUrl]);

    // ---- CRUD Handlers ----
    const handleDeleteTeacher = (teacherId) => {
        showConfirm({
            title: 'Delete Teacher',
            message: 'Are you sure you want to permanently delete this teacher? This action cannot be undone.',
            confirmLabel: 'Delete',
            confirmColor: 'red',
            icon: Trash2,
            onConfirm: async () => {
                closeConfirm();
                try {
                    await axios.delete(`${backendUrl}/api/admin/teacher/${teacherId}`, authHeaders);
                    toast.success('Teacher deleted successfully.');
                    setTeachers(prev => prev.filter(t => t._id !== teacherId));
                } catch (error) {
                    toast.error("Failed to delete teacher.");
                    console.error('Error:', error.response?.data || error.message);
                }
            },
        });
    };

    const handleSaveTeacher = async (formData, teacherId) => {
        try {
            if (teacherId) {
                // Update
                await axios.put(`${backendUrl}/api/admin/teacher/${teacherId}`, formData, {
                    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Teacher updated successfully!');
            } else {
                // Create
                await axios.post(`${backendUrl}/api/admin/teacher`, formData, {
                    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Teacher created successfully!');
            }
            fetchTeachers(); // Refresh the list
        } catch (error) {
            const msg = error.response?.data?.message || error.message || 'Operation failed.';
            toast.error(msg);
            throw error; // let the modal know
        }
    };

    const handleReplaceTeacher = (oldTeacherId, newTeacherId) => {
        showConfirm({
            title: 'Replace Teacher',
            message: 'Are you sure? All active classes & scheduled assessments will be reassigned to the selected teacher.',
            confirmLabel: 'Replace',
            confirmColor: 'orange',
            icon: Replace,
            onConfirm: async () => {
                closeConfirm();
                try {
                    const res = await axios.put(`${backendUrl}/api/admin/replace-teacher/${oldTeacherId}`, { newTeacherId }, authHeaders);
                    toast.success(res.data.message || 'Teacher replaced successfully.');
                    setSelectedTeacher(null);
                    fetchTeachers();
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to replace teacher.');
                    console.error('Error:', error.response?.data || error.message);
                }
            },
        });
    };

    const handleEditClick = async (teacherIdOrObj) => {
        // If we got a full teacher object (from details modal), use it; otherwise fetch
        let teacherData = typeof teacherIdOrObj === 'object' ? teacherIdOrObj : null;
        if (!teacherData) {
            try {
                const res = await axios.get(`${backendUrl}/api/admin/teacher/${teacherIdOrObj}`, authHeaders);
                teacherData = res.data;
            } catch (err) {
                toast.error('Failed to load teacher details for editing.');
                return;
            }
        }
        setFormModal({ open: true, mode: 'edit', data: teacherData });
    };

    // ---- Filtering ----
    const filteredTeachers = teachers.filter(teacher => {
        if (subjectFilter === 'All') return true;
        return teacher.subject && teacher.subject.toLowerCase() === subjectFilter.toLowerCase();
    });

    return (
        <>
            <div className="space-y-6">
                {/* --- Header with Add Button --- */}
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                    <h2 className="text-2xl font-bold text-gray-700 flex items-center">
                        <Briefcase className='w-6 h-6 mr-2 text-blue-500' /> Teacher Management ({teachers.length})
                    </h2>
                    <div className='flex items-center gap-2'>
                        {/* CSV Upload */}
                        <label
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition shadow-md cursor-pointer ${csvUploading
                                ? 'bg-gray-400 text-gray-200 cursor-wait'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                        >
                            {csvUploading ? <Loader2 className='w-4 h-4 animate-spin' /> : <FileSpreadsheet className='w-4 h-4' />}
                            {csvUploading ? 'Uploading...' : 'Upload Timetable CSV'}
                            <input
                                type='file'
                                accept='.csv'
                                className='hidden'
                                disabled={csvUploading}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    // Client-side validation
                                    if (!file.name.toLowerCase().endsWith('.csv')) {
                                        toast.error('Only .csv files are allowed.');
                                        e.target.value = '';
                                        return;
                                    }
                                    if (file.size > 2 * 1024 * 1024) {
                                        toast.error('File is too large. Maximum size is 2 MB.');
                                        e.target.value = '';
                                        return;
                                    }

                                    setCsvUploading(true);
                                    setCsvResult(null);
                                    try {
                                        const fd = new FormData();
                                        fd.append('csvFile', file);
                                        const res = await axios.post(`${backendUrl}/api/admin/upload-timetable`, fd, {
                                            headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'multipart/form-data' },
                                        });
                                        setCsvResult(res.data);
                                        toast.success(res.data.message || 'CSV uploaded successfully!');
                                    } catch (err) {
                                        // Multer errors come as plain text sometimes
                                        const msg = err.response?.data?.message || err.response?.data?.error || err.response?.data || 'CSV upload failed.';
                                        const errorStr = typeof msg === 'string' ? msg : 'CSV upload failed.';
                                        toast.error(errorStr);
                                        setCsvResult({ message: errorStr, details: { errors: [errorStr] } });
                                    } finally {
                                        setCsvUploading(false);
                                        e.target.value = ''; // Reset file input
                                    }
                                }}
                            />
                        </label>
                        <button
                            onClick={() => setFormModal({ open: true, mode: 'add', data: null })}
                            className='flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-semibold text-sm rounded-lg hover:bg-green-700 transition shadow-md'
                        >
                            <Plus className='w-4 h-4' /> Add Teacher
                        </button>
                    </div>
                </div>

                {/* --- Subject Filter Buttons --- */}
                <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-lg border">
                    <span className='text-sm font-semibold text-gray-600'>Filter by Subject:</span>
                    {SUBJECTS.map((subject) => (
                        <button
                            key={subject}
                            onClick={() => setSubjectFilter(subject)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition duration-150 ease-in-out ${subjectFilter === subject
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                                }`}
                        >
                            {subject}
                        </button>
                    ))}
                </div>

                {/* CSV Upload Result */}
                {csvResult && (
                    <div className={`p-3 rounded-lg border text-sm ${csvResult.details?.errors?.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                        <p className='font-semibold flex items-center gap-1'>
                            <CheckCircle className='w-4 h-4 text-green-600' /> {csvResult.message}
                        </p>
                        {csvResult.details?.errors?.length > 0 && (
                            <details className='mt-1'>
                                <summary className='text-xs text-yellow-700 cursor-pointer'>⚠️ {csvResult.details.errors.length} warning(s)</summary>
                                <ul className='mt-1 text-xs text-yellow-700 list-disc ml-4'>
                                    {csvResult.details.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                                    {csvResult.details.errors.length > 10 && <li>...and {csvResult.details.errors.length - 10} more</li>}
                                </ul>
                            </details>
                        )}
                        <button onClick={() => setCsvResult(null)} className='text-xs text-gray-500 hover:text-gray-700 mt-1'>Dismiss</button>
                    </div>
                )}

                {loading && <p className="text-center text-gray-500">Loading teacher data...</p>}

                {!loading && teachers.length === 0 && (
                    <div className='p-4 bg-red-100 border-l-4 border-red-500 text-red-700'>
                        <p className='font-bold flex items-center'><AlertCircle className='w-5 h-5 mr-2' /> Data Load Issue</p>
                        <p className='text-sm'>No teacher records were loaded. Check the browser console and network tab.</p>
                    </div>
                )}

                {/* --- Table --- */}
                <div className="overflow-x-auto border rounded-xl shadow-inner">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTeachers.length > 0 ? (
                                filteredTeachers.map((teacher) => (
                                    <TeacherRow
                                        key={teacher._id}
                                        teacher={teacher}
                                        onTeacherClick={(id) => fetchTeacherDetails(id)}
                                        onDelete={handleDeleteTeacher}
                                        onEdit={handleEditClick}
                                        onViewTimetable={(id, name) => setTimetable({ open: true, teacherId: id, teacherName: name })}
                                        backendUrl={backendUrl}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500 italic">
                                        {!loading && (subjectFilter === 'All' ? "No teacher records found." : `No teachers found for subject: ${subjectFilter}`)}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- Details Modal --- */}
            <TeacherDetailsModal
                teacher={selectedTeacher}
                onClose={() => setSelectedTeacher(null)}
                backendUrl={backendUrl}
                adminToken={adminToken}
                onEdit={handleEditClick}
                onReplace={handleReplaceTeacher}
                allTeachers={teachers}
                onViewTimetable={() => {
                    if (selectedTeacher) {
                        setTimetable({ open: true, teacherId: selectedTeacher._id, teacherName: selectedTeacher.name });
                        setSelectedTeacher(null);
                    }
                }}
            />

            {/* --- Add / Edit Form Modal --- */}
            {formModal.open && (
                <TeacherFormModal
                    mode={formModal.mode}
                    initialData={formModal.data}
                    onClose={() => setFormModal({ open: false, mode: 'add', data: null })}
                    onSave={handleSaveTeacher}
                    backendUrl={backendUrl}
                />
            )}

            {/* --- Confirm Dialog Modal --- */}
            <ConfirmModal
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmLabel={confirmDialog.confirmLabel}
                confirmColor={confirmDialog.confirmColor}
                icon={confirmDialog.icon}
                onConfirm={confirmDialog.onConfirm}
                onCancel={closeConfirm}
            />

            {/* --- Timetable Modal --- */}
            {timetable.open && (
                <TeacherTimetableModal
                    teacherId={timetable.teacherId}
                    teacherName={timetable.teacherName}
                    onClose={() => setTimetable({ open: false, teacherId: null, teacherName: '' })}
                />
            )}
        </>
    );
}