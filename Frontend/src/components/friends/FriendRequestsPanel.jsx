/**
 * FriendRequestsPanel
 * Dropdown panel showing incoming pending friend requests.
 * Shown by clicking the bell icon in the Sidebar header.
 */
export default function FriendRequestsPanel({ requests, onAccept, onReject, onClose }) {
    if (!requests.length) {
        return (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-bone dark:border-ink-line bg-white dark:bg-ink shadow-xl p-4 text-center">
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-sm text-dusk">No pending requests</p>
            </div>
        );
    }

    return (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-bone dark:border-ink-line bg-white dark:bg-ink shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-bone dark:border-ink-line">
                <p className="text-sm font-semibold text-ink dark:text-bone">
                    Friend Requests
                    <span className="ml-2 rounded-full bg-ember px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {requests.length}
                    </span>
                </p>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-bone dark:divide-ink-line">
                {requests.map(req => (
                    <div key={req.requesterId} className="flex items-center gap-3 px-4 py-3">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <img
                                src={req.avatar}
                                alt={req.name}
                                className="h-10 w-10 rounded-full object-cover"
                            />
                            <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-ink ${req.status === 'online' ? 'bg-teal' : 'bg-dusk/40'}`} />
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink dark:text-bone truncate">{req.name}</p>
                            {req.username && (
                                <p className="text-[11px] text-dusk font-mono">@{req.username}</p>
                            )}
                        </div>

                        {/* Accept / Reject */}
                        <div className="flex gap-1.5 shrink-0">
                            <button
                                onClick={() => onAccept(req.requesterId)}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-teal/10 text-teal hover:bg-teal hover:text-white transition-all"
                                title="Accept"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                            <button
                                onClick={() => onReject(req.requesterId)}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-ember/10 text-ember hover:bg-ember hover:text-white transition-all"
                                title="Reject"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}