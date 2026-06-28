import { useState } from 'react';
import Avatar from './avatar';

function RequestsPanel({ isOpen, onClose, incomingRequests = [], outgoingRequests = [], onAccept, onDecline, onCancel }) {
    const [busyId, setBusyId] = useState(null);

    if (!isOpen) return null;

    const handle = async (id, action) => {
        setBusyId(id);
        try {
            await action(id);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl text-white max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 shrink-0">
                    <h2 className="text-lg font-bold">Friend Requests</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close">✕</button>
                </div>

                <div className="overflow-y-auto pr-1 space-y-5">
                    <section>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Incoming ({incomingRequests.length})
                        </h3>
                        {incomingRequests.length === 0 ? (
                            <p className="text-sm text-slate-500 py-2">No pending requests right now.</p>
                        ) : (
                            <div className="space-y-2">
                                {incomingRequests.map(req => {
                                    const isBusy = busyId === req._id;
                                    return (
                                        <div key={req._id} className="flex items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar user={req.sender || {}} />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-semibold truncate">{req.sender?.name || "Someone"}</span>
                                                    <span className="text-[10px] text-slate-500 truncate">{req.sender?.email}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => handle(req._id, onAccept)}
                                                    disabled={isBusy}
                                                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handle(req._id, onDecline)}
                                                    disabled={isBusy}
                                                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-300 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <section>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Sent ({outgoingRequests.length})
                        </h3>
                        {outgoingRequests.length === 0 ? (
                            <p className="text-sm text-slate-500 py-2">You haven't sent any requests.</p>
                        ) : (
                            <div className="space-y-2">
                                {outgoingRequests.map(req => {
                                    const isBusy = busyId === req._id;
                                    return (
                                        <div key={req._id} className="flex items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar user={req.receiver || {}} />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-semibold truncate">{req.receiver?.name || "Someone"}</span>
                                                    <span className="text-[10px] text-slate-500 truncate">Waiting for response...</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handle(req._id, onCancel)}
                                                disabled={isBusy}
                                                className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default RequestsPanel;
