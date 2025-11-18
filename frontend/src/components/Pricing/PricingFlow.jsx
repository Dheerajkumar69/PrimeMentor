// frontend/src/components/Pricing/PricingFlow.jsx

import React, { useState, useEffect, useContext } from 'react';
import { X, ArrowLeft, Loader, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext.jsx';
import axios from 'axios';

// Component for collecting the contact number (NEW STEP)
const StepContact = ({ onSelect, contactNumber, setContactNumber, isParent }) => (
    <>
        <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Almost done! What is your best contact number?
            </h2>
            <p className="text-sm sm:text-base text-gray-500 mt-2">
                This will be used to send you a confirmation of your learning program.
            </p>
        </div>
        <div className="max-w-xs sm:max-w-sm mx-auto">
            <label htmlFor="contactNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                {isParent ? "Parent/Guardian Contact Number" : "Your Contact Number"}
            </label>
            <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="tel"
                    id="contactNumber"
                    placeholder="e.g., +61 412 345 678"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full p-3 pl-10 border-2 border-gray-300 rounded-lg focus:border-orange-500 outline-none transition text-sm sm:text-base"
                />
            </div>
            <button
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition text-base sm:text-lg"
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
        <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Are you the Parent/Guardian?</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-2">
                This helps us pre-fill the correct details during enrollment.
            </p>
        </div>
        <div className="space-y-4 max-w-sm mx-auto">
            <button
                className="w-full text-left p-4 bg-gray-50 hover:bg-orange-50 transition rounded-xl text-base sm:text-lg font-medium text-gray-700 shadow-md"
                onClick={() => onSelect(true)} // true for parent/guardian
            >
                Yes, I am the parent/guardian
            </button>
            <button
                className="w-full text-left p-4 bg-gray-50 hover:bg-orange-50 transition rounded-xl text-base sm:text-lg font-medium text-gray-700 shadow-md"
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
        <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Are you the Student or the Parent/Guardian?</h2>
        </div>
        <div className="space-y-4 max-w-md mx-auto">
            <button
                className="w-full text-left p-4 bg-gray-50 hover:bg-orange-50 transition rounded-xl text-lg font-medium text-gray-700"
                onClick={() => onSelect('parent')}
            >
                I am the parent/guardian
            </button>
            <button
                className="w-full text-left p-4 bg-gray-50 hover:bg-orange-50 transition rounded-xl text-lg font-medium text-gray-700"
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
            <div className="text-center mb-8 sm:mb-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Which school Year are you currently in?</h2>
            </div>
            {/* Responsive grid for year buttons */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-3xl mx-auto">
                {years.map(year => (
                    <button
                        key={year}
                        className="w-14 h-14 sm:w-16 sm:h-16 bg-white border-2 border-gray-200 text-gray-800 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition font-bold text-lg sm:text-xl"
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
        <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Which Year {year} subject would you like help with?</h2>
        </div>
        <div className="space-y-4 max-w-sm mx-auto">
            {['All', 'Mathematics', 'Science', 'English'].map(subject => (
                <button
                    key={subject}
                    className="w-full text-left p-4 bg-gray-50 hover:bg-orange-50 transition rounded-xl text-base sm:text-lg font-medium text-gray-700"
                    onClick={() => onSelect(subject)}
                >
                    {subject}
                </button>
            ))}
        </div>
    </>
);

// --- StepNeeds: No changes required ---
const StepNeeds = ({ onSelect, subject }) => (
    <>
        <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">What best describes your {subject} learning needs?</h2>
        </div>
        {/* Responsive Grid: 1 column on mobile, 2 on tablet, 4 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
                {
                    title: "I feel I'm falling behind",
                    desc: "I'm struggling with comprehension and could use some help with the fundamentals.",
                    emoji: "https://placehold.co/80x80/ffe4b5/000?text=🥺"
                },
                {
                    title: "Motivation to improve",
                    desc: "I want to keep on track as I feel I'm just cruising along and not very interested.",
                    emoji: "https://placehold.co/80x80/ffe4b5/000?text=😁"
                },
                {
                    title: "I'm ready to extend my learning",
                    desc: "I need to be further challenged to gain an advantage.",
                    emoji: "https://placehold.co/80x80/ffe4b5/000?text=🤩"
                },
                {
                    title: "I have individual needs",
                    desc: "The classroom can't fully support my learning needs.",
                    emoji: "https://placehold.co/80x80/ffe4b5/000?text=😅"
                }
            ].map((item, index) => (
                <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition cursor-pointer shadow-lg hover:shadow-xl group"
                    onClick={() => onSelect(item.title)}
                >
                    <div className="flex justify-center mb-3">
                        <img src={item.emoji} alt="Emoji" className="w-12 h-12 sm:w-16 sm:h-16 rounded-full" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-2 group-hover:text-orange-600 transition">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{item.desc}</p>
                </div>
            ))}
        </div>
        <div className="text-center pt-4 sm:pt-6">
            <p className="text-sm text-gray-500 hover:text-orange-500 cursor-pointer">Not sure? Skip ahead</p>
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
            <div className="text-center mb-8 sm:mb-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Which state are you in?</h2>
                <p className="text-sm sm:text-base text-gray-500 mt-2">We develop programs based on the Australian National Curriculum and take into account state variations.</p>
            </div>
            {/* Reduced max-height on mobile for smaller screens */}
            <div className="space-y-2 max-w-sm mx-auto overflow-y-auto max-h-56 sm:max-h-64">
                {states.map(state => (
                    <button
                        key={state}
                        className="w-full text-left p-4 bg-gray-50 hover:bg-orange-50 transition rounded-xl text-base sm:text-lg font-medium text-gray-700"
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
        <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">To finalise your learning program, what is your name?</h2>
        </div>
        <div className="max-w-xs sm:max-w-sm mx-auto">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Your name</label>
            <div className="flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="First name"
                    value={name.firstName || (isClerkUser ? clerkName.firstName : '')}
                    onChange={(e) => setName({ ...name, firstName: e.target.value })}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 outline-none transition text-sm sm:text-base"
                />
                <input
                    type="text"
                    placeholder="Last name"
                    value={name.lastName || (isClerkUser ? clerkName.lastName : '')}
                    onChange={(e) => setName({ ...name, lastName: e.target.value })}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 outline-none transition text-sm sm:text-base"
                />
            </div>
            <button
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition text-base sm:text-lg"
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
        <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Where can we send your quote and learning program?</h2>
        </div>
        <div className="max-w-xs sm:max-w-sm mx-auto">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Your email address</label>
            <input
                type="email"
                placeholder="youremail@example.com"
                value={email || (isClerkUser ? clerkEmail : '')}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={isClerkUser}
                className={`w-full p-3 border-2 rounded-lg outline-none transition text-sm sm:text-base ${isClerkUser ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'border-gray-300 focus:border-orange-500'}`}
            />
            <p className="text-xs text-gray-500 mt-2">You consent to receive emails from us.</p>
            <button
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition text-base sm:text-lg"
                onClick={() => onSelect(email || (isClerkUser ? clerkEmail : ''))}
                disabled={!(email || clerkEmail)?.includes('@') || !(email || clerkEmail)?.includes('.')}
            >
                Continue
            </button>
        </div>
    </>
);


const StepLoading = ({ onRedirect, finalData, backendUrl }) => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('Saving data...');

    useEffect(() => {
        const sendDataToBackend = async () => {
            const finalRole = finalData.isParent ? 'parent' : 'student';

            const dataToSave = {
                classRange: finalData.initialClassRange,
                role: finalRole, // Use the new isParent data to determine role
                year: finalData.year,
                subject: finalData.subject,
                needs: finalData.needs,
                state: finalData.state,
                contactNumber: finalData.contactNumber,

                // Collect Parent/Guardian or Student details
                // If isParent is true, the collected name/email/contact belongs to the Parent.
                // If isParent is false, the collected name/email/contact belongs to the Student.
                studentFirstName: finalData.isParent ? 'N/A' : finalData.name.firstName,
                studentLastName: finalData.isParent ? 'N/A' : finalData.name.lastName,
                studentEmail: finalData.isParent ? 'N/A' : finalData.email,
                parentFirstName: finalData.isParent ? finalData.name.firstName : 'N/A',
                parentLastName: finalData.isParent ? finalData.name.lastName : 'N/A',
                parentEmail: finalData.isParent ? finalData.email : 'N/A',
                class: finalData.year, // Using 'class' for the model

            };


            setStatus('Submitting to database...');
            try {
                // Hitting the new backend endpoint for data submission
                const response = await axios.post(`${backendUrl}/api/assessments/submit`, {
                    classRange: finalData.initialClassRange,
                    role: finalRole,
                    year: finalData.year,
                    subject: finalData.subject,
                    needs: finalData.needs,
                    state: finalData.state,
                    contactNumber: finalData.contactNumber,

                    studentFirstName: dataToSave.studentFirstName,
                    studentLastName: dataToSave.studentLastName,
                    studentEmail: dataToSave.studentEmail,
                    parentFirstName: dataToSave.parentFirstName,
                    parentLastName: dataToSave.parentLastName,
                    parentEmail: dataToSave.parentEmail,
                    class: finalData.year, // Using 'class' for the model

                });

                if (response.status === 201) {
                    setStatus('Data saved! Preparing quote...');
                    // Redirect after a short delay
                    setTimeout(() => {
                        onRedirect();
                    }, 2000);
                } else {
                    throw new Error('Database save failed.');
                }
            } catch (err) {
                console.error('Data submission error:', err);
                setStatus('Error saving data. Redirecting anyway...');
                setTimeout(() => {
                    onRedirect();
                }, 3000);
            }
        };

        sendDataToBackend();
    }, [onRedirect, finalData, backendUrl]);

    return (
        <div className="flex flex-col items-center justify-center h-64">
            <Loader className="w-10 h-10 text-orange-500 animate-spin mb-6" />
            <p className="text-base sm:text-xl font-semibold text-gray-700 text-center">{status}</p>
        </div>
    );
};


// --- Main Pricing Flow Component ---

// Updated prop to accept initialClassFlowData instead of just initialClassRange
const PricingFlow = ({ isOpen, onClose, initialClassFlowData }) => {
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
        }
    }, [isOpen, initialClassRange, basePrice, clerkFirstName, clerkLastName, clerkEmail]);

    const handleNext = (newStep, key, value) => {
        setData(prev => ({ ...prev, [key]: value }));
        setHistory(prev => [...prev, newStep]);
        setStep(newStep);
    };

    const handleBack = () => {
        if (history.length > 1) {
            const newHistory = history.slice(0, -1);
            setHistory(newHistory);
            setStep(newHistory[newHistory.length - 1]);
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
                return <StepYear onSelect={(y) => handleNext('isParent', 'year', y)} initialClassRange={initialClassRange} />;

            case 'isParent':
                // Flow: isParent -> subject
                return <StepIsParent onSelect={(ip) => handleNext('subject', 'isParent', ip)} />;

            case 'subject':
                // Flow: subject -> needs
                return <StepSubject onSelect={(s) => handleNext('needs', 'subject', s)} year={year} />;

            case 'needs':
                // Flow: needs -> state
                return <StepNeeds onSelect={(n) => handleNext('state', 'needs', n)} subject={subject || 'Primary'} />;

            case 'state':
                // Flow: state -> name
                return <StepState onSelect={(s) => handleNext('name', 'state', s)} />;

            case 'name':
                // Flow: name -> email
                return <StepName
                    onSelect={(n) => handleNext('email', 'name', n)}
                    name={nameInput}
                    setName={setNameInput}
                    isClerkUser={isClerkUser}
                    clerkName={{ firstName: clerkFirstName, lastName: clerkLastName }}
                />;

            case 'email':
                // Flow: email -> contact
                return <StepEmail
                    onSelect={(e) => handleNext('contact', 'email', e)}
                    email={emailInput}
                    setEmail={setEmailInput}
                    isClerkUser={isClerkUser}
                    clerkEmail={clerkEmail}
                />;

            case 'contact':
                // Flow: contact -> loading (new step)
                return <StepContact
                    onSelect={(c) => handleNext('loading', 'contactNumber', c)}
                    contactNumber={contactInput}
                    setContactNumber={setContactInput}
                    isParent={isParent}
                />;


            case 'loading':
                // Flow: loading -> final redirect
                return <StepLoading onRedirect={handleFinalRedirect} finalData={data} backendUrl={backendUrl} />;

            case 'role': // Retain old 'role' flow logic if needed, but it's now bypassed
                return <StepRole onSelect={(r) => handleNext('year', 'role', r)} onBack={onClose} />;

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-gray-900/70 flex items-center justify-center backdrop-blur-sm transition-opacity p-4">
            {/* Modal Content container - Responsive max-width and max-height */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg md:max-w-3xl mx-auto transform scale-100 transition-transform duration-300 overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="relative p-6 md:p-10">

                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={handleBack}
                            className={`p-2 rounded-full hover:bg-gray-100 transition text-gray-700 ${history.length > 1 ? '' : 'invisible'}`}
                            aria-label="Back"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="flex-grow text-center"></div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-red-50 hover:text-red-600 transition text-gray-700"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="pb-4">
                        {renderStep()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingFlow;