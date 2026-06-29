import Avatar from "./avatar";

function UserItem({ user, isActive, onClick }) {
    return (
        <div
            className={`group relative flex items-center px-4 py-3.5 cursor-pointer transition-all duration-200 ${
                isActive
                    ? 'bg-ember/[0.08] dark:bg-ember/[0.12]'
                    : 'hover:bg-bone/40 dark:hover:bg-white/[0.04]'
            }`}
            onClick={onClick}
        >
            {/* Active-state accent bar — replaces the generic blue border-left */}
            <span
                className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-ember transition-all duration-200 ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'
                }`}
            />

            <div className="w-12 h-12 mr-3 shrink-0">
                <Avatar user={user} />
            </div>

            <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold mb-0.5 truncate ${isActive ? 'text-ink dark:text-bone' : 'text-ink/90 dark:text-bone/90'}`}>
                    {user.name}
                </div>
                <div className="text-xs truncate text-dusk dark:text-dusk">
                    {user.lastMessage || '\u00A0'}
                </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
                <div className="font-mono text-[10px] tracking-wide text-dusk/80">{user.time || ''}</div>
                {user.unread > 0 && (
                    <div className="bg-ember text-ink rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[11px] font-bold">
                        {user.unread}
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserItem;
