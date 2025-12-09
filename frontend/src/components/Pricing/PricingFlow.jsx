// frontend/src/components/Pricing/PricingFlow.jsx

import React, { useState, useEffect, useContext } from 'react';
import { X, ArrowLeft, Loader, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext.jsx';
import axios from 'axios';
// Import Framer Motion
import { motion, AnimatePresence } from 'framer-motion';

// Component for collecting the contact number (NEW STEP)
const StepContact = ({ onSelect, contactNumber, setContactNumber, isParent }) => (
    <>
        <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                Almost done! What is your best contact number?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
                This will be used to send you a confirmation of your learning program.
            </p>
        </div>
        <div className="max-w-xs mx-auto">
            <label htmlFor="contactNumber" className="text-xs font-medium text-gray-700 mb-1 block">
                {isParent ? "Parent/Guardian Contact Number" : "Your Contact Number"}
            </label>
            <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="tel"
                    id="contactNumber"
                    placeholder="e.g., +61 412 345 678"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full p-2 pl-9 border-2 border-gray-300 rounded-lg focus:border-orange-500 outline-none transition text-sm"
                />
            </div>
            <button
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition text-sm sm:text-base"
                onClick={() => onSelect(contactNumber)}
                disabled={!contactNumber || contactNumber.length < 8}
            >
                Continue
            </button>
        </div>
    </>
);


// --- NEW STEP: Are you a Parent/Guardian? ---
const StepIsParent = ({ onSelect }) => (
    <>
        <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Are you the Parent/Guardian?</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
                This helps us pre-fill the correct details during enrollment.
            </p>
        </div>
        <div className="space-y-3 max-w-xs mx-auto">
            <button
                className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 transition rounded-xl text-sm sm:text-base font-medium text-gray-700 shadow-sm"
                onClick={() => onSelect(true)} // true for parent/guardian
            >
                Yes, I am the parent/guardian
            </button>
            <button
                className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 transition rounded-xl text-sm sm:text-base font-medium text-gray-700 shadow-sm"
                onClick={() => onSelect(false)} // false for student
            >
                No, I am the student
            </button>
        </div>
    </>
);

// --- StepRole: NOT USED IN NEW FLOW (retained but StepIsParent is used) ---
const StepRole = ({ onSelect }) => (
    <>
        <div className="text-center mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Are you the Student or the Parent/Guardian?</h2>
        </div>
        <div className="space-y-3 max-w-sm mx-auto">
            <button
                className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 transition rounded-xl text-sm sm:text-base font-medium text-gray-700"
                onClick={() => onSelect('parent')}
            >
                I am the parent/guardian
            </button>
            <button
                className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 transition rounded-xl text-sm sm:text-base font-medium text-gray-700"
                onClick={() => onSelect('student')}
            >
                I am the student
            </button>
        </div>
    </>
);

// --- StepYear: Updated to use initialClassRange ---
const StepYear = ({ onSelect, initialClassRange }) => {
    let years = [];
    if (initialClassRange === '2-6') {
        // Includes 2-6
        years = [2, 3, 4, 5, 6];
    } else if (initialClassRange === '7-9') {
        years = [7, 8, 9];
    } else if (initialClassRange === '10-12') {
        years = [10, 11, 12];
    } else {
        // Fallback or full range if initialClassRange is missing
        years = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }

    return (
        <>
            <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Which school Year are you currently in?</h2>
            </div>
            {/* Responsive grid for year buttons */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-xl mx-auto">
                {years.map(year => (
                    <button
                        key={year}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-white border-2 border-gray-200 text-gray-800 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition font-bold text-base sm:text-lg"
                        onClick={() => onSelect(year)}
                    >
                        {year}
                    </button>
                ))}
            </div>
        </>
    );
};

// --- StepSubject: Updated to include 'All' option ---
const StepSubject = ({ onSelect, year }) => (
    <>
        <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Which Year {year} subject would you like help with?</h2>
        </div>
        <div className="space-y-3 max-w-xs mx-auto">
            {['All', 'Mathematics', 'Science', 'English'].map(subject => (
                <button
                    key={subject}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 transition rounded-xl text-sm sm:text-base font-medium text-gray-700"
                    onClick={() => onSelect(subject)}
                >
                    {subject}
                </button>
            ))}
        </div>
    </>
);

// --- StepNeeds: EMOJI UPDATE HERE ---
const StepNeeds = ({ onSelect, subject }) => (
    <>
        <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">What best describes your {subject} learning needs?</h2>
        </div>
        {/* Responsive Grid: 1 column on mobile, 2 on tablet, 4 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
                {
                    title: "I feel I'm falling behind",
                    desc: "I'm struggling with comprehension and could use some help with the fundamentals.",
                    emoji: "🥺" // Real emoji
                },
                {
                    title: "Motivation to improve",
                    desc: "I want to keep on track as I feel I'm just cruising along and not very interested.",
                    emoji: "😁" // Real emoji
                },
                {
                    title: "I'm ready to extend my learning",
                    desc: "I need to be further challenged to gain an advantage.",
                    emoji: "🤩" // Real emoji
                },
                {
                    title: "I have individual needs",
                    desc: "The classroom can't fully support my learning needs.",
                    emoji: "😅" // Real emoji
                }
            ].map((item, index) => (
                <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition cursor-pointer shadow-sm hover:shadow-md group"
                    onClick={() => onSelect(item.title)}
                >
                    <div className="flex justify-center mb-2">
                        {/* Use real emoji directly in the span */}
                        <span className="text-3xl w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                            {item.emoji}
                        </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-blue-800 mb-1 group-hover:text-orange-600 transition">{item.title}</h3>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
            ))}
        </div>
        <div className="text-center pt-3 sm:pt-4">
            <p className="text-xs text-gray-500 hover:text-orange-500 cursor-pointer">Not sure? Skip ahead</p>
        </div>
    </>
);

