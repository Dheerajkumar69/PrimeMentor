// frontend/src/components/Enrollment/Step1Account.jsx
import React, { useEffect } from 'react';

const Step1Account = ({ studentDetails, setStudentDetails, guardianDetails, setGuardianDetails, onNext, quizData, enrollmentDataKey }) => {

    useEffect(() => {
        // ... (Initialization logic remains the same for the first load) ...

        if (quizData) {
            const { isParent, name, email, contactNumber } = quizData;

            if (isParent === true) {
                // User is the Parent/Guardian -> Autofill Guardian details
                setGuardianDetails(prev => ({
                    ...prev,
                    first: name?.firstName || '',
                    last: name?.lastName || '',
                    email: email || '',
                    phone: contactNumber || ''
                }));
                setStudentDetails({ first: '', last: '', email: '' });

            } else if (isParent === false) {
                // User is the Student -> Autofill Student details
                setStudentDetails(prev => ({
                    ...prev,
                    first: name?.firstName || '',
                    last: name?.lastName || '',
                    email: email || ''
                }));
                // Autofill Guardian Phone ONLY (as it's the primary contact)
                setGuardianDetails(prev => ({
                    ...prev,
                    phone: contactNumber || ''
                }));
                
                if (guardianDetails.first && guardianDetails.email) {
                    setGuardianDetails(prev => ({
                        ...prev,
                        first: '',
                        last: '',
                        email: ''
                    }));
                }
            }
        }
    }, [quizData, setStudentDetails, setGuardianDetails]);


    // Determine if all required fields are filled to enable the button
    const isNextDisabled = !studentDetails.first || !studentDetails.last || !studentDetails.email ||
        !guardianDetails.first || !guardianDetails.last || !guardianDetails.email ||
        !guardianDetails.phone;
        
    // 🛑 NEW HANDLER: Pass current state to parent before moving to the next step
    const handleNextClick = () => {
        onNext(studentDetails, guardianDetails);
    };

    return (
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Student details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                <div className="space-y-2">
                    <label htmlFor="studentFirstName" className="text-sm font-medium text-gray-700">Student's First Name</label>
                    <input
                        type="text"
                        id="studentFirstName"
                        placeholder="First Name"
                        value={studentDetails.first}
                        onChange={(e) => setStudentDetails({ ...studentDetails, first: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm sm:text-base"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="studentLastName" className="text-sm font-medium text-gray-700">Student's Last Name</label>
                    <input
                        type="text"
                        id="studentLastName"
                        placeholder="Last Name"
                        value={studentDetails.last}
                        onChange={(e) => setStudentDetails({ ...studentDetails, last: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm sm:text-base"
                    />
                </div>
                <div className="space-y-2 col-span-1 sm:col-span-2">
                    <label htmlFor="studentEmail" className="text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        id="studentEmail"
                        placeholder="example@gmail.com"
                        value={studentDetails.email}
                        onChange={(e) => setStudentDetails({ ...studentDetails, email: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <p className="text-xs text-gray-500 mt-1">You consent to receive emails from us.</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Parent / Guardian details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4">
                    <div className="space-y-2">
                        <label htmlFor="guardianFirstName" className="text-sm font-medium text-gray-700">Guardian's First Name</label>
                        <input
                            type="text"
                            id="guardianFirstName"
                            placeholder="First Name"
                            value={guardianDetails.first}
                            onChange={(e) => setGuardianDetails({ ...guardianDetails, first: e.target.value })}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm sm:text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="guardianLastName" className="text-sm font-medium text-gray-700">Guardian's Last Name</label>
                        <input
                            type="text"
                            id="guardianLastName"
                            placeholder="Last Name"
                            value={guardianDetails.last}
                            onChange={(e) => setGuardianDetails({ ...guardianDetails, last: e.target.value })}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm sm:text-base"
                        />
                    </div>
                    <div className="space-y-2 col-span-1 sm:col-span-2">
                        <label htmlFor="guardianEmail" className="text-sm font-medium text-gray-700">Guardian's Email</label>
                        <input
                            type="email"
                            id="guardianEmail"
                            placeholder="guardian@example.com"
                            value={guardianDetails.email}
                            onChange={(e) => setGuardianDetails({ ...guardianDetails, email: e.target.value })}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm sm:text-base"
                        />
                    </div>
                    {/* NEW: Guardian's Phone */}
                    <div className="space-y-2 col-span-1 sm:col-span-2">
                        <label htmlFor="guardianPhone" className="text-sm font-medium text-gray-700">Guardian's Phone</label>
                        <input
                            type="tel"
                            id="guardianPhone"
                            placeholder="e.g., +61 412 345 678"
                            value={guardianDetails.phone}
                            onChange={(e) => setGuardianDetails({ ...guardianDetails, phone: e.target.value })}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm sm:text-base"
                        />
                    </div>
                </div>
            </div>
            <button
                onClick={handleNextClick} // 🛑 Use new handler 🛑
                disabled={isNextDisabled}
                className={`w-full mt-8 font-bold py-3 rounded-lg transition text-base sm:text-lg ${isNextDisabled ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
                NEXT: Schedule
            </button>
        </div>
    );
};

export default Step1Account;