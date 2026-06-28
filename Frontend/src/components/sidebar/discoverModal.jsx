// Frontend/src/components/sidebar/discoverModal.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Avatar from './avatar';

function DiscoverModal({ isOpen, onClose, currentUser, onSendRequest, onAcceptRequest }) {
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingActionId, setPendingActionId] = useState(null);
    const [actionError, setActionError] = useState('');

    const currentUserId = currentUser?._id || currentUser?.id || currentUser;

    const loadDirectory = () => {
        if (!currentUserId) return;
        setLoading(true);
        axios.get(`http://localhost:5000/api/friends/${currentUserId}/discover`)
            .then(res => setAllUsers(res.data))
            .catch(err => console.error("Failed to load user directory:", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        (async () => {
            if (isOpen) {
                setSearchTerm('');
                setActionError('');
                loadDirectory();
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, currentUserId]);

    if (!isOpen) return null;

    const visibleUsers = allUsers.filter(u =>
        `${u.name} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSend = async (user) => {
        setPendingActionId(user._id);
        setActionError('');
        const result = await onSendRequest(user._id);
        if (result?.success) {
            loadDirectory();
        } else {
            setActionError(result?.message || "Couldn't send that request");
        }
        setPendingActionId(null);
    };

    const handleQuickAccept = async (user) => {
        if (!user.relationship?.requestId) return;
        setPendingActionId(user._id);
        await onAcceptRequest(user.relationship.requestId);
        loadDirectory();
        setPendingActionId(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <h2 className="text-lg font-bold">Find People</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close">✕</button>
                </div>

                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full mb-4 rounded-xl bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-sky-500"
                />

                {actionError && (
                    <div className="mb-3 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-300">
                        {actionError}
                    </div>
                )}

                {loading ? (
                    <div className="py-8 text-center text-sm text-slate-400">Searching directory entries...</div>
                ) : visibleUsers.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-400">No other users found in database registry.</div>
                ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {visibleUsers.map(user => {
                            const relationship = user.relationship;
                            const isBusy = pendingActionId === user._id;

                            return (
                                <div key={user._id} className="flex items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar user={user} />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-semibold truncate">{user.name}</span>
                                            <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
                                        </div>
                                    </div>

                                    {!relationship && (
                                        <button
                                            onClick={() => handleSend(user)}
                                            disabled={isBusy}
                                            className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isBusy ? "Sending..." : "Add Friend"}
                                        </button>
                                    )}

                                    {relationship?.status === 'accepted' && (
                                        <span className="shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                            Friends
                                        </span>
                                    )}

                                    {relationship?.status === 'pending' && relationship.direction === 'outgoing' && (
                                        <span className="shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-white/5">
                                            Requested
                                        </span>
                                    )}

                                    {relationship?.status === 'pending' && relationship.direction === 'incoming' && (
                                        <button
                                            onClick={() => handleQuickAccept(user)}
                                            disabled={isBusy}
                                            className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isBusy ? "..." : "Accept Request"}
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
