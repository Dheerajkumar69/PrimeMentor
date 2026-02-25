// frontend/src/pages/Booking.jsx
import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Mail, Share2, Star, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppContext } from '../context/AppContext.jsx';
import { assets } from '../assets/assets.js';
import axios from 'axios';

// Function to generate a random ObjectId-like string
const generateObjectId = () => {
    const hexChars = '0123456789abcdef';
    let objectId = '';
    for (let i = 0; i < 24; i++) {
        objectId += hexChars[Math.floor(Math.random() * 16)];
    }
    return objectId;
};

// Updated function to handle all pricing and session text logic — NOW USES DYNAMIC PRICING
const getRecommendedProgram = (data, pricingConfig) => {
    const safeData = {
        initialClassRange: '7-9', // Default to 7-9
        year: 8,
        subject: 'Mathematics',
        needs: "I'm ready to extend my learning",
        state: 'New South Wales',
        name: { firstName: 'Valued', lastName: 'Customer' },
        email: 'default@example.com',
        basePrice: 25, // Default session price
        ...data
    };

    const { year, subject, needs, state, name, initialClassRange } = safeData;
    const fullName = `${name.firstName || 'Valued'} ${name.lastName || 'Customer'}`;
    const tutorImage = null; // Tutor image will be assigned by admin after enrollment

    let title = `${subject} Advanced`;
    let sessionDiscountedPrice = 0;
    let sessionOriginalPrice = 0;
    let starterPackDiscountedPrice = 0;
    let starterPackOriginalPrice = 0;

    // --- DYNAMIC Pricing from backend config ---
    const classRanges = pricingConfig?.classRanges || {};
    const rangePricing = classRanges[initialClassRange] || classRanges['7-9'] || { sessionPrice: 25, originalPrice: 40 };

    sessionDiscountedPrice = rangePricing.sessionPrice;
    sessionOriginalPrice = rangePricing.originalPrice;
    starterPackDiscountedPrice = rangePricing.sessionPrice;
    starterPackOriginalPrice = rangePricing.originalPrice;

    if (year > 10) {
        title = `${subject} HSC Prep`;
    } else if (String(needs).includes('falling behind')) {
        title = `${subject} Foundational Skills`;
    }
    const stateSyllabus = state ? state.split(' ')[0] : 'WA';

    // --- Starter Pack calculations using dynamic config ---
    const numberOfSessions = pricingConfig?.starterPack?.numberOfSessions || 6;
    const fixedDiscountAmount = pricingConfig?.starterPack?.fixedDiscount || 5.00;

    // Base price for sessions (The "Cut" Price on the Booking page)
    const starterPackTotalBasePrice = starterPackDiscountedPrice * numberOfSessions;

    // Apply fixed discount (The Final Price)
    const starterPackTotalPrice = starterPackTotalBasePrice - fixedDiscountAmount;

    // Calculate the effective per-session price for display
    const discountedPerSessionPrice = parseFloat((starterPackTotalPrice / numberOfSessions).toFixed(2));

    return {
        fullName, year, subject, need: needs, initialClassRange,
        programTitle: `Year ${year} ${title}`,
        syllabus: `${stateSyllabus} syllabus`,
        tutor: {
            name: "Matched after enrolment",
            title: "Qualified Tutor",
            qual: "Degree-qualified educators",
            image: tutorImage
        },
        package: {
            title: "Starter Pack Offer",
            sessions: `${numberOfSessions} x 60 minutes 1-to-1 session`,
            desc: "Is a Prime Mentor program right for you? Start with 6 discounted sessions to assess your needs",
            originalPrice: starterPackOriginalPrice,
            price: discountedPerSessionPrice,
            scheduleTime: "Schedule anytime between 4 PM - 9 PM, Monday to Saturday!",
            sessionDescription: "60 minutes 1-to-1 session",
            sessionOriginalPrice: sessionOriginalPrice,
            sessionFee: sessionDiscountedPrice,
            starterPackTotalPrice: parseFloat(starterPackTotalPrice.toFixed(2)),
            starterPackTotalBasePrice: parseFloat(starterPackTotalBasePrice.toFixed(2)),
            numberOfSessions: numberOfSessions,
            fixedDiscountAmount: fixedDiscountAmount
        },
        courseId: `pending-${Date.now()}`,
    };
};