// --- StepState: No changes required ---
const StepState = ({ onSelect }) => {
    const states = [
        'New South Wales', 'Victoria', 'Queensland', 'Western Australia',
        'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'
    ];
    return (
        <>
            <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Which state are you in?</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">We develop programs based on the Australian National Curriculum and take into account state variations.</p>
            </div>
            {/* Reduced max-height on mobile for smaller screens */}
            <div className="space-y-1 max-w-xs mx-auto overflow-y-auto max-h-48 sm:max-h-56">
                {states.map(state => (
                    <button
                        key={state}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 transition rounded-xl text-sm sm:text-base font-medium text-gray-700"
                        onClick={() => onSelect(state)}
                    >
                        {state}
                    </button>
                ))}
            </div>
        </>
    );
};

// --- StepName: No changes required (except for data handling below) ---
const StepName = ({ onSelect, name, setName, isClerkUser, clerkName }) => (
    <>
        <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">To finalise your learning program, what is your name?</h2>
        </div>
        <div className="max-w-xs mx-auto">
            <label className="text-xs font-medium text-gray-700 mb-1 block">Your name</label>
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="First name"
                    value={name.firstName || (isClerkUser ? clerkName.firstName : '')}
                    onChange={(e) => setName({ ...name, firstName: e.target.value })}
                    className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 outline-none transition text-sm"
                />
                <input
                    type="text"
                    placeholder="Last name"
                    value={name.lastName || (isClerkUser ? clerkName.lastName : '')}
                    onChange={(e) => setName({ ...name, lastName: e.target.value })}
                    className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 outline-none transition text-sm"
                />
            </div>
            <button
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition text-sm sm:text-base"
                onClick={() => onSelect(name)}
                disabled={!name.firstName || !name.lastName}
            >
                Continue
            </button>
        </div>
    </>
);

// --- StepEmail: No changes required (except for data handling below) ---
const StepEmail = ({ onSelect, email, setEmail, isClerkUser, clerkEmail }) => (
    <>
        <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Where can we send your quote and learning program?</h2>
        </div>
        <div className="max-w-xs mx-auto">
            <label className="text-xs font-medium text-gray-700 mb-1 block">Your email address</label>
            <input
                type="email"
                placeholder="youremail@example.com"
                value={email || (isClerkUser ? clerkEmail : '')}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={isClerkUser}
                className={`w-full p-2 border-2 rounded-lg outline-none transition text-sm ${isClerkUser ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'border-gray-300 focus:border-orange-500'}`}
            />
            <p className="text-xs text-gray-500 mt-1">You consent to receive emails from us.</p>
            <button
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition text-sm sm:text-base"
                onClick={() => onSelect(email || (isClerkUser ? clerkEmail : ''))}
                disabled={!(email || clerkEmail)?.includes('@') || !(email || clerkEmail)?.includes('.')}
            >
                Continue
            </button>
        </div>
    </>
);


