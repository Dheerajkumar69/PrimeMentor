import React, { createContext, useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Clerk user state
    const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth();
    const { user } = useUser();

    // Teacher states
    const [showTeacherLogin, setShowTeacherLogin] = useState(false);
    const [teacherToken, setTeacherToken] = useState(localStorage.getItem('teacherToken') || null);
    const [teacherData, setTeacherData] = useState(null); 

    // Admin states
    const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || null);
    
    useEffect(() => {
        // Ensure tokens are loaded if they exist in localStorage but state was null
        if (!adminToken && localStorage.getItem('adminToken')) {
            setAdminToken(localStorage.getItem('adminToken'));
        }
        // Note: Teacher token loads fine during initial state setup.

        console.log("🧩 Backend URL from env:", backendUrl);
    }, [backendUrl, adminToken]); // Depend on adminToken to prevent loop if state changes

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
                setAdminToken,
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