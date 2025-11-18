// frontend/src/pages/Booking.jsx
import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Mail, Share2, Star, Loader } from 'lucide-react';
import { AppContext } from '../context/AppContext.jsx';
import { assets } from '../assets/assets.js';

// Function to generate a random ObjectId-like string
const generateObjectId = () => {
    const hexChars = '0123456789abcdef';
    let objectId = '';
    for (let i = 0; i < 24; i++) {
        objectId += hexChars[Math.floor(Math.random() * 16)];
    }
    return objectId;
};

// Updated function to handle all pricing and session text logic (MODIFIED)
const getRecommendedProgram = (data) => {
    const safeData = {
        initialClassRange: '7-9', // Default to 7-9
        year: 8,
        subject: 'Mathematics',
        needs: "I'm ready to extend my learning",
        state: 'New South Wales',
        name: { firstName: 'Valued', lastName: 'Customer' },
        email: 'default@example.com',
        basePrice: 25, // Default trial price
        ...data
    };
    
    const { year, subject, needs, state, name, initialClassRange } = safeData;
    const fullName = `${name.firstName || 'Valued'} ${name.lastName || 'Customer'}`;
    const tutorImage = "https://placehold.co/80x80/ffe4b5/000?text=Tutor";

    let title = `${subject} Advanced`;
    let trialDiscountedPrice = 0;
    let trialOriginalPrice = 0;
    let starterPackDiscountedPrice = 0;
    let starterPackOriginalPrice = 0;

    // --- Pricing and Text Logic based on initialClassRange ---
    switch (initialClassRange) {
        case '2-6':
            trialDiscountedPrice = 22;
            trialOriginalPrice = 35; 
            starterPackDiscountedPrice = 22;
            starterPackOriginalPrice = 35; 
            break;
        case '7-9':
            trialDiscountedPrice = 25;
            trialOriginalPrice = 40;
            starterPackDiscountedPrice = 25;
            starterPackOriginalPrice = 40;
            break;
        case '10-12':
            trialDiscountedPrice = 27;
            trialOriginalPrice = 45;
            starterPackDiscountedPrice = 27;
            starterPackOriginalPrice = 45;
            break;
        default:
            trialDiscountedPrice = 25;
            trialOriginalPrice = 40;
            starterPackDiscountedPrice = 25;
            starterPackOriginalPrice = 40;
            break;
    }
    
    if (year > 10) {
        title = `${subject} HSC Prep`;
    } else if (String(needs).includes('falling behind')) {
        title = `${subject} Foundational Skills`;
    }
    const stateSyllabus = state ? state.split(' ')[0] : 'WA'; 
    
    // MODIFICATION 1: Calculate price for 6 sessions and apply $5 discount
    const numberOfSessions = 6;
    const weeklyDiscount = 5;
    const starterPackTotalBasePrice = starterPackDiscountedPrice * numberOfSessions; // Price for 6 sessions (The "Cut" Price)
    const starterPackTotalPrice = starterPackTotalBasePrice - weeklyDiscount; // Apply $5 discount (The Final Price)
    const discountedPerSessionPrice = starterPackTotalPrice / numberOfSessions; // Calculate effective per-session price for display

    return {
        fullName, year, subject, need: needs, initialClassRange, 
        programTitle: `Year ${year} ${title}`,
        syllabus: `${stateSyllabus} syllabus`,
        tutor: {
            name: "Dr Selina Samuels",
            title: "Head of Education",
            qual: "BSc, MSc, PhD",
            image: tutorImage
        },
        package: {
            title: "Starter Pack Offer", 
            // MODIFICATION 2: Change sessions text to 6
            sessions: `${numberOfSessions} x 60 minutes 1-to-1 session`,
            desc: "Is a Prime Mentor program right for you? Start with 6 discounted sessions to assess your needs",
            originalPrice: starterPackOriginalPrice, // Per-session original price (unchanged)
            // MODIFICATION 3: Display the effectively discounted price per session
            price: parseFloat(discountedPerSessionPrice.toFixed(2)), 
            // MODIFICATION 4: Update schedule time text
            scheduleTime: "Schedule anytime between 4 PM - 9 PM, Monday to Saturday!",
            trialSession: "60 minutes 1-to-1 session",
            trialOriginalPrice: trialOriginalPrice, 
            trialFee: trialDiscountedPrice, 
            // Pass total for Enrollment (Final Price)
            starterPackTotalPrice: parseFloat(starterPackTotalPrice.toFixed(2)), 
            // NEW: Pass the total base price for 6 sessions (The "Cut" Price)
            starterPackTotalBasePrice: parseFloat(starterPackTotalBasePrice.toFixed(2)), 
            // Pass the number of sessions
            numberOfSessions: numberOfSessions
        },
        courseId: generateObjectId(), 
    };
};

