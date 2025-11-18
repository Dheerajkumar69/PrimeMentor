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

    // 🛑 FIX 1: Add adminToken state and load it from localStorage
    const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || null);
    // 🛑 FIX 2: Add useEffect to refresh token from localStorage if the component mounts 
    // and token state is initially null, in case of a page reload.
    useEffect(() => {
        if (!adminToken && localStorage.getItem('adminToken')) {
            setAdminToken(localStorage.getItem('adminToken'));
        }
        console.log("🧩 Backend URL from env:", backendUrl);
    }, [backendUrl]);


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
                // 🛑 FIX 3: Include adminToken and setAdminToken in the context value
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