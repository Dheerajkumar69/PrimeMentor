// frontend/components/AdminPanel/SyllabusManagement.jsx

import React from 'react';
import { BookOpen, Edit2, Zap } from 'lucide-react';

const SyllabusRow = ({ item }) => (
    <tr className="border-t hover:bg-indigo-50 transition duration-150">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.subject}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.grades}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-700 font-semibold">{item.alignment}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 flex items-center">
            <Zap className='w-4 h-4 mr-1 text-yellow-600' />
            {item.activeCourses} Active Courses
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button className="text-orange-600 hover:text-orange-900 transition" title="Edit"><Edit2 className="w-5 h-5" /></button>
        </td>
    </tr>
);

export default function SyllabusManagement({ syllabus }) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-700 flex items-center">
                <BookOpen className='w-6 h-6 mr-2 text-blue-500' /> Curriculum and Syllabus Alignment
            </h2>
            <p className='text-gray-600'>Manage the subjects, grade alignment, and content framework used by the platform.</p>

            <div className="overflow-x-auto border rounded-xl shadow-inner">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grades Covered</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alignment Body</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Programs</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {syllabus.length > 0 ? (
                            syllabus.map((item) => (
                                <SyllabusRow key={item.id} item={item} />
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500 italic">No syllabus frameworks defined.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}