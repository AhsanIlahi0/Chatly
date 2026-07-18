import { useRef, useState } from 'react';
import SearchInput from './SearchInput';
import UserItem from './UserItem';
import Avatar from './avatar';
import FriendRequestsPanel from '../friends/FriendRequestsPanel';

function Sidebar({
    users = [],
    activeUserId,
    onSelectUser,
    onLogout,
    isChatActive,
    currentUser,
    onAvatarUpload,
    theme,
    onToggleTheme,
    // friend system
    friendRequests = [],
    onAcceptRequest,
    onRejectRequest,
    onOpenSearch,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showRequests, setShowRequests] = useState(false);
    const avatarInputRef = useRef(null);

    // Only show users who have a conversation (lastMessage set) or accepted friendship.
    // Users with no messages and no relationship are hidden — found only via Search.
    const visibleUsers = users.filter(u => u.lastMessage || u.isFriend);

    const filteredUsers = visibleUsers
        .filter(user =>
            `${user.name} ${user.lastMessage ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => Number(b.lastMessageAt || 0) - Number(a.lastMessageAt || 0));

    const onlineCount = users.filter(u => u.status === 'online').length;
    const pendingCount = friendRequests.length;

    return (
        <div className={`${isChatActive ? 'hidden md:flex' : 'flex'} w-full md:w-80 h-screen flex-col overflow-hidden bg-white/90 text-ink border-r border-bone backdrop-blur-sm dark:bg-ink-soft/40 dark:border-ink-line dark:text-bone`}>

            {/* ── Header ── */}
            <div className="px-5 py-5 border-b border-bone dark:border-ink-line">
                <div className="flex items-center justify-between">

                    {/* Left: avatar + brand */}
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className="relative h-8 w-8 shrink-0 overflow-hidden rounded-xl ring-2 ring-transparent transition-all hover:ring-ember/40"
                            title="Upload your avatar"
                            aria-label="Upload your avatar"
                        >
                            <Avatar user={currentUser || { name: 'Me', avatar: currentUser?.avatar, status: currentUser?.status }} />
                        </button>
                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarUpload} />
                        <h1 className="font-display text-xl font-bold tracking-tight text-ink dark:text-bone">Chatly</h1>
                    </div>

                    {/* Right: controls */}
                    <div className="flex items-center gap-1.5">

                        {/* Online count pill */}
                        <div className="flex items-center gap-1.5 rounded-full bg-bone/60 px-2.5 py-1 dark:bg-white/5">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-teal animate-signal-pulse" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal" />
                            </span>
                            <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-dusk">
                                {onlineCount} live
                            </span>
                        </div>

                        {/* 🔍 Search button — always visible */}
                        <button
                            type="button"
                            onClick={onOpenSearch}
                            aria-label="Search users"
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-bone dark:border-ink-line bg-bone/40 dark:bg-white/5 text-dusk hover:text-teal hover:border-teal/40 transition-all"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>

                        {/* 🔔 Friend requests bell — always visible */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowRequests(p => !p)}
                                aria-label="Friend requests"
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-bone dark:border-ink-line bg-bone/40 dark:bg-white/5 text-dusk hover:text-ember hover:border-ember/40 transition-all"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </button>
                            {pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ember text-[9px] font-bold text-white">
                                    {pendingCount > 9 ? '9+' : pendingCount}
                                </span>
                            )}

                            {/* Friend requests panel */}
                            {showRequests && (
                                <>
                                    {/* backdrop */}
                                    <div className="fixed inset-0 z-40" onClick={() => setShowRequests(false)} />
                                    <div className="relative z-50">
                                        <FriendRequestsPanel
                                            requests={friendRequests}
                                            onAccept={(id) => { onAcceptRequest(id); }}
                                            onReject={(id) => { onRejectRequest(id); }}
                                            onClose={() => setShowRequests(false)}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* ── Mobile-only: dark mode + sign out ── */}
                        <div className="flex items-center gap-1 md:hidden">
                            <button
                                type="button"
                                onClick={onToggleTheme}
                                className="relative flex h-8 w-14 cursor-pointer items-center rounded-full border border-bone bg-bone/50 p-1 transition-all duration-300 dark:border-ink-line dark:bg-white/5"
                                aria-label="Toggle dark mode"
                            >
                                <div className={`absolute h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center dark:bg-ink ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}>
                                    {theme === 'light' ? (
                                        <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.172a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm-.707-8.485a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" />
                                        </svg>
                                    ) : (
                                        <svg className="h-3.5 w-3.5 text-ember" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                        </svg>
                                    )}
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={onLogout}
                                aria-label="Sign out"
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-ember/20 bg-ember/10 text-ember transition-all hover:bg-ember hover:text-white"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
                                </svg>
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            <SearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            {/* ── Conversation list ── */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto">
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
                    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16 gap-3">
                        <div className="text-4xl">💬</div>
                        <p className="text-sm font-medium text-ink dark:text-bone">No conversations yet</p>
                        <p className="text-xs text-dusk leading-relaxed">
                            Use the <span className="font-semibold">🔍 search</span> button to find people by username and start chatting
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
}

export default Sidebar;