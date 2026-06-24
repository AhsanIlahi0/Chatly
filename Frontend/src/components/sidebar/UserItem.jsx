function UserItem({ user, isActive, onClick }) {
    return (
        <div 
            className={`transition-all duration-300 flex items-center px-4 py-3 border-b border-slate-100 cursor-pointer ${
                isActive 
                    ? 'bg-blue-50/70 border-l-4 border-l-blue-600 pl-3 dark:bg-slate-800/80 dark:border-l-sky-400 dark:border-b-transparent' 
                    : 'bg-transparent hover:bg-slate-50 hover:translate-x-1 dark:hover:bg-slate-800/70 dark:border-white/10'
            }`} 
            onClick={onClick}
        >
            {/* Avatar block wrapper */}
            <div className="w-12 h-12 rounded-full mr-3 bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 dark:bg-white/20">
                {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-700 bg-gradient-to-br from-slate-200 to-slate-100 dark:text-white dark:from-white/20 dark:to-white/10">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {/* Information strings info */}
            <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold mb-1 truncate ${isActive ? 'text-blue-900 dark:text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>
                    {user.name}
                </div>
                <div className={`text-xs truncate ${isActive ? 'text-blue-700 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {user.lastMessage || ''}
                </div>
            </div>

            {/* Timing notification badging */}
            <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                <div className={`text-xs ${isActive ? 'text-blue-600 dark:text-slate-400' : 'text-slate-400'}`}>{user.time || ''}</div>
                {user.unread > 0 && (
                    <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold dark:bg-sky-400 dark:text-slate-950">
                        {user.unread}
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserItem;