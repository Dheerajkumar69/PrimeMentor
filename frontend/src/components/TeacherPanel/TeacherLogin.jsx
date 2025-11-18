// frontend/src/components/TeacherPanel/TeacherLogin.jsx

import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext.jsx'; // Corrected relative path
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast'; 
import { X, User, Lock, Mail, Upload, ArrowLeft, Phone, MapPin, DollarSign, CreditCard, IdCard, FileText, BookOpen } from 'lucide-react';

// Placeholder assets object
const assets = {
    upload_area: "https://placehold.co/80x80/EEEEEE/000?text=Upload",
};

// --- Step Components ---

// Step 1: Basic Info (UNCHANGED)
const Step1 = ({ formData, setFormData }) => (
    <div className='space-y-4'>
        <h2 className='text-lg font-medium text-neutral-700'>1. Account Details</h2>
        <div className='flex gap-3'>
            <input 
                className='border px-4 py-2 text-sm w-1/2 rounded-full outline-none focus:border-blue-500 transition' 
                onChange={e => setFormData(prev => ({...prev, firstName: e.target.value}))} 
                value={formData.firstName} 
                type="text" 
                placeholder='First Name' 
                required 
            />
            <input 
                className='border px-4 py-2 text-sm w-1/2 rounded-full outline-none focus:border-blue-500 transition' 
                onChange={e => setFormData(prev => ({...prev, lastName: e.target.value}))} 
                value={formData.lastName} 
                type="text" 
                placeholder='Last Name' 
                required 
            />
        </div>
        <div className='border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-blue-500 transition'>
            <Mail size={20} className='w-5 text-gray-400' />
            <input className='outline-none text-sm w-full' onChange={e => setFormData(prev => ({...prev, email: e.target.value}))} value={formData.email} type="email" placeholder='Email Id' required />
        </div>
        <div className='border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-blue-500 transition'>
            <Lock size={20} className='w-5 text-gray-400' />
            <input className='outline-none text-sm w-full' onChange={e => setFormData(prev => ({...prev, password: e.target.value}))} value={formData.password} type="password" placeholder='Create Password' required />
        </div>
    </div>
);

// Step 2: Profile Picture (UNCHANGED)
const Step2 = ({ formData, setFormData }) => (
    <div className='space-y-4 text-center'>
        <h2 className='text-lg font-medium text-neutral-700'>2. Profile Picture</h2>
        <div className='flex flex-col items-center gap-4 my-6'>
            <label htmlFor="image" className='cursor-pointer flex flex-col items-center gap-2'>
                <img 
                    className='w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-full border-4 border-gray-300 hover:border-blue-500 transition duration-200' 
                    src={formData.image ? URL.createObjectURL(formData.image) : assets.upload_area} 
                    alt="Profile Upload Area" 
                />
                <input 
                    onChange={e => setFormData(prev => ({...prev, image: e.target.files[0]}))} 
                    type="file" 
                    id='image' 
                    hidden
                    accept='image/*'
                />
            </label>
            <p className='text-sm text-center font-medium'>
                {formData.image ? 'Profile Photo Selected' : 'Click to Upload Profile Photo'}
            </p>
            <p className='text-xs text-gray-500'>(Required)</p>
        </div>
    </div>
);

