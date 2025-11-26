// frontend/src/components/AdminPanel/TeacherManagement.jsx

import React, { useState, useEffect, useContext } from 'react';
import { Briefcase, Mail, Trash2, Edit2, User, Phone, Clock, MapPin, DollarSign, CreditCard, IdCard, FileText, ArrowLeft, X, BookOpen, AlertCircle, CheckCircle } from 'lucide-react'; 
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AppContext } from '../../context/AppContext.jsx'; 

// --- Helper Components ---
// Section, Detail, and TeacherDetailsModal components remain the same for brevity
const Section = ({ title, icon: Icon, children, fullWidth = false }) => (
    <div className={`space-y-4 border p-4 rounded-lg shadow-sm ${fullWidth ? 'md:col-span-2' : ''}`}>
        <h3 className='text-lg font-semibold text-gray-700 flex items-center border-b pb-2'>
            <Icon className='w-5 h-5 mr-2 text-blue-500' /> {title}
        </h3>
        <div className='space-y-3'>
            {children}
        </div>
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

const TeacherDetailsModal = ({ teacher, onClose, backendUrl }) => {
    if (!teacher) return null;

    // Helper for displaying document links (uses /images/ path)
    const getFileUrl = (filename) => filename ? `${backendUrl}/images/${filename}` : null;
    const profileImageUrl = getFileUrl(teacher.image);
    const cvFileUrl = getFileUrl(teacher.cvFile);

    return (
        <div className='fixed inset-0 z-50 backdrop-blur-sm bg-black/30 flex justify-center items-center p-4'>
            <div className='bg-white p-6 sm:p-10 rounded-xl shadow-2xl text-slate-500 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative'>
                <h2 className='text-2xl font-bold text-gray-800 border-b pb-3 mb-6 flex items-center'>
                    <User className='w-6 h-6 mr-2 text-blue-500' /> {teacher.name}'s Full Profile
                </h2>

                <button 
                    type='button' 
                    onClick={onClose} 
                    className='absolute top-3 right-3 text-gray-500 hover:text-gray-900 transition duration-200'
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
                
                {/* Profile Image and Status */}
                <div className="flex items-center space-x-6 mb-8">
                    {/* Profile Image */}
                    <img 
                        src={profileImageUrl || 'https://placehold.co/100x100/cccccc/000000?text=👤'} 
                        alt={`${teacher.name} profile`} 
                        className="h-24 w-24 rounded-full object-cover border-4 border-blue-500 shadow-md"
                    />
                    
                    {/* Basic Info & Status */}
                    <div>
                        <p className='text-3xl font-extrabold text-gray-900'>{teacher.name}</p>
                        <p className='text-md text-gray-600 mb-2'>{teacher.email}</p>
                        
                    </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'>
                    
                    {/* --- Personal Information --- */}
                    <Section title="Personal Information" icon={User}>
                        <Detail icon={Mail} label="Email">{teacher.email}</Detail>
                        <Detail icon={Phone} label="Mobile Number">{teacher.mobileNumber || 'N/A'}</Detail>
                        <Detail icon={MapPin} label="Address">{teacher.address || 'N/A'}</Detail>
                        <Detail icon={BookOpen} label="Subjects">{teacher.subject || 'N/A'}</Detail>
                        <Detail icon={Clock} label="Joined">{teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'N/A'}</Detail>
                    </Section>
                    
                    {/* --- Banking Details --- */}
                    <Section title="Banking Details" icon={DollarSign}>
                        <Detail icon={User} label="Account Holder">{teacher.accountHolderName || 'N/A'}</Detail>
                        <Detail icon={CreditCard} label="Bank Name">{teacher.bankName || 'N/A'}</Detail>
                        <Detail icon={IdCard} label="IFSC Code">{teacher.ifscCode || 'N/A'}</Detail>
                        <Detail icon={CreditCard} label="Account Number">{teacher.accountNumber || 'N/A'}</Detail>
                    </Section>

                    {/* --- Documents --- */}
                    <Section title="Identification & Documents" icon={FileText} fullWidth>
                        <Detail icon={IdCard} label="Aadhar Card No.">{teacher.aadharCard || 'N/A'}</Detail>
                        <Detail icon={IdCard} label="PAN Card No.">{teacher.panCard || 'N/A'}</Detail>
                        <Detail icon={FileText} label="CV File">
                            {cvFileUrl ? (
                                <a href={cvFileUrl} target="_blank" rel="noopener noreferrer" className='text-blue-600 hover:text-blue-800 flex items-center text-sm'>
                                    View CV <FileText className='w-4 h-4 ml-1' />
                                </a>
                            ) : (
                                'N/A'
                            )}
                        </Detail>
                    </Section>

                </div>
                
            </div>
        </div>
    );
};


const TeacherRow = ({ teacher, onTeacherClick, onDelete, backendUrl }) => { 
    const loadClass = teacher.subject ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    
    // Helper function for the image path using /images/
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

            {/* Phone Number Section */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div className='flex items-center text-xs'>
                    <Phone className='w-3 h-3 mr-1 text-blue-500' /> 
                    <span className='font-medium'>{teacher.mobileNumber || 'N/A'}</span>
                </div>
            </td>
            
            {/* Subject */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${loadClass}`}>
                    {teacher.subject || 'Unspecified'}
                </span>
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div className='flex items-center text-xs'>
                    <Clock className='w-3 h-3 mr-1' /> 
                    {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'N/A'}
                </div>
            </td>
            
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {/* Prevent click on action buttons from opening modal */}
                <div className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
                    <a href={`mailto:${teacher.email}`} className="text-indigo-600 hover:text-indigo-900 transition" title="Email"><Mail className="w-5 h-5" /></a>
                    <button className="text-orange-600 hover:text-orange-900 transition" title="Edit"><Edit2 className="w-5 h-5" /></button>
                    {/* DELETE BUTTON IMPLEMENTATION */}
                    <button 
                        className="text-red-600 hover:text-red-900 transition" 
                        title="Delete"
                        onClick={() => onDelete(teacher._id)} // Call the passed delete handler
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default function TeacherManagement() {
    const { backendUrl, adminToken } = useContext(AppContext);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    // 🛑 NEW STATE FOR SUBJECT FILTER 🛑
    const [subjectFilter, setSubjectFilter] = useState('All'); 

    // 🛑 UPDATED SUBJECTS for all 7 filter options 🛑
    const SUBJECTS = [
        'All', 'Science', 'Maths', 'English', 
        'Science + Maths', 'Science + English', 'Maths + English', 
        'All Subjects'
    ];

    // 1. Fetch all teachers for the main table (FIX APPLIED HERE)
    const fetchTeachers = async () => {
        if (!backendUrl) {
             console.error('Backend URL is not defined in AppContext.');
             setLoading(false);
             toast.error('Configuration Error: Backend URL missing.');
             return;
        }
        
        setLoading(true);
        try {
            // ✅ FIX: Add a unique query parameter to bypass the browser cache
            const cacheBuster = `?_t=${new Date().getTime()}`; 
            
            const response = await axios.get(`${backendUrl}/api/admin/teachers${cacheBuster}`, { 
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });
            
            // Check if data is actually received before setting state
            if (response.data) {
                setTeachers(response.data);
                
            } else {
                 console.warn("Received a successful response, but the data object was empty.");
                
            }
            
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch teacher list. Check console for details.");
            console.error('Error fetching teachers:', error.response ? error.response.data : error.message);
            setLoading(false);
        }
    };

    // 2. Fetch full details for modal (UNCHANGED)
    const fetchTeacherDetails = async (id) => {
        if (!backendUrl) {
            toast.error('Configuration Error: Backend URL missing.');
            return;
        }

        setSelectedTeacher(null); 
        try {
            const response = await axios.get(`${backendUrl}/api/admin/teacher/${id}`, {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });
            setSelectedTeacher(response.data); 
        } catch (error) {
            toast.error("Failed to fetch teacher details.");
            console.error('Error fetching teacher details:', error.response ? error.response.data : error.message);
        }
    };

    // Handle Teacher Deletion (UNCHANGED)
    const handleDeleteTeacher = async (teacherId) => {
        if (!window.confirm("Are you sure you want to permanently delete this teacher? This action cannot be undone.")) {
            return;
        }

        try {
            // API call to the new DELETE route
            await axios.delete(`${backendUrl}/api/admin/teacher/${teacherId}`, {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            toast.success(`Teacher deleted successfully.`);
            
            // Update the state locally to remove the teacher without a full reload
            setTeachers(prevTeachers => 
                prevTeachers.filter(teacher => teacher._id !== teacherId)
            );

        } catch (error) {
            toast.error("Failed to delete teacher. Check console.");
            console.error('Error deleting teacher:', error.response ? error.response.data : error.message);
        }
    };

    useEffect(() => {
        if (adminToken && backendUrl) {
            fetchTeachers();
        } else if (!adminToken && !loading) {
            setLoading(false);
        }
    }, [adminToken, backendUrl]); 

    const handleTeacherClick = (teacherId) => {
        fetchTeacherDetails(teacherId);
    };

    const handleCloseModal = () => {
        setSelectedTeacher(null);
    };

    // 🛑 UPDATED LOGIC: Filter the teachers list based on the selected subject (exact match) 🛑
    const filteredTeachers = teachers.filter(teacher => {
        if (subjectFilter === 'All') {
            return true;
        }
        // Filter for exact match of the saved subject string
        return teacher.subject && teacher.subject.toLowerCase() === subjectFilter.toLowerCase();
    });

    return (
        <>
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-700 flex items-center">
                    <Briefcase className='w-6 h-6 mr-2 text-blue-500' /> Teacher Management ({teachers.length})
                </h2>

                {/* --- Subject Filter Buttons --- */}
                <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-lg border">
                    <span className='text-sm font-semibold text-gray-600'>Filter by Subject:</span>
                    {SUBJECTS.map((subject) => (
                        <button
                            key={subject}
                            onClick={() => setSubjectFilter(subject)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition duration-150 ease-in-out ${
                                subjectFilter === subject
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                            }`}
                        >
                            {subject}
                        </button>
                    ))}
                </div>
                {/* --- End Filter Buttons --- */}
                
                {loading && <p className="text-center text-gray-500">Loading teacher data...</p>}
                
                {!loading && teachers.length === 0 && (
                     <div className='p-4 bg-red-100 border-l-4 border-red-500 text-red-700'>
                          <p className='font-bold flex items-center'><AlertCircle className='w-5 h-5 mr-2' /> Data Load Issue</p>
                          <p className='text-sm'>No teacher records were loaded. This could mean no teachers exist, or there was a server/token error. Check the browser console and network tab.</p>
                     </div>
                )}


                <div className="overflow-x-auto border rounded-xl shadow-inner">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name (Click for Details)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th> 
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th> 
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
                                        onTeacherClick={handleTeacherClick}
                                        onDelete={handleDeleteTeacher} 
                                        backendUrl={backendUrl}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500 italic">
                                        {!loading && (subjectFilter === 'All' ? "No teacher records found." : `No teachers found for subject: ${subjectFilter}`)}
                                    </td> 
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Teacher Details Modal */}
            <TeacherDetailsModal 
                teacher={selectedTeacher} 
                onClose={handleCloseModal} 
                backendUrl={backendUrl}
            />
        </>
    );
}