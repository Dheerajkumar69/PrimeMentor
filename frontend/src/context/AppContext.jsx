// src/context/AppContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth();
    const { user } = useUser();

    const [showTeacherLogin, setShowTeacherLogin] = useState(false);
    const [teacherToken, setTeacherToken] = useState(
        localStorage.getItem('teacherToken') || null
    );
    const [teacherData, setTeacherData] = useState(null);

    // ✅ make adminToken stateful & synced with localStorage
    const [adminToken, setAdminToken] = useState(
        () => localStorage.getItem('adminToken') || null
    );

    useEffect(() => {
        console.log('🧩 Backend URL from env:', backendUrl);
    }, [backendUrl]);

    // ✅ whenever adminToken changes, sync it to localStorage
    useEffect(() => {
        if (adminToken) {
            localStorage.setItem('adminToken', adminToken);
        } else {
            localStorage.removeItem('adminToken');
        }
    }, [adminToken]);

    // ✅ Re-hydrate teacherData from backend on every page load / token change
    useEffect(() => {
        if (!teacherToken || !backendUrl) {
            setTeacherData(null);
            return;
        }
        // If we already have teacher data in state, skip the fetch (only needed on fresh load)
        if (teacherData) return;

        const fetchTeacherProfile = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/teacher/me`, {
                    headers: { Authorization: `Bearer ${teacherToken}` },
                });
                if (data.success) {
                    setTeacherData(data.teacher);
                } else {
                    // Token was rejected by the server – clear it
                    setTeacherToken(null);
                    setTeacherData(null);
                    localStorage.removeItem('teacherToken');
                }
            } catch (err) {
                // 401 / network error – clear stale token
                console.error('Failed to re-hydrate teacher session:', err.message);
                setTeacherToken(null);
                setTeacherData(null);
                localStorage.removeItem('teacherToken');
            }
        };

        fetchTeacherProfile();
    }, [teacherToken, backendUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <AppContext.Provider
            value={{
                showTeacherLogin,
                setShowTeacherLogin,
                backendUrl,
                teacherToken,
                setTeacherToken,
                teacherData,
                setTeacherData,
                adminToken,
                setAdminToken,   // <- IMPORTANT: expose setter
                isLoaded,
                isSignedIn,
                user,
                userId,
                getToken,
            }}
        >
            {props.children}
        </AppContext.Provider>
    );
};

