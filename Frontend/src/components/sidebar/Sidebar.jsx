import { useRef, useState } from 'react';
import SearchInput from './SearchInput';
import UserItem from './UserItem';
import Avatar from './avatar';

function Sidebar({ users = [], activeUserId, onSelectUser, onLogout, isChatActive, currentUser, onAvatarUpload }) {
    const [searchTerm, setSearchTerm] = useState('');
    const avatarInputRef = useRef(null);

    const filteredUsers = users
        .filter(user =>
            `${user.name} ${user.lastMessage}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((leftUser, rightUser) => {
            const leftTime = Number(leftUser.lastMessageAt || 0);
            const rightTime = Number(rightUser.lastMessageAt || 0);

            return rightTime - leftTime;
        });

    const onlineCount = users.filter(u => u.status === 'online').length;

    return (
        <div className={`${isChatActive ? 'hidden md:flex' : 'flex'} w-full md:w-80 h-screen flex-col overflow-hidden bg-white/90 text-ink border-r border-bone backdrop-blur-sm dark:bg-ink-soft/40 dark:border-ink-line dark:text-bone`}>

            {/* Header / brand mark */}
            <div className="px-5 py-5 border-b border-bone dark:border-ink-line">
                <div className="flex items-center justify-between">
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
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onAvatarUpload}
                        />
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
