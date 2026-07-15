// Frontend/src/components/Login.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);

    // 🚀 LOAD GOOGLE IDENTITY SERVICE SDK DYNAMICALLY
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (window.google) {
                // Initialize Google Sign-In with your client ID
                window.google.accounts.id.initialize({
                    client_id: "714119860562-0umofandiic832pls68q2n8unb3ntprv.apps.googleusercontent.com",
                    callback: handleGoogleLoginResponse,
                });

                // Render the official Google Sign-In Button inside our target div
                window.google.accounts.id.renderButton(
                    document.getElementById("googleSignInButton"),
                    { 
                        theme: "filled_blue", 
                        size: "large", 
                        width: "320", // Matches the width profile of your form input fields
                        text: "continue_with",
                        shape: "pill"
                    }
                );
            }
        };

        return () => {
            // Cleanup script tag on unmount
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    // 🚀 GOOGLE AUTH BACKEND EXCHANGE HANDLER
    const handleGoogleLoginResponse = async (response) => {
        setLoading(true);
        try {
            const idToken = response.credential; // The raw ID token from Google
            
            // Post Google ID token to your new backend router endpoint
            const res = await axios.post(`${API_URL}/api/auth/google-login`, {
                idToken
            });

            // If login/signup succeeds, send the user data back up to App.jsx
            onLoginSuccess(res.data);
        } catch (err) {
            console.error("Google login failure:", err);
            alert("Google Sign-In failed. Check backend console logs.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, { email: username });
            onLoginSuccess(res.data); 
        } catch (err) {
            console.error("Login connection failure:", err);
            alert("Could not log in. Check backend server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-8 shadow-xl ring-1 ring-white/10">
                <h2 className="mb-6 text-2xl font-bold tracking-tight text-center">Join Chatly</h2>
                
                {/* Traditional Username Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            Username / Email
                        </label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your name or email..." 
                            className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full rounded-xl bg-sky-500 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Connecting..." : "Enter Chat"}
                    </button>
                </form>

                {/* Styled Visual Divider */}
                <div className="relative flex py-5 items-center w-full">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase tracking-widest font-semibold">Or</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                {/* 🚀 GOOGLE BUTTON INJECTION ELEMENT */}
                <div className="flex justify-center w-full">
                    <div id="googleSignInButton" className="w-full max-w-[320px]">signin with google</div>
                </div>
            </div>
        </div>
    );
}

export default Login;