// --- Header Component ---
const Header = ({ onBookSession }) => (
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
                onClick={onBookSession}
                className="px-3 py-1.5 sm:px-4 sm:py-2 border-2 border-orange-500 rounded-full text-xs sm:text-sm font-bold text-orange-500 bg-white hover:bg-orange-50 transition"
            >
                BOOK A SESSION
            </button>
        </div>
    </div>
);

// --- ProgramSummary Component ---
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
            <div className="w-full md:w-40 mt-6 md:mt-0 h-40 bg-purple-100 rounded-lg p-2 text-center relative shadow-inner flex-shrink-0">
                <span className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-bl-lg rounded-tr-lg">LIVE & ONLINE</span>
                <div className="w-24 h-24 rounded-full mx-auto mt-4 border-4 border-white shadow bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">T</span>
                </div>
                <p className="text-xs text-purple-800 font-medium mt-1">ONE-ON-ONE TUTORING</p>
            </div>
        </div>
    </div>
);

// --- StarterPack Component ---
const StarterPack = ({ program, onEnroll }) => (
    <div className="bg-yellow-50 p-6 md:p-10 rounded-xl shadow-2xl border-4 border-yellow-200 mt-10 text-center">
        <h3 className="text-xl md:text-3xl font-bold text-gray-800 mb-4">Book a weekly session</h3>
        <p className="text-sm sm:text-lg text-gray-600 mb-6">
            {program.package.desc}
        </p>
        <div className="my-4">
            <p className="text-xl sm:text-2xl font-bold text-gray-700">{program.package.sessions}</p>
            <p className="text-4xl sm:text-5xl font-extrabold text-red-600 mt-2">
                {/* Display the Total Base Price with strikethrough */}
                <span className='text-2xl sm:text-3xl line-through text-gray-500 mr-4'>
                    ${program.package.starterPackTotalBasePrice.toFixed(2)}
                </span>
                <span className='text-3xl sm:text-4xl font-extrabold text-red-600'>
                    ${program.package.starterPackTotalPrice.toFixed(2)}
                </span>
            </p>
            {/* Displaying the fixed saving explicitly */}
            <p className="text-sm sm:text-md text-green-700 font-semibold mt-1">
                (${program.package.fixedDiscountAmount.toFixed(2)} fixed saving applied)
            </p>
            {/* Display the effective per-session price */}
            <p className="text-sm sm:text-lg font-bold text-gray-700 mt-2">
                (Equivalent to only <span className='text-red-600'>${program.package.price.toFixed(2)}</span> per session!)
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

// --- TutorAndSyllabusCard Component ---
const TutorAndSyllabusCard = ({ program }) => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
        <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 border-b pb-3">What's Included</h4>
        <div className="flex flex-col space-y-4">
            <div className="">
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
        </div>
    </div>
);

