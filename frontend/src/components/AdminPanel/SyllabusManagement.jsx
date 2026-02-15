// frontend/src/components/AdminPanel/SyllabusManagement.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Trash2, FileText, X, Loader2, AlertCircle, Upload } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function SyllabusManagement() {
    const [syllabi, setSyllabi] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Form state
    const [subject, setSubject] = useState('');
    const [grade, setGrade] = useState('');
    const [board, setBoard] = useState('');
    const [description, setDescription] = useState('');
    const [pdfFile, setPdfFile] = useState(null);

    const token = localStorage.getItem('adminToken');

    const fetchSyllabi = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await axios.get(`${BACKEND_URL}/api/admin/syllabus`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSyllabi(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch syllabus data.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchSyllabi();
    }, [fetchSyllabi]);

    const resetForm = () => {
        setSubject('');
        setGrade('');
        setBoard('');
        setDescription('');
        setPdfFile(null);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!subject || !grade || !board || !pdfFile) return;

        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('grade', grade);
        formData.append('board', board);
        formData.append('description', description);
        formData.append('pdfFile', pdfFile);

        try {
            setSubmitting(true);
            await axios.post(`${BACKEND_URL}/api/admin/syllabus`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            resetForm();
            setShowModal(false);
            fetchSyllabi();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add syllabus.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this syllabus?')) return;

        try {
            setDeleteId(id);
            await axios.delete(`${BACKEND_URL}/api/admin/syllabus/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchSyllabi();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete syllabus.');
        } finally {
            setDeleteId(null);
        }
    };

    const openPdf = (filename) => {
        window.open(`${BACKEND_URL}/images/${filename}`, '_blank');
    };

    // ─── Loading & Error States ──────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-gray-500">
                <Loader2 className="w-6 h-6 mr-2 animate-spin" /> Loading syllabus…
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-20 text-red-500">
                <AlertCircle className="w-6 h-6 mr-2" /> {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-700 flex items-center">
                        <BookOpen className="w-6 h-6 mr-2 text-blue-500" /> Syllabus Management
                    </h2>
                    <p className="text-gray-500 mt-1">Upload and manage subject syllabi as PDFs.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-semibold"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Syllabus
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border rounded-xl shadow-inner">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Board</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PDF</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {syllabi.length > 0 ? (
                            syllabi.map((item) => (
                                <tr key={item._id} className="border-t hover:bg-indigo-50 transition duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.subject}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.grade}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-700 font-semibold">{item.board}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={item.description}>{item.description || '—'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => openPdf(item.pdfFile)}
                                            className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium transition"
                                            title="Open PDF"
                                        >
                                            <FileText className="w-4 h-4 mr-1" /> View PDF
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            disabled={deleteId === item._id}
                                            className="flex items-center text-sm text-red-500 hover:text-red-700 font-medium transition disabled:opacity-50"
                                            title="Delete"
                                        >
                                            {deleteId === item._id ? (
                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4 mr-1" />
                                            )}
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-10 text-center text-gray-400 italic">
                                    No syllabus entries yet. Click "Add Syllabus" to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ─── Add Syllabus Modal ─── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-in">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                <Plus className="w-5 h-5 mr-2 text-blue-500" /> Add New Syllabus
                            </h3>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Mathematics"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                                    <input
                                        type="text"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        placeholder="e.g. Year 7-12"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Board *</label>
                                    <input
                                        type="text"
                                        value={board}
                                        onChange={(e) => setBoard(e.target.value)}
                                        placeholder="e.g. VCAA, NESA"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional short description..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Syllabus PDF *</label>
                                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                                    <Upload className="w-5 h-5 mr-2 text-gray-400" />
                                    <span className="text-sm text-gray-500">
                                        {pdfFile ? pdfFile.name : 'Click to select a PDF file'}
                                    </span>
                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={(e) => setPdfFile(e.target.files[0] || null)}
                                        className="hidden"
                                        required
                                    />
                                </label>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !subject || !grade || !board || !pdfFile}
                                    className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                                    ) : (
                                        'Add Syllabus'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}