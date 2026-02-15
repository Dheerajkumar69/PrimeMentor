// components/AdminPanel/AdminLogin.jsx

import React, { useState, useContext } from 'react';          // ⬅️ useContext added
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { Shield, LogIn, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { AppContext } from '../../context/AppContext.jsx';    // ⬅️ import context

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function AdminLogin({ setAdminAuthenticated }) { 
    const navigate = useNavigate();
    const { setAdminToken } = useContext(AppContext);         // ⬅️ get setter from context

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); 

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${getBackendUrl()}/api/admin/login`, {
                email,
                password,
            });

            if (response.data.token) {
                // 1) Persist to localStorage (for page refreshes)
                localStorage.setItem('adminAuthenticated', 'true');
                localStorage.setItem('adminToken', response.data.token);

                // 2) 🔥 IMPORTANT: update context so TeacherManagement sees the token immediately
                setAdminToken(response.data.token);

                // 3) Update parent state (your existing behaviour)
                if (setAdminAuthenticated) {
                    setAdminAuthenticated(true);
                }

                // 4) Go to dashboard
                navigate('/admin/dashboard', { replace: true }); 
            } else {
                setError('Login failed: Token missing.');
            }
        } catch (err) {
            console.error('Admin Login Error:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Login failed. Check server logs.');
            setPassword('');
        } finally {
            setLoading(false);
        }
    };
    
    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border-t-4 border-orange-500 transform transition-all duration-300 hover:shadow-orange-200">
                <div className="flex justify-center mb-6">
                    <Shield className="w-12 h-12 text-orange-500" />
                </div>
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Admin Access</h2>
                <p className="text-center text-gray-500 mb-8">
                    Enter credentials for the Prime Mentor management dashboard.
                </p>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="admin123@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150"
                            required
                        />
                    </div>
                    {/* 🛑 MODIFICATION 4: Password field with Eye button */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"} // Conditional type
                                placeholder="admin@123"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 pr-10" // Added pr-10 for button
                                required
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" /> // Icon when password is visible
                                ) : (
                                    <Eye className="h-5 w-5" /> // Icon when password is hidden
                                )}
                            </button>
                        </div>
                    </div>
                    {/* 🛑 END OF MODIFICATION 4 */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-md text-lg font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Logging In...
                            </>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5 mr-2" />
                                Log In
                            </>
                        )}
                    </button>
                </form>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 w-full text-sm text-gray-500 hover:text-orange-500 transition duration-150"
                >
                    &larr; Back to Home
                </button>
            </div>
        </div>
    );
}