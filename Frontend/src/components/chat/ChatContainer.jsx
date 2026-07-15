import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import Avatar from '../sidebar/avatar';

function ChatContainer({ theme, setTheme, activeUser, messages = [], onLogout, isDetailTabOpen, onSendMessage, onDeleteMessage, onDeselectUser, showProfile, onCloseProfile, onOpenProfile, onToggleProfile, currentUserId }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const messagesEndRef = useRef(null);
    const transitionTimerRef = useRef(null);
    const [viewState, setViewState] = useState({
        currentUser: activeUser,
        currentMessages: messages,
        previousUser: null,
        previousMessages: [],
        isSwitching: false,
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeUser]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

            if (event.key === 'Escape') {
                if (isDetailTabOpen) {
                    onCloseProfile();
                }
                else {
                    onDeselectUser();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onCloseProfile, onDeselectUser]);

    useEffect(() => {
        setViewState((currentState) => {
            if (!activeUser) {
                return {
                    currentUser: null,
                    currentMessages: [],
                    previousUser: null,
                    previousMessages: [],
                    isSwitching: false,
                };
            }

            if (!currentState.currentUser) {
                return {
                    currentUser: activeUser,
                    currentMessages: messages,
                    previousUser: null,
                    previousMessages: [],
                    isSwitching: false,
                };
            }

            if (currentState.currentUser.id === activeUser.id) {
                return {
                    ...currentState,
                    currentUser: activeUser,
                    currentMessages: messages,
                };
            }

            return {
                currentUser: activeUser,
                currentMessages: messages,
                previousUser: currentState.currentUser,
                previousMessages: currentState.currentMessages,
                isSwitching: true,
            };
        });
    }, [activeUser, messages]);

    useEffect(() => {
        if (!viewState.isSwitching) {
            return undefined;
        }

        if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current);
        }

        transitionTimerRef.current = window.setTimeout(() => {
            setViewState((currentState) => (
                currentState.isSwitching
                    ? {
                        ...currentState,
                        previousUser: null,
                        previousMessages: [],
                        isSwitching: false,
                    }
                    : currentState
            ));
            transitionTimerRef.current = null;
        }, 420);

        return () => {
            if (transitionTimerRef.current) {
                clearTimeout(transitionTimerRef.current);
                transitionTimerRef.current = null;
            }
        };
    }, [viewState.isSwitching, viewState.currentUser?.id]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 🚀 Unified Scroll Anchor Controller
    const prevMessageCountRef = useRef(messages.length);

    useEffect(() => {
        if (!viewState.isSwitching && viewState.currentMessages.length > 0) {
            const currentCount = viewState.currentMessages.length;
            const prevCount = prevMessageCountRef.current;

            const isLiveNewMessage = currentCount - prevCount > 0 && currentCount - prevCount <= 2;

            const scrollTimeout = setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({
                    behavior: isLiveNewMessage ? 'smooth' : 'auto'
                });
            }, 30);

            prevMessageCountRef.current = currentCount;

            return () => clearTimeout(scrollTimeout);
        }
    }, [viewState.currentMessages, viewState.isSwitching]);

    const renderChatPanel = (user, panelMessages, panelStateClassName, attachScrollTarget = true) => (
        <div className={`absolute inset-0 flex h-full min-h-0 flex-col bg-parchment transition-all duration-500 ease-out dark:bg-ink ${panelStateClassName}`}>
            <div className="relative z-20 flex items-center justify-between gap-2 border-b border-bone bg-white/80 px-3 py-3 shadow-sm backdrop-blur-sm dark:border-ink-line dark:bg-ink-soft/40 sm:gap-4 sm:px-6 sm:py-4">
                <div className="flex min-w-0 items-center gap-1 sm:gap-3">
                    <button
                        type="button"
                        onClick={onDeselectUser}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-dusk transition-colors hover:bg-bone hover:text-ink dark:hover:bg-white/10 dark:hover:text-bone md:hidden"
                        aria-label="Back to conversations"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>

                    <div className="group flex min-w-0 cursor-pointer items-center gap-3 select-none">
                        <div className="h-11 w-11 shrink-0">
                            <Avatar user={user} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="truncate font-display text-base font-semibold text-ink group-hover:text-ember transition-colors dark:text-bone">{user?.name}</h2>
                            <p className={`font-mono text-[11px] uppercase tracking-wide ${user?.status === 'online' ? 'text-teal' : 'text-dusk'}`}>
                                {user?.status === 'online' ? 'online' : user?.status === 'away' ? 'away' : 'offline'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 text-dusk sm:gap-1.5">
                    <button
                        onClick={onLogout}
                        aria-label="Sign out"
                        className="cursor-pointer rounded-xl border border-ember/20 bg-ember/10 p-2 text-xs font-semibold text-ember transition-all hover:bg-ember hover:text-white sm:px-3.5 sm:py-2"
                    >
                        <svg className="h-4 w-4 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <path d="M16 17l5-5-5-5" />
                            <path d="M21 12H9" />
                        </svg>
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>

                    <button
                        type="button"
                        onClick={setTheme}
                        className="relative ml-0.5 flex h-8 w-14 cursor-pointer items-center rounded-full border border-bone bg-bone/50 p-1 transition-all duration-300 ease-in-out dark:border-ink-line dark:bg-white/5 sm:ml-1 sm:h-9 sm:w-16"
                        aria-label="Toggle dark mode"
                    >
                        <div
                            className={`absolute h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out flex items-center justify-center dark:bg-ink sm:h-7 sm:w-7 ${theme === 'dark' ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0'
                                }`}
                        >
                            {theme === 'light' ? (
                                <svg className="h-3.5 w-3.5 text-amber-500 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.172a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm-.707-8.485a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" />
                                </svg>
                            ) : (
                                <svg className="h-3.5 w-3.5 text-ember sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                </svg>
                            )}
                        </div>
                    </button>

                    <div className="hidden rounded-full p-2.5 cursor-pointer transition-colors hover:bg-bone dark:hover:bg-white/10 sm:block" onClick={onOpenProfile}>
                        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="View profile details">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="11" />
                            <circle cx="12" cy="8" r="0.5" fill="currentColor" />
                        </svg>
                    </div>

                    <div className='relative' ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`cursor-pointer rounded-full p-2 sm:p-2.5 transition-colors ${showProfile ? 'bg-bone text-ember dark:bg-white/10' : 'hover:bg-bone dark:hover:bg-white/10'}`} type="button" aria-label="More options">⋯</button>
                        {isMenuOpen && (
                            <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl border border-bone bg-white py-1 shadow-lg dark:border-ink-line dark:bg-ink-soft">
                                <button
                                    onClick={() => { onOpenProfile(); setIsMenuOpen(false); }}
                                    className="w-full px-4 py-2 text-left text-sm text-ink transition-colors hover:bg-bone/60 dark:text-bone dark:hover:bg-white/5 sm:hidden"
                                >
                                    View Profile
                                </button>
                                <button
                                    onClick={() => { console.log('Muted'); setIsMenuOpen(false); }}
                                    className="w-full px-4 py-2 text-left text-sm text-ink transition-colors hover:bg-bone/60 dark:text-bone dark:hover:bg-white/5"
                                >
                                    Mute Notifications
                                </button>

                                <hr className="my-1 border-bone dark:border-ink-line" />

                                <button
                                    onClick={() => { onDeselectUser(); setIsMenuOpen(false); onCloseProfile(); }}
                                    className="w-full px-4 py-2 text-left text-sm text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                >
                                    Close Conversation
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 sm:px-6 bg-[radial-gradient(circle_at_top,_rgba(255,107,71,0.05),_transparent_40%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,107,71,0.07),_transparent_45%)]">
                <div className="mx-auto flex max-w-3xl flex-col gap-3">
                    <div className="self-center rounded-full bg-white/80 px-4 py-1 font-mono text-[10px] uppercase tracking-widest text-dusk shadow-sm ring-1 ring-bone dark:bg-ink-soft/80 dark:ring-ink-line">Today</div>

                    {panelMessages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            currentUserId={currentUserId}
                            onDeleteMessage={() => onDeleteMessage?.(message.id, user.id)}
                        />
                    ))}

                    {attachScrollTarget && <div ref={messagesEndRef} />}
                </div>
            </div>

            {attachScrollTarget && <MessageInput theme={theme} onSendMessage={onSendMessage} />}
        </div>
    );

    return (
        <div className="relative flex h-full min-h-0 w-full flex-1 overflow-hidden">
            {/* Empty State / Welcome Screen */}
            <div
                className={`absolute inset-0 flex items-center justify-center px-6 text-center transition-all duration-500 ease-out ${viewState.currentUser
                    ? 'pointer-events-none translate-y-4 scale-[0.98] opacity-0'
                    : 'translate-y-0 scale-100 opacity-100'
                    }`}
            >
                <div>
                    <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-ember/10 text-ember">
                        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                            <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.4 3.6a.6.6 0 0 1-1-.46V5a1 1 0 0 1 1-1Z" />
                        </svg>
                    </span>
                    <h2 className="font-display text-xl font-bold text-ink dark:text-bone">Welcome to Chatly</h2>
                    <p className="mt-2 text-sm text-dusk">Pick someone from the sidebar to start chatting.</p>
                </div>
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        onClick={onLogout}
                        className="cursor-pointer rounded-xl border border-ember/20 bg-ember/10 px-4 py-2.5 text-sm font-semibold text-ember transition-all hover:bg-ember hover:text-white"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* 🛠️ Responsive wrapper to securely contain and render the absolute slides on mobile */}
            <div className="relative flex h-full w-full flex-1 min-h-0">
                {viewState.previousUser && viewState.currentUser ? (
                    <>
                        {renderChatPanel(
                            viewState.previousUser,
                            viewState.previousMessages,
                            'pointer-events-none translate-x-6 scale-[0.98] opacity-0',
                            false,
                        )}
                        {renderChatPanel(
                            viewState.currentUser,
                            viewState.currentMessages,
                            'translate-x-0 scale-100 opacity-100',
                        )}
                    </>
                ) : viewState.currentUser ? (
                    renderChatPanel(
                        viewState.currentUser,
                        viewState.currentMessages,
                        'translate-x-0 scale-100 opacity-100',
                    )
                ) : null}
            </div>
        </div>
    );
}

export default ChatContainer;