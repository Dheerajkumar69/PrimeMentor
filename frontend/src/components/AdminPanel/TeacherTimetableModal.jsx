// frontend/src/components/AdminPanel/TeacherTimetableModal.jsx

import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import {
    X, ChevronLeft, ChevronRight, Calendar, Clock, BookOpen,
    User, Loader2, Video, AlertCircle
} from 'lucide-react';
import { AppContext } from '../../context/AppContext.jsx';

// ======================== CONSTANTS ========================
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ======================== HELPERS ========================

/** Get Monday of the week containing `date` */
const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

/** Format date as YYYY-MM-DD */
const fmtDate = (d) => d.toISOString().split('T')[0];

/** Format date as "Feb 18" */
const fmtShort = (d) => d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });

/** Parse time string "14:30" or "2:30 PM" → decimal hours (e.g. 14.5) */
const parseTimeToDecimal = (timeStr) => {
    if (!timeStr) return null;
    const trimmed = timeStr.trim();

    // HH:MM 24h
    const m24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (m24) return parseInt(m24[1], 10) + parseInt(m24[2], 10) / 60;

    // h:mm AM/PM
    const m12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m12) {
        let h = parseInt(m12[1], 10);
        const min = parseInt(m12[2], 10);
        const p = m12[3].toUpperCase();
        if (p === 'PM' && h !== 12) h += 12;
        if (p === 'AM' && h === 12) h = 0;
        return h + min / 60;
    }
    return null;
};

/** Extract start time from range like "3:00 PM - 4:00 PM" */
const extractStart = (s) => {
    if (!s) return null;
    const parts = s.split(/\s*-\s*/);
    return parseTimeToDecimal(parts[0]);
};

/** Get the date string for a weekday offset from monday */
const weekDate = (monday, dayIdx) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + dayIdx);
    return fmtDate(d);
};

// ======================== SLOT BLOCK COMPONENT ========================
const SlotBlock = ({ slot, hourStart }) => {
    const startDecimal = slot.type === 'assessment'
        ? parseTimeToDecimal(slot.time)
        : extractStart(slot.time);

    if (startDecimal === null) return null;

    const duration = slot.type === 'assessment' ? 0.5 : 1; // 30min vs 60min
    const top = ((startDecimal - hourStart) * 64); // 64px per hour
    const height = duration * 64;

    if (top < 0 || top > 13 * 64) return null;

    const isAssessment = slot.type === 'assessment';
    const bgClass = isAssessment
        ? 'bg-emerald-500/90 hover:bg-emerald-600 border-emerald-600'
        : 'bg-blue-500/90 hover:bg-blue-600 border-blue-600';

    return (
        <div
            className={`absolute left-0.5 right-0.5 rounded-md border text-white text-[10px] leading-tight px-1.5 py-0.5 overflow-hidden cursor-default transition-colors shadow-sm ${bgClass}`}
            style={{ top: `${top}px`, height: `${Math.max(height, 20)}px` }}
            title={`${slot.title}\n${slot.studentName}\n${slot.time}`}
        >
            <p className="font-semibold truncate">{slot.title}</p>
            {height >= 30 && (
                <p className="truncate opacity-90">{slot.studentName}</p>
            )}
            {height >= 45 && (
                <p className="truncate opacity-75 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 inline" /> {slot.time}
                </p>
            )}
        </div>
    );
};