const StepLoading = ({ onRedirect, finalData, backendUrl }) => {
    const [status, setStatus] = useState('Saving data...');

    useEffect(() => {
        const sendDataToBackend = async () => {
            // If this flow is not meant to create a free-assessment enquiry, skip submitting
            if (!finalData?.isFreeAssessment) {
                // Add client-side logging for easier debugging in future
                console.log('[StepLoading] Skipping assessment POST — not a free assessment', finalData);
                onRedirect();
                return;
            }

            const finalRole = finalData.isParent ? 'parent' : 'student';

            const dataToSave = {
                // ...existing fields
                classRange: finalData.initialClassRange,
                role: finalRole,
                year: finalData.year,
                subject: finalData.subject,
                needs: finalData.needs,
                state: finalData.state,
                contactNumber: finalData.contactNumber,

                studentFirstName: finalData.isParent ? 'N/A' : finalData.name.firstName,
                studentLastName: finalData.isParent ? 'N/A' : finalData.name.lastName,
                studentEmail: finalData.isParent ? 'N/A' : finalData.email,
                parentFirstName: finalData.isParent ? finalData.name.firstName : 'N/A',
                parentLastName: finalData.isParent ? finalData.name.lastName : 'N/A',
                parentEmail: finalData.isParent ? finalData.email : 'N/A',
                class: finalData.year,

                // Mark origin explicitly so backend/admin can distinguish records
                origin: finalData.origin || 'pricing_flow',
                // keep explicit flag but only when appropriate (we already gated above)
                isFreeAssessment: true,
            };

            setStatus('Submitting free assessment enquiry...');
            try {
                const response = await axios.post(`${backendUrl}/api/assessments/submit`, dataToSave);

                if (response.status === 201) {
                    setStatus('Enquiry saved! Preparing quote...');
                    setTimeout(() => {
                        onRedirect();
                    }, 1200);
                } else {
                    throw new Error('Database save failed.');
                }
            } catch (err) {
                console.error('Data submission error:', err);
                setStatus('Error saving data. Redirecting anyway...');
                setTimeout(() => {
                    onRedirect();
                }, 1800);
            }
        };

        sendDataToBackend();
    }, [onRedirect, finalData, backendUrl]);


    return (
        <div className="flex flex-col items-center justify-center h-56">
            <Loader className="w-8 h-8 text-orange-500 animate-spin mb-4" />
            <p className="text-sm sm:text-base font-semibold text-gray-700 text-center">{status}</p>
        </div>
    );
};


// --- Main Pricing Flow Component ---

