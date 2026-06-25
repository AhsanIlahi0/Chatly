import { useState } from 'react';
import SearchInput from './SearchInput';
import UserItem from './UserItem';

function Sidebar({ users = [], activeUserId, onSelectUser, onLogout }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
        `${user.name} ${user.lastMessage}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        /* White background by default, gradient dark slate background on dark mode */
        <div className="w-80 h-screen flex flex-col overflow-hidden bg-white/90 text-slate-900 border-r border-slate-200 backdrop-blur-sm dark:bg-transparent dark:border-slate-800/60 dark:text-white">
            
            {/* Header section */}
            <div className="px-5 py-5 bg-slate-50 border-b border-slate-200 dark:bg-black/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <span
                        className="material-symbols-outlined text-slate-800 dark:text-white text-3xl leading-none"
                        style={{
                            fontVariationSettings: "'FILL' 0, 'wght' 800, 'GRAD' 0, 'opsz' 48", paddingTop: 6, 
                        }}
                    >
                        chat
                    </span>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-wide m-0 dark:text-white">Chatly</h1>
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
                    <div className="px-5 py-10 text-center text-sm text-slate-400 dark:text-white/60">No users found</div>
                )}
            </div>
           
        </div>
    );
}

export default Sidebar;