// ======================== MAIN MODAL ========================
export default function TeacherTimetableModal({ teacherId, teacherName, onClose }) {
    const { backendUrl, adminToken } = useContext(AppContext);
    const [schedule, setSchedule] = useState([]);
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [weekStart, setWeekStart] = useState(getMonday(new Date()));

    // Fetch schedule
    useEffect(() => {
        if (!teacherId || !backendUrl) return;
        setLoading(true);
        setError(null);

        const fetchSchedule = async () => {
            try {
                const res = await axios.get(
                    `${backendUrl}/api/admin/teacher/${teacherId}/schedule`,
                    { headers: { Authorization: `Bearer ${adminToken}` } }
                );
                setTeacher(res.data.teacher);
                setSchedule(res.data.schedule || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch schedule.');
                console.error('Schedule fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [teacherId, backendUrl, adminToken]);

    // Navigate weeks
    const prevWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        setWeekStart(d);
    };
    const nextWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        setWeekStart(d);
    };
    const goToToday = () => setWeekStart(getMonday(new Date()));

    // Group schedule items by day-of-week for the current week
    const slotsByDay = useMemo(() => {
        const map = {};
        DAYS.forEach((_, i) => { map[i] = []; });

        const weekEndDate = new Date(weekStart);
        weekEndDate.setDate(weekEndDate.getDate() + 7);

        schedule.forEach(slot => {
            if (!slot.date) return;
            const slotDate = new Date(slot.date);
            // Check if this slot falls within the current week
            if (slotDate >= weekStart && slotDate < weekEndDate) {
                const day = slotDate.getDay();
                const dayIdx = day === 0 ? 6 : day - 1; // Mon=0, Sun=6
                map[dayIdx].push(slot);
            }
        });

        return map;
    }, [schedule, weekStart]);

    // Count totals
    const totalClasses = schedule.filter(s => s.type === 'class').length;
    const totalAssessments = schedule.filter(s => s.type === 'assessment').length;

    // Format week range
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekLabel = `${fmtShort(weekStart)} — ${fmtShort(weekEnd)}`;

    if (!teacherId) return null;

    return (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/40 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden">
                {/* ---- Header ---- */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {teacherName || teacher?.name || 'Teacher'}'s Timetable
                            </h2>
                            <p className="text-sm text-gray-500">
                                {totalClasses} class{totalClasses !== 1 ? 'es' : ''} · {totalAssessments} assessment{totalAssessments !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition p-1 rounded-lg hover:bg-gray-100" aria-label="Close">
                        <X size={22} />
                    </button>
                </div>

                {/* ---- Week Navigation ---- */}
                <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50">
                    <button onClick={prevWeek} className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-indigo-600 transition">
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-800">{weekLabel}</span>
                        <button onClick={goToToday} className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium transition">
                            Today
                        </button>
                    </div>
                    <button onClick={nextWeek} className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-indigo-600 transition">
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* ---- Legend ---- */}
                <div className="flex items-center gap-6 px-6 py-2 border-b text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-blue-500" /> Regular Class (1hr)
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Free Assessment (30m)
                    </span>
                </div>

                {/* ---- Body / Calendar Grid ---- */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            <span className="ml-3 text-gray-500">Loading schedule…</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 text-red-500">
                            <AlertCircle className="w-8 h-8 mb-2" />
                            <p className="font-medium">{error}</p>
                        </div>
                    ) : (
                        <div className="flex min-w-[700px]">
                            {/* Time column */}
                            <div className="w-16 flex-shrink-0 border-r bg-gray-50">
                                <div className="h-10 border-b" /> {/* header spacer */}
                                {HOURS.map(h => (
                                    <div key={h} className="h-16 flex items-start justify-end pr-2 pt-0.5 text-[11px] text-gray-400 font-medium border-b border-gray-100">
                                        {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                                    </div>
                                ))}
                            </div>

                            {/* Day columns */}
                            {DAYS.map((day, i) => {
                                const dateStr = weekDate(weekStart, i);
                                const isToday = dateStr === fmtDate(new Date());
                                const daySlots = slotsByDay[i] || [];

                                return (
                                    <div key={day} className={`flex-1 min-w-[85px] border-r last:border-r-0 ${isToday ? 'bg-indigo-50/40' : ''}`}>
                                        {/* Day header */}
                                        <div className={`h-10 text-center text-xs font-semibold border-b flex flex-col items-center justify-center ${isToday ? 'text-indigo-700 bg-indigo-100/60' : 'text-gray-600'}`}>
                                            <span>{day}</span>
                                            <span className="text-[10px] font-normal text-gray-400">{fmtShort(new Date(weekStart.getTime() + i * 86400000))}</span>
                                        </div>

                                        {/* Time grid */}
                                        <div className="relative" style={{ height: `${HOURS.length * 64}px` }}>
                                            {/* Hour lines */}
                                            {HOURS.map((h, idx) => (
                                                <div key={h} className="absolute left-0 right-0 border-b border-gray-100" style={{ top: `${idx * 64}px`, height: '64px' }} />
                                            ))}

                                            {/* Slot blocks */}
                                            {daySlots.map((slot, idx) => (
                                                <SlotBlock key={`${slot.id}-${idx}`} slot={slot} hourStart={HOURS[0]} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ---- Footer / List View ---- */}
                {!loading && !error && schedule.length > 0 && (
                    <div className="border-t px-6 py-3 bg-gray-50 max-h-40 overflow-y-auto">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">All Scheduled Items ({schedule.length})</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {schedule.map((slot, i) => (
                                <div key={`${slot.id}-${i}`} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${slot.type === 'assessment' ? 'bg-emerald-50 border border-emerald-200' : 'bg-blue-50 border border-blue-200'}`}>
                                    {slot.type === 'assessment'
                                        ? <Video className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                        : <BookOpen className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                    }
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-700 truncate">{slot.title}</p>
                                        <p className="text-gray-500 truncate">
                                            {slot.date || 'No date'} · {slot.time || 'No time'} · {slot.studentName}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!loading && !error && schedule.length === 0 && (
                    <div className="border-t px-6 py-6 text-center text-sm text-gray-400">
                        <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        No classes or assessments scheduled for this teacher.
                    </div>
                )}
            </div>
        </div>
    );
}
