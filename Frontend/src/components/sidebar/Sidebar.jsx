import { useState } from 'react';
import SearchInput from './SearchInput';
import UserItem from './UserItem';

function Sidebar({ users = [], activeUserId, onSelectUser, onLogout }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
        `${user.name} ${user.lastMessage}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onlineCount = users.filter(u => u.status === 'online').length;

    return (
        <div className="w-80 h-screen flex flex-col overflow-hidden bg-white/90 text-ink border-r border-bone backdrop-blur-sm dark:bg-ink-soft/40 dark:border-ink-line dark:text-bone">

            {/* Header / brand mark */}
            <div className="px-5 py-5 border-b border-bone dark:border-ink-line">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-ember dark:bg-ember dark:text-ink shrink-0">
                            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
                                <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.4 3.6a.6.6 0 0 1-1-.46V5a1 1 0 0 1 1-1Z" />
                            </svg>
                        </span>
                        <h1 className="font-display text-xl font-bold tracking-tight text-ink dark:text-bone">Chatly</h1>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-full bg-bone/60 px-2.5 py-1 dark:bg-white/5">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-teal animate-signal-pulse" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal" />
                        </span>
                        <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-dusk">
                            {onlineCount} live
                        </span>
                    </div>
                </div>
            </div>

            <SearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            {/* Scrollable conversation list */}
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
                    <div className="px-5 py-10 text-center text-sm text-dusk">No users found</div>
                )}
            </div>

        </div>
    );
}

export default Sidebar;