// Updated prop to accept initialClassFlowData instead of just initialClassRange
const PricingFlow = ({ isOpen, onClose, initialClassFlowData }) => {
// ... (rest of the PricingFlow component remains the same)
// ... (omitted for brevity, only StepLoading was modified for clarity)
// ...
    const { user, backendUrl } = useContext(AppContext);
    const isClerkUser = !!user;

    // Destructure initialClassRange and basePrice from the new prop
    const initialClassRange = initialClassFlowData?.initialClassRange;
    const basePrice = initialClassFlowData?.basePrice;

    const clerkFirstName = user?.firstName || user?.fullName?.split(' ')?.[0] || '';
    const clerkLastName = user?.lastName || user?.fullName?.split(' ')?.[1] || '';
    const clerkEmail = user?.primaryEmailAddress?.emailAddress || '';

    // Change initial step from 'role' to 'year' since initialClassRange is already set
    const [step, setStep] = useState('year');
    const [history, setHistory] = useState(['year']);
    const [data, setData] = useState({});
    const navigate = useNavigate();

    const [nameInput, setNameInput] = useState({ firstName: clerkFirstName, lastName: clerkLastName });
    const [emailInput, setEmailInput] = useState(clerkEmail);
    const [contactInput, setContactInput] = useState('');

    // Framer Motion variants for the modal and step content
    const modalVariants = {
        hidden: { opacity: 0, scale: 0.8, y: '100vh' },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
        exit: { opacity: 0, scale: 0.8, y: '100vh' }
    };

    const stepVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            transition: { duration: 0.3 }
        }),
        center: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.3 }
        },
        exit: (direction) => ({
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            transition: { duration: 0.3 }
        })
    };
    
    // Custom state to track the direction of navigation for Framer Motion
    const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

    useEffect(() => {
        if (isOpen && initialClassRange && basePrice) {
            setStep('year'); // Start at 'year' since the class range is already set
            setData({
                initialClassRange: initialClassRange,
                basePrice: basePrice, // NEW: Store the base price here
                isParent: null,
                name: { firstName: clerkFirstName, lastName: clerkLastName },
                email: clerkEmail,
                contactNumber: ''
            });
            setHistory(['year']);
            setNameInput({ firstName: clerkFirstName, lastName: clerkLastName });
            setEmailInput(clerkEmail);
            setContactInput('');
            setDirection(1); // Reset direction
        }
    }, [isOpen, initialClassRange, basePrice, clerkFirstName, clerkLastName, clerkEmail]);

    const handleNext = (newStep, key, value) => {
        setData(prev => ({ ...prev, [key]: value }));
        setHistory(prev => [...prev, newStep]);
        setStep(newStep);
        setDirection(1); // Moving forward
    };

    const handleBack = () => {
        if (history.length > 1) {
            const newHistory = history.slice(0, -1);
            setHistory(newHistory);
            setStep(newHistory[newHistory.length - 1]);
            setDirection(-1); // Moving backward
        }
    };

    const handleFinalRedirect = () => {
        const finalData = {
            ...data,
            name: nameInput,
            email: emailInput,
            contactNumber: contactInput,
        };

        // Pass the final data, including initialClassRange and basePrice, to Booking.jsx
        navigate('/booking', { state: { quizData: finalData } });
        onClose();
    };

    const renderStep = () => {
        const { initialClassRange, year, subject, isParent } = data;

        switch (step) {
            case 'year':
                // Flow: year -> isParent (NEW STEP)
                return <StepYear key="year" onSelect={(y) => handleNext('isParent', 'year', y)} initialClassRange={initialClassRange} />;

            case 'isParent':
                // Flow: isParent -> subject
                return <StepIsParent key="isParent" onSelect={(ip) => handleNext('subject', 'isParent', ip)} />;

            case 'subject':
                // Flow: subject -> needs
                return <StepSubject key="subject" onSelect={(s) => handleNext('needs', 'subject', s)} year={year} />;

            case 'needs':
                // Flow: needs -> state
                return <StepNeeds key="needs" onSelect={(n) => handleNext('state', 'needs', n)} subject={subject || 'Primary'} />;

            case 'state':
                // Flow: state -> name
                return <StepState key="state" onSelect={(s) => handleNext('name', 'state', s)} />;

            case 'name':
                // Flow: name -> email
                return <StepName
                    key="name"
                    onSelect={(n) => handleNext('email', 'name', n)}
                    name={nameInput}
                    setName={setNameInput}
                    isClerkUser={isClerkUser}
                    clerkName={{ firstName: clerkFirstName, lastName: clerkLastName }}
                />;

            case 'email':
                // Flow: email -> contact
                return <StepEmail
                    key="email"
                    onSelect={(e) => handleNext('contact', 'email', e)}
                    email={emailInput}
                    setEmail={setEmailInput}
                    isClerkUser={isClerkUser}
                    clerkEmail={clerkEmail}
                />;

            case 'contact':
                // Flow: contact -> loading (new step)
                return <StepContact
                    key="contact"
                    onSelect={(c) => handleNext('loading', 'contactNumber', c)}
                    contactNumber={contactInput}
                    setContactNumber={setContactInput}
                    isParent={isParent}
                />;


            case 'loading':
                // Flow: loading -> final redirect
                // The loading step should not animate in/out like the others, so we don't include a key here for AnimatePresence
                return <StepLoading key="loading" onRedirect={handleFinalRedirect} finalData={data} backendUrl={backendUrl} />;

            case 'role': // Retain old 'role' flow logic if needed, but it's now bypassed
                return <StepRole key="role" onSelect={(r) => handleNext('year', 'role', r)} onBack={onClose} />;

            default:
                return null;
        }
    };

    // Render nothing if the modal is not open
    if (!isOpen) return null;

    return (
        <motion.div
            className="fixed inset-0 z-[100] bg-gray-900/70 flex items-center justify-center backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Modal Content container - max-w-xl applied for horizontally larger size */}
            <motion.div
                className="bg-white rounded-3xl shadow-2xl border-2 border-orange-500 w-full max-w-xl mx-auto overflow-hidden max-h-[90vh] overflow-y-auto"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <div className="relative p-4 md:p-6">
                    {/* Padding remains small: p-4 md:p-6 */}

                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={handleBack}
                            className={`p-1 rounded-full hover:bg-gray-100 transition text-gray-700 ${history.length > 1 && step !== 'loading' ? '' : 'invisible'}`}
                            aria-label="Back"
                            disabled={step === 'loading'}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-grow text-center">
                            {/* Simple Progress Indicator */}
                            {step !== 'loading' && (
                                <div className="text-xs font-medium text-gray-500">
                                    Step {history.length}/{8}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-red-50 hover:text-red-600 transition text-gray-700"
                            aria-label="Close"
                            disabled={step === 'loading'}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <AnimatePresence initial={false} mode="wait" custom={direction}>
                        <motion.div
                            key={step} // Use step as key for AnimatePresence
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="pb-4"
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PricingFlow;