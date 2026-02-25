// frontend/src/pages/NotFoundPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-[80px]">
            <div className="text-center max-w-lg">
                {/* Large 404 Number */}
                <h1 className="text-[120px] sm:text-[160px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 leading-none select-none">
                    404
                </h1>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2 mb-4">
                    Page Not Found
                </h2>

                <p className="text-gray-600 text-base sm:text-lg mb-8 leading-relaxed">
                    Oops! The page you're looking for doesn't exist or may have been moved.
                    Let's get you back on track.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 border-2 border-gray-300 font-semibold py-3 px-6 rounded-full shadow-sm hover:border-orange-400 hover:text-orange-600 transition transform hover:-translate-y-0.5"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
                    >
                        <Home className="w-5 h-5" />
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
