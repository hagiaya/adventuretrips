import React, { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthCallback = () => {
    useEffect(() => {
        // Handle the OAuth callback
        const handleCallback = async () => {
            try {
                // Supabase automatically parses the hash in the URL and sets the session
                // We just need to check if we have a session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (session) {
                    // Send success message to opener
                    if (window.opener) {
                        window.opener.postMessage({ type: 'LOGIN_SUCCESS', session }, window.location.origin);
                        window.close();
                    } else {
                        // Fallback if not opened as popup (e.g. redirect)
                        window.location.href = '/';
                    }
                } else {
                    console.error("No session found", error);
                    // Close anyway or show error
                    if (window.opener) window.close();
                }
            } catch (err) {
                console.error("Callback error", err);
                if (window.opener) window.close();
            }
        };

        handleCallback();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 font-medium">Menyelesaikan login...</p>
        </div>
    );
};

export default AuthCallback;
