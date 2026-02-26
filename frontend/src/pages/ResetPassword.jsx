// frontend/src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    // If no token, redirect home
    useEffect(() => {
        if (!token) {
            toast.error('Invalid or missing reset link.');
            navigate('/', { replace: true });
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            return setError('Password must be at least 8 characters.');
        }
        if (password !== confirm) {
            return setError('Passwords do not match.');
        }

        setLoading(true);
        try {
            const { data } = await axios.post(`${BACKEND_URL}/api/student/reset-password`, {
                token,
                password,
            });
            if (data.success) {
                setDone(true);
                toast.success('Password reset! You can now log in.');
                setTimeout(() => navigate('/', { replace: true }), 2500);
            } else {
                setError(data.message || 'Reset failed.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-[80px]">
                <div className="bg-white p-10 rounded-xl shadow-xl text-center max-w-sm w-full">
                    <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset!</h2>
                    <p className="text-gray-500 text-sm">Redirecting you to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-[80px] px-4">
            <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-10 rounded-xl shadow-xl max-w-sm w-full">
                <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Set New Password</h1>
                <p className="text-sm text-center text-gray-400 mb-6">Enter your new password below.</p>

                <div className="space-y-4">
                    <div className="border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-orange-400 transition">
                        <Lock size={18} className="text-gray-400" />
                        <input
                            type={showPw ? 'text' : 'password'}
                            placeholder="New password (min 8 chars)"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="outline-none text-sm w-full"
                        />
                        <button type="button" onClick={() => setShowPw(p => !p)} className="text-gray-400 hover:text-orange-500">
                            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="border px-4 py-2 flex items-center gap-2 rounded-full focus-within:border-orange-400 transition">
                        <Lock size={18} className="text-gray-400" />
                        <input
                            type={showPw ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            className="outline-none text-sm w-full"
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
                >
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>

                <p className="mt-4 text-xs text-center text-gray-400">
                    Remembered it?{' '}
                    <button type="button" onClick={() => navigate('/')} className="text-orange-500 hover:underline">
                        Go to Login
                    </button>
                </p>
            </form>
        </div>
    );
};

export default ResetPassword;
