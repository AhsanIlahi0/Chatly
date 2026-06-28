import { useState } from 'react';
import SearchInput from './SearchInput';
import UserItem from './UserItem';
import DiscoverModal from './discoverModal';
import RequestsPanel from './RequestsPanel';

function Sidebar({
    users = [],
    activeUserId,
    onSelectUser,
    onLogout,
    currentUser,
    incomingRequests = [],
    outgoingRequests = [],
    onSendRequest,
    onAcceptRequest,
    onDeclineRequest,
    onCancelRequest,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);
    const [isRequestsOpen, setIsRequestsOpen] = useState(false);

    const filteredUsers = users.filter(user =>
        `${user.name} ${user.lastMessage}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        /* White background by default, gradient dark slate background on dark mode */
        <div className="w-80 h-screen flex flex-col overflow-hidden bg-white/90 text-slate-900 border-r border-slate-200 backdrop-blur-sm dark:bg-transparent dark:border-slate-800/60 dark:text-white">

            {/* Header section */}
            <div className="px-5 py-5 bg-slate-50 border-b border-slate-200 dark:bg-black/10 dark:border-white/10">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <span
                            className="material-symbols-outlined text-slate-800 dark:text-white text-3xl leading-none"
                            style={{
                                fontVariationSettings: "'FILL' 0, 'wght' 800, 'GRAD' 0, 'opsz' 48", paddingTop: 6,
                            }}
                        >
                            chat
                        </span>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-wide m-0 dark:text-white truncate">Chatly</h1>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {/* 🔔 Friend request notifications (incoming + sent) */}
                        <button
                            type="button"
                            onClick={() => setIsRequestsOpen(true)}
                            className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"
                            aria-label="Friend requests"
                            title="Friend requests"
                        >
                            <span className="material-symbols-outlined text-2xl leading-none">notifications</span>
                            {incomingRequests.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                                    {incomingRequests.length}
                                </span>
                            )}
                        </button>

                        {/* ➕ Discover other users in the database & send requests */}
                        <button
                            type="button"
                            onClick={() => setIsDiscoverOpen(true)}
                            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"
                            aria-label="Find people"
                            title="Find people"
                        >
                            <span className="material-symbols-outlined text-2xl leading-none">person_add</span>
                        </button>
                    </div>
                </div>
            </div>

            <SearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            {/* Scrollable conversation section */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto bg-white dark:bg-transparent">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                        <UserItem
                            key={user.id}
                            user={user}
                            isActive={activeUserId === user.id}
                            onClick={() => onSelectUser(user.id)}
                        />
                    ))
                ) : (
                    <div className="px-5 py-10 text-center text-sm text-slate-400 dark:text-white/60">
                        {users.length === 0 ? (
                            <>
                                No friends yet.<br />
                                Tap <span className="material-symbols-outlined align-middle text-base">person_add</span> above to find people.
                            </>
                        ) : "No users found"}
                    </div>
                )}
            </div>

            <DiscoverModal
                isOpen={isDiscoverOpen}
                onClose={() => setIsDiscoverOpen(false)}
                currentUser={currentUser}
                onSendRequest={onSendRequest}
                onAcceptRequest={onAcceptRequest}
            />

            <RequestsPanel
                isOpen={isRequestsOpen}
                onClose={() => setIsRequestsOpen(false)}
                incomingRequests={incomingRequests}
                outgoingRequests={outgoingRequests}
                onAccept={onAcceptRequest}
                onDecline={onDeclineRequest}
                onCancel={onCancelRequest}
            />

        </div>
    );
}

export default Sidebar;
