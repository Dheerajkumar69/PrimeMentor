// src/context/AppContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    // ── Teacher state (unchanged) ──
    const [showTeacherLogin, setShowTeacherLogin] = useState(false);
    const [teacherToken, setTeacherToken] = useState(localStorage.getItem('teacherToken') || null);
    const [teacherData, setTeacherData] = useState(null);

    // ── Admin state (unchanged) ──
    const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken') || null);

    // ── Student state (replaces Clerk) ──
    const [showStudentLogin, setShowStudentLogin] = useState(false);
    const [studentToken, setStudentToken] = useState(localStorage.getItem('studentToken') || null);
    const [studentData, setStudentData] = useState(null);
    // true while we're verifying an existing token on page load
    const [studentLoading, setStudentLoading] = useState(!!localStorage.getItem('studentToken'));

    // isSignedIn derived from studentToken
    const isSignedIn = !!studentToken && !!studentData;

    // Sync adminToken to localStorage
    useEffect(() => {
        if (adminToken) { localStorage.setItem('adminToken', adminToken); }
        else { localStorage.removeItem('adminToken'); }
    }, [adminToken]);

    // Sync studentToken to localStorage
    useEffect(() => {
        if (studentToken) { localStorage.setItem('studentToken', studentToken); }
        else { localStorage.removeItem('studentToken'); }
    }, [studentToken]);

    // Re-hydrate teacher session
    useEffect(() => {
        if (!teacherToken || !backendUrl) { setTeacherData(null); return; }
        if (teacherData) return;
        const fetchTeacher = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/teacher/me`, {
                    headers: { Authorization: `Bearer ${teacherToken}` },
                });
                if (data.success) { setTeacherData(data.teacher); }
                else { setTeacherToken(null); setTeacherData(null); localStorage.removeItem('teacherToken'); }
            } catch {
                setTeacherToken(null); setTeacherData(null); localStorage.removeItem('teacherToken');
            }
        };
        fetchTeacher();
    }, [teacherToken, backendUrl]); // eslint-disable-line

    // Re-hydrate student session
    useEffect(() => {
        if (!studentToken || !backendUrl) {
            setStudentData(null);
            setStudentLoading(false);
            return;
        }
        if (studentData) {
            setStudentLoading(false);
            return;
        }
        const fetchStudent = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/student/me`, {
                    headers: { Authorization: `Bearer ${studentToken}` },
                });
                if (data.success) { setStudentData(data.student); }
                else { setStudentToken(null); setStudentData(null); localStorage.removeItem('studentToken'); }
            } catch {
                setStudentToken(null); setStudentData(null); localStorage.removeItem('studentToken');
            } finally {
                setStudentLoading(false);
            }
        };
        fetchStudent();
    }, [studentToken, backendUrl]); // eslint-disable-line

    const logoutStudent = () => {
        setStudentToken(null);
        setStudentData(null);
        setStudentLoading(false);
        localStorage.removeItem('studentToken');
    };

    return (
        <AppContext.Provider value={{
            backendUrl,
            // Teacher
            showTeacherLogin, setShowTeacherLogin,
            teacherToken, setTeacherToken,
            teacherData, setTeacherData,
            // Admin
            adminToken, setAdminToken,
            // Student
            showStudentLogin, setShowStudentLogin,
            studentToken, setStudentToken,
            studentData, setStudentData,
            studentLoading,
            logoutStudent,
            isSignedIn,
            // For legacy compatibility — some components use user/userId
            user: studentData,
            userId: studentData?._id || null,
        }}>
            {props.children}
        </AppContext.Provider>
    );
};