// --- Header Component (Unchanged) ---
const Header = ({ onBookTrial }) => (
    // Responsive padding and logo size
    <div className="flex justify-between items-center py-4 px-4 sm:px-8 border-b border-orange-100 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-1"> 
            <div className='flex space-x-1'>
                <span className="text-xl sm:text-2xl font-bold text-blue-700">PRIME</span>
                <span className="text-xl sm:text-2xl font-bold text-orange-600">MENTOR</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-700 sm:ml-4">ENROLLMENT</span>
        </div>
        <div className="space-x-2 sm:space-x-4 flex items-center">
            <button className="hidden md:flex px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 items-center">
                <Share2 className="w-4 h-4 mr-2" /> SHARE
            </button>
            <button 
                onClick={onBookTrial}
                className="px-3 py-1.5 sm:px-4 sm:py-2 border-2 border-orange-500 rounded-full text-xs sm:text-sm font-bold text-orange-500 bg-white hover:bg-orange-50 transition"
            >
                BOOK A TRIAL
            </button>
        </div>
    </div>
);

// --- ProgramSummary Component (Unchanged) ---
const ProgramSummary = ({ data }) => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start">
            <div className="flex-1 md:pr-8">
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-700">
                    <span className="text-orange-500">Your specific needs program will:</span>
                </h3>
                <ul className="space-y-3 mt-4">
                    {["Identify personal learning needs", "Match you with the right tutor", "Support what you're learning in class", "Monitor and adjust to emerging areas of need"].map((item, index) => (
                        <li key={index} className="flex items-start text-sm sm:text-base text-gray-600">
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
            {/* Image section is fixed size and stays compact */}
            <div className="w-full md:w-40 mt-6 md:mt-0 h-40 bg-purple-100 rounded-lg p-2 text-center relative shadow-inner flex-shrink-0">
                <span className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-bl-lg rounded-tr-lg">LIVE & ONLINE</span>
                <img src="https://placehold.co/80x80/9333ea/fff?text=TUTOR" alt="Tutor" className="w-24 h-24 rounded-full mx-auto mt-4 object-cover border-4 border-white shadow" />
                <p className="text-xs text-purple-800 font-medium mt-1">ONE-ON-ONE TUTORING</p>
            </div>
        </div>
    </div>
);

// --- StarterPack Component (Updated for Pricing Display) ---
const StarterPack = ({ program, onEnroll }) => (
    // Responsive padding and font size
    <div className="bg-yellow-50 p-6 md:p-10 rounded-xl shadow-2xl border-4 border-yellow-200 mt-10 text-center">
        <h3 className="text-xl md:text-3xl font-bold text-gray-800 mb-4">Book a weekly session</h3>
        <p className="text-sm sm:text-lg text-gray-600 mb-6">
            {program.package.desc}
        </p>
        <div className="my-4">
            <p className="text-xl sm:text-2xl font-bold text-gray-700">{program.package.sessions}</p>
            <p className="text-4xl sm:text-5xl font-extrabold text-red-600 mt-2">
                {/* MODIFIED: Displaying the TOTAL Base Price (The "Cut" Price) with strikethrough */}
                <span className='text-2xl sm:text-3xl line-through text-gray-500 mr-4'>
                    ${program.package.starterPackTotalBasePrice}
                </span>
                <span className='text-3xl sm:text-4xl font-extrabold text-red-600'>
                    ${program.package.starterPackTotalPrice}
                </span>
            </p>
            {/* NEW: Display the total price calculation and effective per-session price */}
            <p className="text-sm sm:text-lg font-bold text-gray-700 mt-2">
                (Equivalent to only <span className='text-red-600'>${program.package.price}</span> per session!)
            </p>
        </div>
        {/* Updated Schedule Time */}
        <p className="text-xs sm:text-sm text-gray-600 mt-4">{program.package.scheduleTime}</p>
        <button 
            onClick={onEnroll}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition text-sm sm:text-base"
        >
            ENROLL NOW (Starter Pack)
        </button>
    </div>
);

// --- TutorAndSyllabusCard Component (Unchanged) ---
const TutorAndSyllabusCard = ({ program }) => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100 mt-8">
        <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 border-b pb-3">What's Included</h4>
        <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1">
                <div className="border p-4 rounded-xl bg-gray-50">
                    <h5 className="text-base sm:text-lg font-bold text-gray-700 mb-2">
                        {program.syllabus} aligned {program.programTitle}
                    </h5>
                    <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                        <li className="flex items-start">
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                            <span>Our Education Department sequenced and created the learning plan content to ensure quality and promote progress.</span>
                        </li>
                        <li className="flex items-start">
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                            <span>Sequence {program.subject} Advanced topics and concepts to help keep you on track and motivate progression.</span>
                        </li>
                        <li className="flex items-start">
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                            <span>Ensure the quality of service from your tutor.</span>
                        </li>
                    </ul>
                </div>
            </div>
            {/* Tutor Profile is fixed size and centered vertically on mobile */}
            <div className="md:w-64 border p-4 rounded-xl bg-purple-50 flex flex-col items-center justify-center text-center">
                <img src={program.tutor.image} alt={program.tutor.name} className="w-20 h-20 rounded-full object-cover shadow-md mb-3" />
                <h5 className="text-sm sm:text-md font-bold text-purple-800">{program.tutor.name}</h5>
                <p className="text-xs sm:text-sm text-purple-600">{program.tutor.title}</p>
                <p className="text-xs text-purple-500">{program.tutor.qual}</p>
                <div className="flex items-center mt-3 text-sm text-orange-500 font-semibold cursor-pointer hover:text-orange-600">
                    <Star className="w-4 h-4 fill-orange-500 mr-1" />
                    4.7/5 stars
                </div>
            </div>
        </div>
    </div>
);

// --- TrialSessionBlock Component (Unchanged) ---
const TrialSessionBlock = ({ program, onScheduleSession }) => (
    // Responsive padding and font size
    <div className="bg-white p-6 md:p-10 rounded-xl shadow-2xl border-4 border-orange-100 mt-10 text-center">
        <h3 className="text-xl md:text-3xl font-bold text-gray-800 mb-4">Book a Session</h3>
        <p className="text-sm sm:text-lg text-gray-600 mb-6">One-off and obligation free</p>
        <p className="text-base sm:text-xl font-semibold text-gray-700">Is a Prime Mentor program right for you?</p>
        <p className="text-sm sm:text-md text-gray-600 mb-4">Start with a trial session to assess your needs</p>
        <div className="my-4">
            <p className="text-xl sm:text-2xl font-bold text-gray-700">{program.package.trialSession}</p>
            <p className="text-4xl sm:text-5xl font-extrabold text-red-600 mt-2">
                <span className='text-2xl sm:text-3xl line-through text-gray-500 mr-4'>${program.package.trialOriginalPrice}</span>
                ${program.package.trialFee}
            </p>
        </div>
        <button 
            onClick={onScheduleSession}
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition text-sm sm:text-base"
        >
            Schedule session
        </button>
    </div>
);

// --- Main Booking Component (MODIFIED) ---
const Booking = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const quizData = location.state?.quizData; 
    const { isLoaded } = useContext(AppContext);
    
    const [program, setProgram] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (quizData) {
            setProgram(getRecommendedProgram(quizData));
            setIsLoading(false);
        } else if (isLoaded) {
            setProgram(getRecommendedProgram({}));
            setIsLoading(false);
        }
    }, [quizData, isLoaded]);

    const handleEnrollmentRedirect = (purchaseType) => {
        const nextStepQuizData = {
            ...quizData,
            courseId: program.courseId,
            price: purchaseType === 'TRIAL' ? program.package.trialFee : program.package.starterPackTotalPrice,
            initialClassRange: program.initialClassRange,
            // Pass the discounted session price for Enrollment to use in its display calculation
            sessionPrice: purchaseType === 'STARTER_PACK' ? program.package.price : program.package.trialFee,
            // NEW: Pass number of sessions
            numberOfSessions: purchaseType === 'STARTER_PACK' ? program.package.numberOfSessions : 1,
        };

        navigate('/enrollment', { 
            state: { 
                quizData: nextStepQuizData, 
                purchaseType: purchaseType
            } 
        });
    };

    if (isLoading || !program) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader className="w-10 h-10 text-orange-500 animate-spin" />
                <p className="ml-4 text-gray-600">Loading program...</p>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header onBookTrial={() => handleEnrollmentRedirect('TRIAL')} />
            {/* Responsive padding and max width */}
            <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-5xl">
                <div className="text-center mb-10 sm:mb-12">
                    {/* Responsive Headings */}
                    <h1 className="text-xl sm:text-3xl font-light text-gray-700 mb-2">
                        Hi <span className="font-bold text-orange-600">{program.fullName.split(' ')[0]}</span>, let's address your individual learning needs
                    </h1>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">
                        Your personalised {program.programTitle} learning program
                    </h2>
                </div>
                <div className="grid md:grid-cols-1 gap-10">
                    <div><ProgramSummary data={program} /></div>
                    
                    {/* MODIFIED: 1. Display TrialSessionBlock first */}
                    <div className='text-center'>
                        <p className="text-xl sm:text-2xl font-bold text-gray-700 mb-8">GETTING STARTED</p>
                        <p className="text-base sm:text-lg text-gray-600 mb-6">One of our friendly Learning Advisors will be in touch soon</p>
                        <TrialSessionBlock program={program} onScheduleSession={() => handleEnrollmentRedirect('TRIAL')} />
                    </div>
                    
                    <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-700 text-center my-10 sm:my-12">WHAT'S INCLUDED</h3>
                        <TutorAndSyllabusCard program={program} />
                    </div>
                    
                    {/* MODIFIED: 2. Display the "OR" and then the StarterPack */}
                    <div className='text-center'>
                        <div className="text-xl font-bold text-gray-700 my-10 sm:my-12">OR</div>
                        <StarterPack program={program} onEnroll={() => handleEnrollmentRedirect('STARTER_PACK')} />
                    </div>
                    
                </div>
                <div className="text-center my-12 sm:my-16">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-6">NOT READY?</h3>
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 inline-block max-w-lg">
                        <div className="flex flex-col sm:flex-row items-start text-left gap-4">
                            <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 flex-shrink-0" />
                            <div>
                                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Want to share this with your parent or guardian?</h4>
                                <p className="text-sm text-gray-600">We'll send an email with a unique link to this recommendation to someone you'd like to share this with.</p>
                            </div>
                        </div>
                        <button className="mt-6 px-6 py-2 border border-orange-500 rounded-full text-orange-500 font-bold hover:bg-orange-50 transition text-sm">
                            SHARE THIS RECOMMENDATION
                        </button>
                    </div>
                </div>
            </main>
            <footer className="py-6 sm:py-8 bg-gray-100 text-center text-xs sm:text-sm text-gray-600">
                <div className="flex justify-center items-center space-x-2 mb-4">
                    <img src={assets.primementor} alt="Prime Mentor Logo" className="w-6 h-6" />
                    <span className="font-semibold">Prime Mentor PTY Ltd.</span>
                </div>
                <p className='px-4'>Office 1, Floor 1, 105a High Street Cranbourne Vic 3977</p>
                <p className="mt-2">© All right are reserved by Prime Mentor PTY Ltd Australia.</p>
            </footer>
        </div>
    );
};
export default Booking;