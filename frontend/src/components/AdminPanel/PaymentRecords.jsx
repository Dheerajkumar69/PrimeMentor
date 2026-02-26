import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Search, Calendar, CreditCard, ShoppingBag, Download, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// 🛡️ Safe formatting helpers
const safeDate = (d) => {
    try {
        if (!d) return 'N/A';
        const date = new Date(d);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
    } catch { return 'N/A'; }
};

const safeTime = (d) => {
    try {
        if (!d) return '';
        const date = new Date(d);
        return isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return ''; }
};

const safeCurrency = (amount) => {
    const num = Number(amount);
    return Number.isFinite(num) ? `$${num.toFixed(2)}` : '$0.00';
};

export default function PaymentRecords() {
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setFetchError('No admin session found. Please log in again.');
                setPayments([]);
                setSummary(null);
                setIsLoading(false);
                return;
            }
            const res = await axios.get(`${BACKEND_URL}/api/admin/payments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(res.data?.payments || []);
            setSummary(res.data?.summary || null);
            setFetchError(null);
        } catch (error) {
            console.error('Failed to fetch payments:', error);
            const status = error?.response?.status;
            let msg;
            if (status === 401 || status === 403) {
                msg = 'Session expired or unauthorized. Please log out and log in again.';
            } else if (status === 404) {
                msg = 'Payments endpoint not found. The server may need to be redeployed.';
            } else if (!error.response) {
                msg = 'Cannot reach the server. Please check your connection.';
            } else {
                msg = error?.response?.data?.message || error?.message || 'Failed to load payment records';
            }
            toast.error(msg);
            setFetchError(msg);
            setPayments([]);
            setSummary(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!payments || payments.length === 0) return;

        const headers = ['Date', 'Time', 'Student', 'Student Email', 'Course', 'Type', 'Status', 'Amount', 'Currency', 'Transaction ID', 'Promo Code', 'Discount Applied', 'Failure Reason'];
        const csvRows = [headers.join(',')];

        payments.forEach(p => {
            const row = [
                new Date(p.createdAt).toLocaleDateString(),
                new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                `"${p.studentDetails?.firstName || ''} ${p.studentDetails?.lastName || ''}"`,
                `"${p.studentDetails?.email || ''}"`,
                `"${p.courseTitle || ''}"`,
                p.purchaseType,
                p.paymentStatus || 'paid',
                p.amountPaid,
                p.currency || 'AUD',
                p.transactionId,
                p.promoCodeUsed || 'None',
                p.discountApplied || 0,
                `"${p.failureReason || ''}"`,
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment_records_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredPayments = (payments || []).filter(p => {
        if (!p) return false;
        const term = (searchTerm || '').toLowerCase();

        const matchesSearch = !term ||
            (p.studentDetails?.firstName || '').toLowerCase().includes(term) ||
            (p.studentDetails?.lastName || '').toLowerCase().includes(term) ||
            (p.studentDetails?.email || '').toLowerCase().includes(term) ||
            (p.studentName || '').toLowerCase().includes(term) ||
            (p.transactionId || '').toLowerCase().includes(term) ||
            (p.courseTitle || '').toLowerCase().includes(term);

        const matchesType = filterType === 'ALL' || p.purchaseType === filterType;
        const matchesStatus = filterStatus === 'ALL' || p.paymentStatus === filterStatus;

        return matchesSearch && matchesType && matchesStatus;
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <p className="ml-4 text-gray-500">Loading payment records...</p>
            </div>
        );
    }

    if (fetchError && payments.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-red-300 mb-3" />
                <p className="text-lg font-medium text-red-600 mb-2">Failed to load payments</p>
                <p className="text-sm text-gray-500 mb-4">{fetchError}</p>
                <button
                    onClick={fetchPayments}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <DollarSign className="w-6 h-6 mr-2 text-green-500" />
                    Payments Received
                </h2>
                <button
                    onClick={handleExportCSV}
                    className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex items-center">
                        <div className="rounded-full bg-green-100 p-3 mr-4">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-green-800">${summary.totalRevenue}</h3>
                        </div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-center">
                        <div className="rounded-full bg-blue-100 p-3 mr-4">
                            <ShoppingBag className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Total Transactions</p>
                            <h3 className="text-2xl font-bold text-blue-800">{summary.totalCount}</h3>
                        </div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 flex items-center">
                        <div className="rounded-full bg-orange-100 p-3 mr-4">
                            <Calendar className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-orange-600 font-medium">Trial Sessions</p>
                            <h3 className="text-2xl font-bold text-orange-800">{summary.trialCount}</h3>
                        </div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 flex items-center">
                        <div className="rounded-full bg-purple-100 p-3 mr-4">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Starter Packs</p>
                            <h3 className="text-2xl font-bold text-purple-800">{summary.starterPackCount}</h3>
                        </div>
                    </div>
                    {summary.failedCount > 0 && (
                        <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex items-center">
                            <div className="rounded-full bg-red-100 p-3 mr-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-red-600 font-medium">Failed Payments</p>
                                <h3 className="text-2xl font-bold text-red-800">{summary.failedCount}</h3>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by student, email, course, or transaction ID..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="ALL">All Types</option>
                    <option value="TRIAL">Trial Sessions</option>
                    <option value="STARTER_PACK">Starter Packs</option>
                </select>
                <select
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="ALL">All Statuses</option>
                    <option value="paid">✅ Paid</option>
                    <option value="failed">❌ Failed</option>
                </select>
            </div>

            {/* Payments Table */}
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promo</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPayments.length > 0 ? (
                            filteredPayments.map((payment) => (
                                <tr key={payment._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{safeDate(payment.createdAt)}</div>
                                        <div className="text-xs text-gray-500">{safeTime(payment.createdAt)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {payment.studentDetails?.firstName || payment.studentName?.split(' ')[0] || 'N/A'} {payment.studentDetails?.lastName || payment.studentName?.split(' ').slice(1).join(' ') || ''}
                                        </div>
                                        <div className="text-sm text-gray-500">{payment.studentDetails?.email || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{payment.courseTitle}</div>
                                        <div className="text-xs text-gray-500">{payment.subject}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.purchaseType === 'STARTER_PACK' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                                            }`}>
                                            {payment.purchaseType === 'STARTER_PACK' ? 'Starter Pack' : 'Trial'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.paymentStatus === 'failed'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'
                                            }`}>
                                            {payment.paymentStatus === 'failed' ? '❌ Failed' : '✅ Paid'}
                                        </span>
                                        {payment.paymentStatus === 'failed' && payment.failureReason && (
                                            <div className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={payment.failureReason}>
                                                {payment.failureReason}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{safeCurrency(payment.amountPaid)} {payment.currency || 'AUD'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                        {payment.transactionId || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {payment.promoCodeUsed ? (
                                            <div>
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">
                                                    {payment.promoCodeUsed}
                                                </span>
                                                {payment.discountApplied > 0 && (
                                                    <div className="text-xs text-green-600 mt-1">
                                                        Saved ${payment.discountApplied}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="px-6 py-10 text-center text-gray-500">
                                    <CreditCard className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                    <p className="text-lg font-medium">No payments found</p>
                                    <p className="text-sm">Try adjusting your search or filters.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
