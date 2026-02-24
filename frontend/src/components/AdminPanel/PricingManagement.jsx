// frontend/src/components/AdminPanel/PricingManagement.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Save, Loader, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function PricingManagement() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Pricing state
    const [classRanges, setClassRanges] = useState({
        '2-6': { sessionPrice: 0, originalPrice: 0 },
        '7-9': { sessionPrice: 0, originalPrice: 0 },
        '10-12': { sessionPrice: 0, originalPrice: 0 },
    });
    const [starterPack, setStarterPack] = useState({
        numberOfSessions: 6,
        fixedDiscount: 5,
    });
    const [lastUpdated, setLastUpdated] = useState(null);

    // Fetch pricing on mount
    const fetchPricing = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${BACKEND_URL}/api/admin/pricing`);
            const data = response.data;
            setClassRanges(data.classRanges);
            setStarterPack(data.starterPack);
            setLastUpdated(data.updatedAt);
        } catch (err) {
            console.error('Failed to fetch pricing:', err);
            setError('Failed to load pricing data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPricing();
    }, [fetchPricing]);

    // Handle class range price change
    const handleRangeChange = (range, field, value) => {
        const numValue = parseFloat(value) || 0;
        setClassRanges(prev => ({
            ...prev,
            [range]: {
                ...prev[range],
                [field]: numValue,
            }
        }));
    };

    // Handle starter pack change
    const handleStarterPackChange = (field, value) => {
        const numValue = parseFloat(value) || 0;
        setStarterPack(prev => ({
            ...prev,
            [field]: numValue,
        }));
    };

    // Save pricing
    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const token = localStorage.getItem('adminToken');
            await axios.put(`${BACKEND_URL}/api/admin/pricing`,
                { classRanges, starterPack },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess('Pricing updated successfully! Changes are now live across the website.');
            setLastUpdated(new Date().toISOString());

            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            console.error('Failed to save pricing:', err);
            setError(err.response?.data?.message || 'Failed to save pricing.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader className="w-8 h-8 text-orange-500 animate-spin" />
                <span className="ml-3 text-gray-600">Loading pricing...</span>
            </div>
        );
    }

    const rangeLabels = {
        '2-6': { label: 'Class 2–6 (Primary)', color: 'border-green-400', bg: 'bg-green-50' },
        '7-9': { label: 'Class 7–9 (Middle School)', color: 'border-blue-400', bg: 'bg-blue-50' },
        '10-12': { label: 'Class 10–12 (High School)', color: 'border-red-400', bg: 'bg-red-50' },
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <DollarSign className="w-6 h-6 mr-2 text-green-600" />
                        Pricing Management
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Changes here will reflect across the entire website immediately.
                    </p>
                    {lastUpdated && (
                        <p className="text-xs text-gray-400 mt-1">
                            Last updated: {new Date(lastUpdated).toLocaleString()}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-6 py-2.5 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                    {saving ? (
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save All Prices'}
                </button>
            </div>

            {/* Status Messages */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
                    <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    {success}
                </div>
            )}

            {/* Class Range Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(rangeLabels).map(([range, meta]) => (
                    <div key={range} className={`p-6 rounded-xl border-2 ${meta.color} ${meta.bg} shadow-sm`}>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">{meta.label}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Session Price (AUD $)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={classRanges[range]?.sessionPrice || 0}
                                        onChange={(e) => handleRangeChange(range, 'sessionPrice', e.target.value)}
                                        className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-lg font-semibold"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">The discounted price students pay per session</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Original Price (AUD $)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={classRanges[range]?.originalPrice || 0}
                                        onChange={(e) => handleRangeChange(range, 'originalPrice', e.target.value)}
                                        className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-lg font-semibold"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">The strikethrough/before-discount price</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Starter Pack Settings */}
            <div className="p-6 rounded-xl border-2 border-purple-300 bg-purple-50 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-purple-600" />
                    Starter Pack Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Sessions
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={starterPack.numberOfSessions}
                            onChange={(e) => handleStarterPackChange('numberOfSessions', e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-lg font-semibold"
                        />
                        <p className="text-xs text-gray-500 mt-1">How many sessions are included in the starter pack</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fixed Discount (AUD $)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={starterPack.fixedDiscount}
                                onChange={(e) => handleStarterPackChange('fixedDiscount', e.target.value)}
                                className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-lg font-semibold"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Fixed dollar discount applied to the starter pack total</p>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="p-6 rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">💡 Price Preview</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-300">
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">Class Range</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">Session Price</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">Original Price</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">Starter Pack Total</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">After ${starterPack.fixedDiscount} Discount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(classRanges).map(([range, prices]) => {
                                const total = prices.sessionPrice * starterPack.numberOfSessions;
                                const afterDiscount = total - starterPack.fixedDiscount;
                                return (
                                    <tr key={range} className="border-b border-gray-200">
                                        <td className="py-2 px-3 font-medium">Class {range}</td>
                                        <td className="py-2 px-3 text-right text-green-700 font-semibold">${prices.sessionPrice.toFixed(2)}</td>
                                        <td className="py-2 px-3 text-right text-gray-500 line-through">${prices.originalPrice.toFixed(2)}</td>
                                        <td className="py-2 px-3 text-right">${total.toFixed(2)}</td>
                                        <td className="py-2 px-3 text-right text-red-600 font-bold">${afterDiscount.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
