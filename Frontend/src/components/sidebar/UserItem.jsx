import { useState, useRef, useEffect } from "react";
import Avatar from "./avatar";

function UserItem({ user, isActive, onClick, chatSettings = {}, onTogglePin, onToggleMute, onClearChat, onDeleteChat }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const isVoiceNote = user.lastMessageType === 'voice-note' || user.lastMessage === 'VN';
    const isPinned = Boolean(chatSettings?.pinned);
    const isMuted = Boolean(chatSettings?.muted);

    useEffect(() => {
        const handlePointerDown = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    const handleAction = (event, action) => {
        event.stopPropagation();
        setMenuOpen(false);
        action();
    };

    return (
        <div
            className={`group relative flex items-center px-4 py-3.5 cursor-pointer overflow-visible transition-all duration-200 ${
                menuOpen ? 'z-50' : 'z-0'
            } ${
                isActive
                    ? 'bg-ember/[0.08] dark:bg-ember/[0.12]'
                    : 'hover:bg-bone/40 dark:hover:bg-white/[0.04]'
            }`}
            onClick={onClick}
        >
            <span
                className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-ember transition-all duration-200 ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'
                }`}
            />

            <div className="relative z-10 flex w-full items-center">
                <div className="w-12 h-12 mr-3 shrink-0">
                    <Avatar user={user} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold mb-0.5 truncate ${isActive ? 'text-ink dark:text-bone' : 'text-ink/90 dark:text-bone/90'}`}>
                        {user.name}
                    </div>
                    {isVoiceNote ? (
                        <div className="flex items-center gap-1.5 text-xs text-dusk dark:text-dusk">
                            <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-bone/80 text-ink dark:bg-white/10 dark:text-bone">
                                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm5 9a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-2.07A7 7 0 0 0 19 12h-2Z" />
                                </svg>
                            </span>
                            <span className="font-semibold uppercase tracking-wide">VN</span>
                        </div>
                    ) : (
                        <div className="text-xs truncate text-dusk dark:text-dusk">
                            {user.lastMessage || '\u00A0'}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 ml-2 shrink-0">
                    {isPinned && (
                        <span className="text-[10px] font-medium text-ember" title="Pinned">📌</span>
                    )}
                    {/* {isMuted && (
                        <span className="text-[10px] font-medium text-dusk" title="Muted">🔕</span>
                    )} */}
                    <div className="flex flex-col items-end gap-1.5">
                        <div className="font-mono text-[10px] tracking-wide text-dusk/80">{user.time || ''}</div>
                        {user.unread > 0 && (
                            <div className="bg-ember text-ink rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[11px] font-bold">
                                {user.unread}
                            </div>
                        )}
                    </div>

                    <div ref={menuRef} className="relative z-40">
                        <button
                            type="button"
                            aria-label={`Open chat actions for ${user.name}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                setMenuOpen((prev) => !prev);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-bone/70 bg-white/80 text-dusk transition hover:border-ember/30 hover:text-ember dark:border-ink-line dark:bg-ink-soft/70"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <circle cx="12" cy="5" r="1.8" />
                                <circle cx="12" cy="12" r="1.8" />
                                <circle cx="12" cy="19" r="1.8" />
                            </svg>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 top-9 z-[9999] w-44 rounded-xl border border-bone bg-white p-1.5 shadow-xl dark:border-ink-line dark:bg-ink-soft">
                                <button type="button" onClick={(event) => handleAction(event, () => onTogglePin?.(user.id))} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-ink hover:bg-bone/60 dark:text-bone dark:hover:bg-white/5">
                                    <span>{isPinned ? 'Unpin chat' : 'Pin chat'}</span>
                                    {/* <span>📌</span> */}
                                </button>
                                <button type="button" onClick={(event) => handleAction(event, () => onToggleMute?.(user.id))} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-ink hover:bg-bone/60 dark:text-bone dark:hover:bg-white/5">
                                    <span>{isMuted ? 'Unmute chat' : 'Mute chat'}</span>
                                    {/* <span>{isMuted ? '🔔' : '🔕'}</span> */}
                                </button>
                                {/* <button type="button" onClick={(event) => handleAction(event, () => onClick?.())} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-ink hover:bg-bone/60 dark:text-bone dark:hover:bg-white/5"> */}
                                    {/* <span>Open chat</span> */}
                                    {/* <span>💬</span> */}
                                {/* </button> */}
                                <button type="button" onClick={(event) => handleAction(event, () => onClearChat?.(user.id))} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-ink hover:bg-bone/60 dark:text-bone dark:hover:bg-white/5">
                                    <span>Clear chat</span>
                                    {/* <span>🧹</span> */}
                                </button>
                                <button type="button" onClick={(event) => handleAction(event, () => onDeleteChat?.(user.id))} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                                    <span>Delete chat</span>
                                    {/* <span>🗑️</span> */}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserItem;
