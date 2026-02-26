// frontend/src/components/StudentPanel/StudentLogin.jsx

import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext.jsx';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const StudentLogin = ({ setShowStudentLogin }) => {
    const { backendUrl, setStudentToken, setStudentData } = useContext(AppContext);
    const [state, setState] = useState('Login');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const apiBase = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

            if (state === 'Login') {
                const { data } = await axios.post(`${apiBase}/api/student/login`, {
                    email: formData.email,
                    password: formData.password,
                });
                if (data.success) {
                    setStudentData(data.student);
                    setStudentToken(data.token);
                    localStorage.setItem('studentToken', data.token);
                    setShowStudentLogin(false);
                    toast.success('Logged in successfully!');
                } else {
                    toast.error(data.message);
                }
            } else {
                const { data } = await axios.post(`${apiBase}/api/student/register`, {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                });
                if (data.success) {
                    setStudentData(data.student);
                    setStudentToken(data.token);
                    localStorage.setItem('studentToken', data.token);
                    setShowStudentLogin(false);
                    toast.success('Account created! Welcome to PrimeMentor.');
                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        const email = prompt('Enter your email address to receive a reset link:');
        if (!email?.trim()) return;
        try {
            const apiBase = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const { data } = await axios.post(`${apiBase}/api/student/forgot-password`, { email });
            toast.success(data.message || 'Reset link sent if account exists.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reset link.');
        }
    };

    const switchState = (newState) => {
        setState(newState);
        setFormData({ name: '', email: '', password: '' });
        setShowPassword(false);
    };

    return (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/30 flex justify-center items-center p-4">
            <form
                onSubmit={handleSubmit}
                className="relative bg-white p-6 sm:p-10 rounded-xl shadow-2xl text-slate-500 max-w-sm sm:max-w-md w-full"
            >
                <h1 className="text-center text-xl sm:text-2xl text-neutral-700 font-bold mb-2">
                    {state === 'Login' ? 'Student Login' : 'Create Student Account'}
                </h1>
                <p className="text-sm text-center mb-6 text-gray-400">
                    {state === 'Login' ? 'Welcome back! Sign in to continue.' : 'Join PrimeMentor today.'}
                </p>

                <div className="space-y-4">
                    {state === 'Sign Up' && (
                        <div className="border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-orange-400 transition">
                            <User size={18} className="text-gray-400" />
                            <input
                                className="outline-none text-sm w-full"
                                type="text"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                required
                            />
                        </div>
                    )}

                    <div className="border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-orange-400 transition">
                        <Mail size={18} className="text-gray-400" />
                        <input
                            className="outline-none text-sm w-full"
                            type="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-orange-400 transition">
                        <Lock size={18} className="text-gray-400" />
                        <input
                            className="outline-none text-sm w-full"
                            type={showPassword ? 'text' : 'password'}
                            placeholder={state === 'Login' ? 'Password' : 'Create Password (min 8 chars)'}
                            value={formData.password}
                            onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                            required
                        />
                        <button type="button" onClick={() => setShowPassword(p => !p)} className="text-gray-400 hover:text-orange-500 transition">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {state === 'Login' && (
                        <p className="text-right text-xs">
                            <span onClick={handleForgotPassword} className="text-orange-500 cursor-pointer hover:underline font-medium">
                                Forgot Password?
                            </span>
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
                >
                    {loading ? 'Please wait...' : state === 'Login' ? 'Login' : 'Create Account'}
                </button>

                {state === 'Login'
                    ? <p className="mt-5 text-xs text-center">Don't have an account?{' '}
                        <span className="text-orange-500 cursor-pointer font-medium hover:underline" onClick={() => switchState('Sign Up')}>Sign Up</span>
                    </p>
                    : <p className="mt-5 text-xs text-center">Already have an account?{' '}
                        <span className="text-orange-500 cursor-pointer font-medium hover:underline" onClick={() => switchState('Login')}>Login</span>
                    </p>
                }

                <button
                    type="button"
                    onClick={() => setShowStudentLogin(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-900 transition"
                >
                    <X size={20} />
                </button>
            </form>
        </div>
    );
};

export default StudentLogin;
