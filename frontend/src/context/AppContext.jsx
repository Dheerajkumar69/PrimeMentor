// src/context/AppContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

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
