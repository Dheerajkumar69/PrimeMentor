// frontend/src/components/Booking/AssessmentDetailModal.jsx

import React from 'react';
import { 
    X, User, Phone, Clock, Tag, Zap, BookOpen, Mail,
} from 'lucide-react';

const AssessmentDetailModal = ({ isOpen, onClose, booking }) => {
    if (!isOpen || !booking) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-AU', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'New':
                return 'bg-red-600 text-white ring-2 ring-red-400';
            case 'Scheduled':
                return 'bg-yellow-400 text-gray-900 ring-2 ring-yellow-600';
            case 'Contacted':
                return 'bg-blue-600 text-white ring-2 ring-blue-400';
            case 'Completed':
                return 'bg-green-600 text-white ring-2 ring-green-400';
            default:
                return 'bg-gray-600 text-white ring-2 ring-gray-400';
        }
    };

    // Helper component for primary data points (Subject, Year Level, Submitted)
    const PrimaryInfoItem = ({ icon: Icon, title, value }) => (
        <div className="flex flex-col space-y-1 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm min-h-[90px] justify-center">
            <h4 className="flex items-center text-xs font-medium text-gray-500">
                <Icon className="w-4 h-4 mr-1 text-orange-500" /> {title}
            </h4>
            <p className="text-sm font-semibold text-gray-900 break-words leading-tight">
                {value}
            </p>
        </div>
    );

    // 🛑 REFINED CONTACT ITEM COMPONENT 🛑
    const ContactItem = ({ icon: Icon, title, value, type }) => {
        
        const isActionable = type === 'email' || type === 'tel';

        return (
            // Ensured padding/border on ContactItem is consistent and clean
            <div className="flex flex-col space-y-1 p-3 border border-gray-200 rounded-xl bg-white shadow-sm transition-shadow duration-200">
                <h4 className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                    <Icon className="w-4 h-4 mr-2 text-indigo-500" /> {title}
                </h4>
                <div className='pl-6 text-sm'>
                    <p className="text-gray-900 font-medium">
                        {value}
                    </p>
                    {/* 🛑 FIX APPLIED HERE: Only render the link if the type is actionable (email or tel) 🛑 */}
                    {value && isActionable && (
                        <a 
                            href={type === 'email' ? `mailto:${value}` : `tel:${value}`} 
                            className="text-xs text-blue-500 hover:underline hover:text-blue-700 transition-colors"
                        >
                            {type === 'email' ? 'Send Email' : 'Call Now'}
                        </a>
                    )}
                </div>
            </div>
        );
    };

    return (
        // Backdrop container
        <div className="fixed inset-0 z-50 h-full w-full backdrop-blur-md bg-black/70 flex items-center justify-center p-4">
            
            {/* Modal Container */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 relative transform transition-all duration-300 scale-100 opacity-100 max-h-[90vh] overflow-y-auto border-t-4 border-orange-600 animate-in fade-in zoom-in-50">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition p-2 rounded-full hover:bg-gray-100 bg-white shadow-lg z-20 ring-1 ring-gray-300"
                    aria-label="Close details"
                >
                    <X className="w-6 h-6" />
                </button>
                
                {/* Header Section */}
                <header className="text-center mb-6 border-b pb-4">
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center justify-center">
                        <Zap className='w-7 h-7 mr-3 text-orange-600' />
                        Assessment Request Overview
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Details for <span className='font-bold text-indigo-700'>{booking.studentFirstName} {booking.studentLastName}</span>
                    </p>
                </header>

                {/* PRIMARY DATA SECTION (Status, Date, Subject, Year) */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Column 1: Status & Subject */}
                    <div className="space-y-4">
                        {/* Status (Top Left) */}
                        <div className='p-3 rounded-xl bg-gray-50 border border-gray-200 shadow-sm'>
                            <span className="text-xs font-medium text-gray-500">Status</span>
                            <div className='mt-1'>
                                <span className={`px-3 py-1 text-sm font-extrabold rounded-full ${getStatusStyle(booking.status)} shadow-md`}>
                                    {booking.status}
                                </span>
                            </div>
                        </div>

                        {/* Subject of Interest */}
                        <PrimaryInfoItem 
                            icon={BookOpen} 
                            title="Subject Interest" 
                            value={booking.subject} 
                        />
                    </div>
                    
                    {/* Column 2: Submitted Date & Year Level */}
                    <div className="space-y-4">
                        {/* Submitted Date (Top Right) */}
                        <div className='p-3 rounded-xl bg-gray-50 border border-gray-200 shadow-sm'>
                            <span className="text-xs font-medium text-gray-500">Submitted</span>
                            <p className="flex items-center text-sm font-semibold text-gray-900 mt-1">
                                <Clock className="w-4 h-4 mr-1 text-orange-500" />
                                {formatDate(booking.createdAt)}
                            </p>
                        </div>
                        
                        {/* Year Level */}
                        <PrimaryInfoItem 
                            icon={User} 
                            title="Student Year Level" 
                            value={`Year ${booking.class}`} 
                        />
                    </div>
                </div>

                {/* CONTACT BLOCKS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm border-t "> 
                    
                    {/* Student Contact Block */}
                    <div className="p-4 bg-indigo-50/10 rounded-xl">
                        <h3 className="font-bold text-base text-indigo-800 flex items-center mb-4 pb-2 border-b border-indigo-200">
                            <User className="w-5 h-5 mr-2" /> Student Contact
                        </h3>
                        <div className='space-y-4'>
                            <ContactItem 
                                icon={User} 
                                title="Student Name" 
                                value={`${booking.studentFirstName} ${booking.studentLastName}`}
                                // 🛑 REMOVED type="tel" 🛑
                            />
                            <ContactItem 
                                icon={Mail} 
                                title="Student Email" 
                                value={booking.studentEmail} 
                                type="email"
                            />
                        </div>
                    </div>

                    {/* Parent Contact Block */}
                    <div className="p-4 bg-orange-50/10 rounded-xl">
                        <h3 className="font-bold text-base text-orange-800 flex items-center mb-4 pb-2 border-b border-orange-200">
                            <Phone className="w-5 h-5 mr-2" /> Parent Contact
                        </h3>
                        <div className='space-y-4'>
                            <ContactItem 
                                icon={User} 
                                title="Parent Name" 
                                value={`${booking.parentFirstName} ${booking.parentLastName}`}
                                // 🛑 REMOVED type="tel" 🛑
                            />
                            <ContactItem 
                                icon={Mail} 
                                title="Parent Email" 
                                value={booking.parentEmail} 
                                type="email"
                            />
                            <ContactItem 
                                icon={Phone} 
                                title="Contact Number" 
                                value={booking.contactNumber} 
                                type="tel"
                            />
                        </div>
                    </div>
                </div>
                
                {/* Footer Actions */}
                <footer className="pt-2 border-t text-center">
                    <button
                        onClick={onClose}
                        className="px-10 py-3 bg-gray-800 text-white rounded-xl shadow-lg hover:bg-gray-900 transition transform hover:scale-[1.02] font-semibold text-lg"
                    >
                        Close Details
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AssessmentDetailModal;