// 🛑 Step 3: Personal Information (Address, Phone, Subject) - UPDATED 🛑
const Step3 = ({ formData, setFormData }) => {
    // All 7 subject combinations as specified
    const SUBJECT_OPTIONS = [
        'Science', 'Maths', 'English', 
        'Science + Maths', 'Science + English', 'Maths + English', 
        'All Subjects'
    ];
    
    return (
        <div className='space-y-4'>
            <h2 className='text-lg font-medium text-neutral-700'>3. Personal Information</h2>
            <div className='border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-blue-500 transition'>
                <MapPin size={20} className='w-5 text-gray-400' />
                <input 
                    className='outline-none text-sm w-full' 
                    onChange={e => setFormData(prev => ({...prev, address: e.target.value}))} 
                    value={formData.address} 
                    type="text" 
                    placeholder='Enter Address' 
                    required 
                />
            </div>
            <div className='border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-blue-500 transition'>
                <Phone size={20} className='w-5 text-gray-400' />
                <input 
                    className='outline-none text-sm w-full' 
                    onChange={e => setFormData(prev => ({...prev, mobileNumber: e.target.value}))} 
                    value={formData.mobileNumber} 
                    type="tel" 
                    placeholder='Enter Mobile Number' 
                    required 
                />
            </div>

            <div className='pt-2'>
                <h3 className='text-sm font-medium flex items-center text-neutral-700 mb-2'>
                    <BookOpen size={16} className='mr-2' /> Select Teaching Subject
                </h3>
                <div className='relative border rounded-full focus-within:border-blue-500 transition'>
                    <select
                        className='appearance-none bg-transparent w-full px-4 py-2 text-sm outline-none cursor-pointer'
                        value={formData.subject}
                        onChange={e => setFormData(prev => ({...prev, subject: e.target.value}))}
                        required
                    >
                        <option value="" disabled>Choose a subject or combination</option>
                        {SUBJECT_OPTIONS.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">▼</span>
                </div>
            </div>
        </div>
    );
};

// Step 4: Banking Details (UNCHANGED)
const Step4 = ({ formData, setFormData }) => (
    <div className='space-y-4'>
        <h2 className='text-lg font-medium text-neutral-700'>4. Banking Details</h2>
        <div className='border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-blue-500 transition'>
            <DollarSign size={20} className='w-5 text-gray-400' />
            <input 
                className='outline-none text-sm w-full' 
                onChange={e => setFormData(prev => ({...prev, accountHolderName: e.target.value}))} 
                value={formData.accountHolderName} 
                type="text" 
                placeholder='Enter Account Holder Name' 
                required 
            />
        </div>
        <div className='border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-blue-500 transition'>
            <CreditCard size={20} className='w-5 text-gray-400' />
            <input 
                className='outline-none text-sm w-full' 
                onChange={e => setFormData(prev => ({...prev, bankName: e.target.value}))} 
                value={formData.bankName} 
                type="text" 
                placeholder='Enter Bank Name' 
                required 
            />
        </div>
        <div className='border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-blue-500 transition'>
            <IdCard size={20} className='w-5 text-gray-400' />
            <input 
                className='outline-none text-sm w-full' 
                onChange={e => setFormData(prev => ({...prev, ifscCode: e.target.value}))} 
                value={formData.ifscCode} 
                type="text" 
                placeholder='Enter IFSC Code' 
                required 
            />
        </div>
        <div className='border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-blue-500 transition'>
            <CreditCard size={20} className='w-5 text-gray-400' />
            <input 
                className='outline-none text-sm w-full' 
                onChange={e => setFormData(prev => ({...prev, accountNumber: e.target.value}))} 
                value={formData.accountNumber} 
                type="text" 
                placeholder='Enter Account Number' 
                required 
            />
        </div>
    </div>
);

// Step 5: Documents (ID and CV Upload) (UNCHANGED)
const Step5 = ({ formData, setFormData }) => (
    <div className='space-y-4'>
        <h2 className='text-lg font-medium text-neutral-700'>5. Identification & Documents</h2>
        <div className='border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-blue-500 transition'>
            <IdCard size={20} className='w-5 text-gray-400' />
            <input 
                className='outline-none text-sm w-full' 
                onChange={e => setFormData(prev => ({...prev, aadharCard: e.target.value}))} 
                value={formData.aadharCard} 
                type="text" 
                placeholder='Enter Aadhar Card Number' 
                required 
            />
        </div>
        <div className='border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-blue-500 transition'>
            <IdCard size={20} className='w-5 text-gray-400' />
            <input 
                className='outline-none text-sm w-full' 
                onChange={e => setFormData(prev => ({...prev, panCard: e.target.value}))} 
                value={formData.panCard} 
                type="text" 
                placeholder='Enter Pan Card Number' 
                required 
            />
        </div>
        
        <div className='border p-4 rounded-xl'>
            <h3 className='text-sm font-medium flex items-center text-neutral-700 mb-2'>
                <FileText size={16} className='mr-2' /> Upload CV (PDF/DOC)
            </h3>
            <label htmlFor="cv_file" className='cursor-pointer flex items-center justify-between p-3 border-dashed border-2 rounded-lg hover:border-blue-500 transition'>
                <span className='text-xs text-gray-600 truncate'>
                    {formData.cvFile ? formData.cvFile.name : 'Click here to select file'}
                </span>
                <Upload size={18} className='text-blue-500 flex-shrink-0 ml-2' />
                <input 
                    onChange={e => setFormData(prev => ({...prev, cvFile: e.target.files[0]}))} 
                    type="file" 
                    id='cv_file' 
                    hidden
                    accept='.pdf,.doc,.docx'
                />
            </label>
            {formData.cvFile && <p className='text-xs text-green-600 mt-1'>File ready for upload.</p>}
        </div>
    </div>
);


// --- Main Component ---
const TeacherLogin = ({ setShowTeacherLogin }) => {
    const navigate = useNavigate();
    const { backendUrl, setTeacherToken, setTeacherData } = useContext(AppContext);

    const [state, setState] = useState('Login'); // 'Login' or 'Sign Up'
    const [step, setStep] = useState(1); // 1 to 5 for Sign Up steps
    const [loading, setLoading] = useState(false);
    
    // Consolidated form data state - UPDATED to use 'subject' (String) instead of 'subjects' (Array)
    const [formData, setFormData] = useState({
        // Step 1
        firstName: '', lastName: '', email: '', password: '',
        // Step 2
        image: null,
        // Step 3 - Changed to subject: ''
        address: '', mobileNumber: '', subject: '', 
        // Step 4
        accountHolderName: '', bankName: '', ifscCode: '', accountNumber: '',
        // Step 5
        aadharCard: '', panCard: '', cvFile: null,
    });

    // Validation updated for subject: must be a non-empty string
    const steps = [
        { component: Step1, validation: () => formData.firstName && formData.lastName && formData.email && formData.password },
        { component: Step2, validation: () => formData.image !== null },
        { component: Step3, validation: () => formData.address && formData.mobileNumber && formData.subject !== '' },
        { component: Step4, validation: () => formData.accountHolderName && formData.bankName && formData.ifscCode && formData.accountNumber },
        { component: Step5, validation: () => formData.aadharCard && formData.panCard && formData.cvFile !== null },
    ];
    
    // Function to render the current step component
    const renderStep = () => {
        const StepComponent = steps[step - 1].component;
        return <StepComponent formData={formData} setFormData={setFormData} />;
    };
    
    // Handles 'Next' button clicks in the Sign Up flow
    const handleNext = (e) => {
        e.preventDefault();
        const isValid = steps[step - 1].validation();
        if (isValid) {
            if (step < steps.length) {
                setStep(step + 1);
            } else {
                // If it's the last step, proceed to final submission
                onSubmitHandler(e);
            }
        } else {
            toast.error("Please fill in all required fields for this section.");
        }
    };

    // Handles form submission for both Login and final Sign Up
    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (state === "Login") {
                // Teacher Login API Call
                const { data } = await axios.post(`${backendUrl}/api/teacher/login`, { email: formData.email, password: formData.password });

                if (data.success) {
                    setTeacherData(data.teacher);
                    setTeacherToken(data.token);
                    localStorage.setItem('teacherToken', data.token);
                    setShowTeacherLogin(false);
                    toast.success("Login Successful!");
                    navigate('/teacher/dashboard');
                } else {
                    toast.error(data.message);
                }
            } else { // Final Sign Up Submission
                const formDataPayload = new FormData();
                
                // Append all fields to FormData
                formDataPayload.append('name', `${formData.firstName} ${formData.lastName}`); // Full Name
                formDataPayload.append('password', formData.password);
                formDataPayload.append('email', formData.email);
                
                // Personal Info
                formDataPayload.append('address', formData.address);
                formDataPayload.append('mobileNumber', formData.mobileNumber);
                // 🛑 UPDATED: Use the single 'subject' string from the dropdown 🛑
                formDataPayload.append('subject', formData.subject); 
                
                // Banking Details
                formDataPayload.append('accountHolderName', formData.accountHolderName);
                formDataPayload.append('bankName', formData.bankName);
                formDataPayload.append('ifscCode', formData.ifscCode);
                formDataPayload.append('accountNumber', formData.accountNumber);

                // Identification
                formDataPayload.append('aadharCard', formData.aadharCard);
                formDataPayload.append('panCard', formData.panCard);

                // Files
                if (formData.image) formDataPayload.append('image', formData.image);
                if (formData.cvFile) formDataPayload.append('cvFile', formData.cvFile);

                const { data } = await axios.post(`${backendUrl}/api/teacher/register`, formDataPayload);

                if (data.success) {
                    setTeacherData(data.teacher);
                    setTeacherToken(data.token);
                    localStorage.setItem('teacherToken', data.token);
                    setShowTeacherLogin(false);
                    toast.success("Account Created Successfully! Awaiting Admin Approval."); // Changed toast message
                    navigate('/teacher/dashboard');
                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "An unexpected error occurred. Check your network or server.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Effect to prevent scrolling the background when the modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const handleSwitchState = (newState) => {
        setState(newState);
        setStep(1); // Reset step when switching mode
        setFormData({ // Reset form data on switch - UPDATED subject field
            firstName: '', lastName: '', email: '', password: '', image: null,
            address: '', mobileNumber: '', subject: '', 
            accountHolderName: '', bankName: '', ifscCode: '', accountNumber: '',
            aadharCard: '', panCard: '', cvFile: null,
        });
    };

    return (
        <div className='fixed inset-0 z-50 backdrop-blur-sm bg-black/30 flex justify-center items-center p-4'>
            {/* Form Container: Submit handler depends on state and step */}
            <form onSubmit={state === 'Sign Up' ? handleNext : onSubmitHandler} className='relative bg-white p-6 sm:p-10 rounded-xl shadow-2xl text-slate-500 max-w-sm sm:max-w-md w-full'>
                
                <h1 className='text-center text-xl sm:text-2xl text-neutral-700 font-bold mb-2'>
                    {state === 'Login' ? 'Teacher Login' : `Teacher Sign Up (Step ${step}/${steps.length})`}
                </h1>
                <p className='text-sm text-center mb-6'>{state === 'Login' ? 'Welcome back! Please sign in to continue' : 'Join us! Tell us about yourself.'}</p>
                
                {/* 🛑 BACK BUTTON (Only for Sign Up steps > 1) 🛑 */}
                {state === 'Sign Up' && step > 1 && (
                    <button 
                        type='button' 
                        onClick={() => setStep(step - 1)}
                        disabled={loading}
                        className='absolute top-20 left-4 text-gray-500 hover:text-blue-600 transition disabled:opacity-50'
                    >
                        <ArrowLeft size={20} className='inline mr-1' /> Back
                    </button>
                )}

                {/* --- LOGIN FORM --- */}
                {state === 'Login' && (
                    <div className='space-y-4'>
                        <div className='border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-blue-500 transition'>
                            <Mail size={20} className='w-5 text-gray-400' />
                            <input className='outline-none text-sm w-full' onChange={e => setFormData(prev => ({...prev, email: e.target.value}))} value={formData.email} type="email" placeholder='Email Id' required />
                        </div>
                        <div className='border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-blue-500 transition'>
                            <Lock size={20} className='w-5 text-gray-400' />
                            <input className='outline-none text-sm w-full' onChange={e => setFormData(prev => ({...prev, password: e.target.value}))} value={formData.password} type="password" placeholder='Password' required />
                        </div>
                    </div>
                )}
                
                {/* --- SIGN UP FLOW (Multi-Step) --- */}
                {state === 'Sign Up' && renderStep()}

                {/* Submit Button with conditional text */}
                <button type={state === 'Sign Up' && step < steps.length ? 'button' : 'submit'} onClick={state === 'Sign Up' && step < steps.length ? handleNext : (e) => state === 'Sign Up' ? onSubmitHandler(e) : null} disabled={loading} className='bg-blue-600 w-full text-white py-2 rounded-full mt-6 hover:bg-blue-700 transition duration-200 text-sm sm:text-base disabled:opacity-50'>
                    {loading ? 'Processing...' : state === 'Login' ? 'Login' : step < steps.length ? 'Next' : 'Create Account'}
                </button>

                {/* State switching links */}
                {
                    state === 'Login'
                        ? <p className='mt-5 text-xs sm:text-sm text-center'>Don't have an account? <span className='text-blue-600 cursor-pointer font-medium hover:underline' onClick={() => handleSwitchState("Sign Up")}>Sign Up</span></p>
                        : <p className='mt-5 text-xs sm:text-sm text-center'>Already have an account? <span className='text-blue-600 cursor-pointer font-medium hover:underline' onClick={() => handleSwitchState("Login")}>Login</span></p>
                }

                {/* Close Button */}
                <button 
                    type='button' 
                    onClick={() => setShowTeacherLogin(false)} 
                    className='absolute top-3 right-3 text-gray-500 hover:text-gray-900 transition duration-200'
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
            </form>
        </div>
    );
};

export default TeacherLogin;