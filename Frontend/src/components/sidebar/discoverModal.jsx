// Frontend/src/components/DiscoverModal.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function DiscoverModal({ isOpen, onClose, currentUser, socket }) {
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const currentUserId = currentUser?._id || currentUser;

    useEffect(() => {
        if (isOpen && currentUserId) {
            setLoading(true);
            axios.get(`http://localhost:5000/api/auth/discover/${currentUserId}`)
                .then(res => setAllUsers(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, currentUserId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <h2 className="text-lg font-bold">Discover Users</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
                </div>

                {loading ? (
                    <div className="py-8 text-center text-sm text-slate-400">Searching directory entries...</div>
                ) : allUsers.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-400">No other users found in database registry.</div>
                ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {allUsers.map(user => {
                            // Check relationships using safe optional chaining checks
                            const existingRelation = currentUser?.friends?.find(f => (f.recipient?._id || f.recipient) === user._id) || 
                                                     user?.friends?.find(f => (f.recipient?._id || f.recipient) === currentUserId);

                            return (
                                <div key={user._id} className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                            {user.name ? user.name.substring(0, 2).toUpperCase() : "??"}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold">{user.name}</span>
                                            <span className="text-[10px] text-slate-500">{user.email}</span>
                                        </div>
                                    </div>

                                    {existingRelation ? (
                                        <span className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 capitalize border border-white/5">
                                            {existingRelation.status}
                                        </span>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                axios.post('http://localhost:5000/api/auth/users', { senderId: currentUserId, receiverId: user._id });
                                                onClose();
                                            }}
                                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all active:scale-95"
                                        >
                                            Add Friend
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DiscoverModal;