// --- SessionBlock Component ---
const SessionBlock = ({ program, onScheduleSession }) => (
    <div className="bg-white p-6 md:p-10 rounded-xl shadow-2xl border-4 border-orange-100 mt-10 text-center">
        <h3 className="text-xl md:text-3xl font-bold text-gray-800 mb-4">Book a Session</h3>
        <p className="text-sm sm:text-lg text-gray-600 mb-6">One-off paid session</p>
        <p className="text-base sm:text-xl font-semibold text-gray-700">Is a Prime Mentor program right for you?</p>
        <p className="text-sm sm:text-md text-gray-600 mb-4">Start with an assessment session to evaluate your needs</p>
        <div className="my-4">
            <p className="text-xl sm:text-2xl font-bold text-gray-700">{program.package.sessionDescription}</p>
            <p className="text-4xl sm:text-5xl font-extrabold text-red-600 mt-2">
                <span className='text-2xl sm:text-3xl line-through text-gray-500 mr-4'>${program.package.sessionOriginalPrice}</span>
                ${program.package.sessionFee}
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

// --- Main Booking Component ---
const Booking = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const quizData = location.state?.quizData;
    const { isLoaded, backendUrl } = useContext(AppContext);

    const [program, setProgram] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pricingConfig, setPricingConfig] = useState(null);

    // Fetch pricing config on mount
    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const apiBase = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const response = await axios.get(`${apiBase}/api/admin/pricing`);
                setPricingConfig(response.data);
            } catch (err) {
                console.error('Failed to fetch pricing for booking, using defaults:', err);
                // Fallback defaults
                setPricingConfig({
                    classRanges: {
                        '2-6': { sessionPrice: 22, originalPrice: 35 },
                        '7-9': { sessionPrice: 25, originalPrice: 40 },
                        '10-12': { sessionPrice: 27, originalPrice: 45 },
                    },
                    starterPack: { numberOfSessions: 6, fixedDiscount: 5 },
                });
            }
        };
        fetchPricing();
    }, [backendUrl]);

    // Build the program once pricing and quizData are available
    useEffect(() => {
        if (pricingConfig && (quizData || isLoaded)) {
            setProgram(getRecommendedProgram(quizData || {}, pricingConfig));
            setIsLoading(false);
        }
    }, [quizData, isLoaded, pricingConfig]);

    const handleEnrollmentRedirect = (purchaseType) => {
        if (!program) return;

        const isStarterPack = purchaseType === 'STARTER_PACK';

        const nextStepQuizData = {
            ...quizData,
            courseId: program.courseId,
            price: isStarterPack ? program.package.starterPackTotalPrice : program.package.sessionFee,
            initialClassRange: program.initialClassRange,
            sessionPrice: isStarterPack ? program.package.price : program.package.sessionFee,
            numberOfSessions: isStarterPack ? program.package.numberOfSessions : 1,
            fixedDiscount: isStarterPack ? program.package.fixedDiscountAmount : 0,

            isFreeAssessment: false,
            origin: 'pricing_enrollment_flow',

            scheduleDetails: {
                purchaseType: purchaseType,
                preferredDate: null,
                preferredTime: null,
                preferredWeekStart: null,
                preferredTimeMonFri: null,
                preferredTimeSaturday: null,
                postcode: null,
                numberOfSessions: isStarterPack ? program.package.numberOfSessions : 1,
            }
        };

        console.log('[BOOKING] navigate state.quizData before redirect:', nextStepQuizData);

        navigate('/enrollment?step=1', {
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
            <Header onBookSession={() => handleEnrollmentRedirect('TRIAL')} />
            <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-5xl">
                <div className="text-center mb-10 sm:mb-12">
                    <h1 className="text-xl sm:text-3xl font-light text-gray-700 mb-2">
                        Hi <span className="font-bold text-orange-600">{program.fullName.split(' ')[0]}</span>, let's address your individual learning needs
                    </h1>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">
                        Your personalised {program.programTitle} learning program
                    </h2>
                </div>
                <div className="grid md:grid-cols-1 gap-8">
                    <div><ProgramSummary data={program} /></div>

                    <div className='text-center'>
                        <p className="text-xl sm:text-2xl font-bold text-gray-700 mb-8">GETTING STARTED</p>
                        <p className="text-base sm:text-lg text-gray-600 mb-6">One of our friendly Learning Advisors will be in touch soon</p>
                        <SessionBlock program={program} onScheduleSession={() => handleEnrollmentRedirect('TRIAL')} />
                    </div>

                    <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-700 text-center mt-6 mb-8">WHAT'S INCLUDED</h3>
                        <TutorAndSyllabusCard program={program} />
                    </div>

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
                        <button
                            className="mt-6 px-6 py-2 border border-orange-500 rounded-full text-orange-500 font-bold hover:bg-orange-50 transition text-sm"
                            onClick={() => {
                                const shareData = {
                                    title: 'PrimeMentor Course Recommendation',
                                    text: `Check out this personalised tutoring recommendation from PrimeMentor!`,
                                    url: window.location.href,
                                };
                                if (navigator.share) {
                                    navigator.share(shareData).catch(() => { });
                                } else {
                                    navigator.clipboard.writeText(window.location.href)
                                        .then(() => toast.success('Link copied to clipboard!'))
                                        .catch(() => toast.error('Could not copy link.'));
                                }
                            }}
                        >
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
                <p className="mt-2">© All rights are reserved by Prime Mentor PTY Ltd Australia.</p>
            </footer>
        </div>
    );
};
export default Booking;