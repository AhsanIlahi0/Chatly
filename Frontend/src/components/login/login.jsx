// Frontend/src/components/Login.jsx
import { useState } from 'react';
import axios from 'axios';

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;
        setLoading(true);

        try {
            const res = await axios.post("http://localhost:5000/api/auth/login", { username });
            // Send user data back up to App.jsx
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
            <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-slate-900 p-8 shadow-xl ring-1 ring-white/10">
                <h2 className="mb-6 text-2xl font-bold tracking-tight text-center">Join Chatly</h2>
                <div className="mb-4">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Username</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your name..." 
                        className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                    />
                </div>
                <button 
                    type="submit" 
                    className="w-full rounded-xl bg-sky-500 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400 transition-colors"
                >
                    {loading ? "Connecting..." : "Enter Chat"}
                </button>
            </form>
        </div>
    );
}

export default Login;