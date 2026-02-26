// frontend/src/components/AdminPanel/PastClassSubmissions.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { BookOpenText, Clock, Calendar, CheckCircle, AlertTriangle, History, Search, Filter, ArrowUpDown, X } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const PastClassSubmissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter / search / sort state
    const [searchQuery, setSearchQuery] = useState('');
    const [teacherFilter, setTeacherFilter] = useState('');
    const [studentFilter, setStudentFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

    const fetchSubmissions = useCallback(async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            setError('Admin not authenticated. Please log in.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${BACKEND_URL}/api/admin/past-classes`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setSubmissions(response.data);
        } catch (err) {
            console.error('Error fetching past class submissions:', err);
            setError(err.response?.data?.message || 'Failed to fetch class submissions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    // Unique teacher & student names for dropdown filters
    const uniqueTeachers = useMemo(() => {
        const names = [...new Set(submissions.map(s => s.teacherName).filter(Boolean))];
        return names.sort((a, b) => a.localeCompare(b));
    }, [submissions]);

    const uniqueStudents = useMemo(() => {
        const names = [...new Set(submissions.map(s => s.studentName).filter(Boolean))];
        return names.sort((a, b) => a.localeCompare(b));
    }, [submissions]);

    // Filtered + sorted submissions
    const filteredSubmissions = useMemo(() => {
        let result = [...submissions];

        // Text search across topic, teacherName, studentName, subTopic
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(s =>
                (s.topic || '').toLowerCase().includes(q) ||
                (s.teacherName || '').toLowerCase().includes(q) ||
                (s.studentName || '').toLowerCase().includes(q) ||
                (s.subTopic || '').toLowerCase().includes(q)
            );
        }

        // Teacher dropdown filter
        if (teacherFilter) {
            result = result.filter(s => s.teacherName === teacherFilter);
        }

        // Student dropdown filter
        if (studentFilter) {
            result = result.filter(s => s.studentName === studentFilter);
        }

        // Sort by sessionDate
        result.sort((a, b) => {
            const dateA = new Date(a.sessionDate || 0);
            const dateB = new Date(b.sessionDate || 0);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [submissions, searchQuery, teacherFilter, studentFilter, sortOrder]);

    const hasActiveFilters = searchQuery || teacherFilter || studentFilter;

    const clearFilters = () => {
        setSearchQuery('');
        setTeacherFilter('');
        setStudentFilter('');
        setSortOrder('newest');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const PastClassCard = ({ submission }) => (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition duration-150">
            <div className="flex justify-between items-start border-b pb-2 mb-2">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <BookOpenText className="w-5 h-5 mr-2 text-blue-500" />
                    {submission.topic}
                </h3>
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    NEW SUBMISSION
                </span>
            </div>

            <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Teacher:</strong> <span className='font-medium text-gray-800'>{submission.teacherName}</span></p>
                <p><strong>Student:</strong> <span className='font-medium text-gray-800'>{submission.studentName}</span></p>

                <div className='flex items-center pt-1'>
                    <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                    <p><strong>Date:</strong> {formatDate(submission.sessionDate)}</p>
                </div>

                <div className='flex items-center'>
                    <Clock className="w-4 h-4 mr-2 text-green-500" />
                    <p><strong>Time/Duration:</strong> {submission.sessionTime} ({submission.duration})</p>
                </div>

                <p className="pt-2 text-xs text-gray-500">
                    <span className="font-semibold">Sub-Topic:</span> {submission.subTopic || 'Not provided'}
                </p>

                <p className="text-xs text-right text-gray-400 pt-2 border-t mt-2">
                    Submitted: {formatDate(submission.submissionDate)}
                </p>
            </div>
        </div>
    );

    if (loading) {
        return <div className="text-center py-10 text-gray-500">Loading past class submissions...</div>;
    }

    if (error) {
        return (
            <div className="text-center py-10 bg-red-50 border border-red-300 rounded-lg mx-auto max-w-lg">
                <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                <p className="text-red-700 font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
                <History className="w-6 h-6 mr-3 text-red-500" />
                Teacher Past Class Submissions
            </h2>

            {/* ─── Filter / Search / Sort Toolbar ─── */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by topic, teacher, student, sub-topic..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                    </div>

                    {/* Teacher Filter */}
                    <div className="relative min-w-[160px]">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                            value={teacherFilter}
                            onChange={(e) => setTeacherFilter(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none cursor-pointer"
                        >
                            <option value="">All Teachers</option>
                            {uniqueTeachers.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Student Filter */}
                    <div className="relative min-w-[160px]">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                            value={studentFilter}
                            onChange={(e) => setStudentFilter(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none cursor-pointer"
                        >
                            <option value="">All Students</option>
                            {uniqueStudents.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort Toggle */}
                    <button
                        onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition cursor-pointer"
                        title="Toggle sort order"
                    >
                        <ArrowUpDown className="w-4 h-4 text-gray-500" />
                        {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                    </button>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg bg-red-50 hover:bg-red-100 transition cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* ─── Results Count ─── */}
            <div className="mb-4 text-gray-600 font-medium">
                {hasActiveFilters ? (
                    <>
                        Showing: <span className="text-xl font-bold text-blue-600">{filteredSubmissions.length}</span>
                        <span className="text-sm text-gray-400 ml-1">of {submissions.length} submissions</span>
                    </>
                ) : (
                    <>
                        Total Submissions: <span className="text-xl font-bold text-blue-600">{submissions.length}</span>
                    </>
                )}
            </div>

            {filteredSubmissions.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                    <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-3" />
                    <p className="text-lg text-gray-600 font-medium">
                        {hasActiveFilters ? 'No submissions match your filters.' : 'No past class submissions found.'}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="mt-3 text-sm text-blue-600 hover:underline cursor-pointer"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSubmissions.map((submission) => (
                        <PastClassCard key={submission._id} submission={submission} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PastClassSubmissions;