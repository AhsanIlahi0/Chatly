import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import info_icon_light from '../../images/info.png';
import info_icon_dark from '../../images/info_white.png';
import Avatar from '../sidebar/avatar';
// import { useDarkMode } from '../../hooks/useDarkMode';


function ChatContainer({ theme, setTheme, activeUser, messages = [],onLogout, isDetailTabOpen, onSendMessage, onDeselectUser, showProfile, onCloseProfile, onOpenProfile, onToggleProfile }) {
    // const [theme, toggleTheme] = useDarkMode();
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
    // Keep track of the last message count to see if a single new message was added
    const prevMessageCountRef = useRef(messages.length);

    useEffect(() => {
        if (!viewState.isSwitching && viewState.currentMessages.length > 0) {
            const currentCount = viewState.currentMessages.length;
            const prevCount = prevMessageCountRef.current;

            // 🚀 Determine scroll speed context
            // If the count only went up by 1 or 2, it's a live message -> scroll smoothly.
            // If it's a massive jump or initial render -> snap instantly.
            const isLiveNewMessage = currentCount - prevCount > 0 && currentCount - prevCount <= 2;

            const scrollTimeout = setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({
                    behavior: isLiveNewMessage ? 'smooth' : 'auto'
                });
            }, 30);

            // Update the ref tracker for the next cycle
            prevMessageCountRef.current = currentCount;

            return () => clearTimeout(scrollTimeout);
        }
    }, [viewState.currentMessages, viewState.isSwitching]);

    const renderChatPanel = (user, panelMessages, panelStateClassName, attachScrollTarget = true) => (
        <div className={`absolute inset-0 flex h-full min-h-0 flex-col bg-white transition-all duration-500 ease-out dark:bg-transparent ${panelStateClassName}`}>
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-sm dark:border-slate-800/40 dark:bg-slate-950/20">
                <div className="group flex min-w-0 cursor-pointer items-center gap-3 select-none">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 font-semibold text-white shadow-md">
                        <Avatar user={user} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-slate-900 group-hover:underline dark:text-slate-100">{user?.name}</h2>
                        <p className={`text-sm ${user?.status === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {user?.status === 'online' ? 'Online' : user?.status === 'away' ? 'Away' : 'Offline'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                     <div className="  border-t border-white/10 bg-transparent text-sm font-semibold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 transition-colors">
                <button
                    onClick={onLogout}
                    className="cursor-pointer p-3 w-full rounded-xl bg-rose-500/10 hover:bg-rose-500 py-2.5 text-sm font-semibold text-rose-400 hover:text-white border border-rose-500/20 transition-all"
                >
                    Sign Out 
                </button>
            </div>
                    <button
                        type="button"
                        onClick={setTheme}
                        className="relative flex h-9 w-16 cursor-pointer items-center rounded-full border border-slate-200 bg-slate-100 p-1 transition-all duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-800"
                        aria-label="Toggle dark mode"
                    >
                        {/* Sliding indicator bubble */}
                        <div
                            className={`absolute h-7 w-7 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out flex items-center justify-center dark:bg-slate-950 ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
                                }`}
                        >
                            {theme === 'light' ? (
                                <svg className="h-4 w-4 text-amber-500 transition-transform duration-300 rotate-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.172a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm-.707-8.485a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" />
                                </svg>
                            ) : (
                                <svg className="h-4 w-4 text-sky-400 transition-transform duration-300 rotate-12" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                </svg>
                            )}
                        </div>

                        {/* Subtle track icons background */}
                        <div className="flex w-full justify-between px-1 text-[10px] select-none opacity-40 dark:text-slate-400">
                            <span>☀️</span>
                            <span>🌙</span>
                        </div>
                    </button>
                    <div className='rounded-full pl-2 pt-2 pb-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800'>

                        <img
                            src={theme === 'light' ? info_icon_light : info_icon_dark}
                            alt="info"
                            className="mr-2 h-5 w-5 cursor-pointer rounded-full object-contain transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            type="button"
                            aria-label="View profile details"
                            onClick={onOpenProfile}
                        />
                    </div>
                    {/* <button className="rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800" type="button" aria-label="Call">☎</button> */}
                    <div className='relative' ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`cursor-pointer rounded-full p-2 transition-colors dark:text-slate-300 ${showProfile ? 'bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`} type="button" aria-label="More options">⋯</button>
                        {/* dropdown menu */}
                        {isMenuOpen && (
                            <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:ring-white/10">
                                {/* <button
                                    onClick={() => { onToggleProfile(); setIsMenuOpen(false); }}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    {showProfile ? 'Hide Profile Details' : 'View Profile Details'}
                                </button> */}

                                <button
                                    onClick={() => { console.log('Muted'); setIsMenuOpen(false); }}
                                    className=" w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Mute Notifications
                                </button>

                                <hr className="my-1 border-slate-100 dark:border-slate-800" />

                                <button
                                    onClick={() => { onDeselectUser(); setIsMenuOpen(false); onCloseProfile(); }}
                                    className="w-full px-4 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                >
                                    Close Conversation
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 sm:px-6 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.03),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#f1f5f9)] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.05),_transparent_45%)]">
                <div className="mx-auto flex max-w-3xl flex-col gap-4">
                    <div className="self-center rounded-full bg-white/80 px-4 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-700">Today</div>

                    {panelMessages.map((message, index) => (
                        <MessageBubble key={index} message={message} />
                    ))}

                    {attachScrollTarget && <div ref={messagesEndRef} />}
                </div>
            </div>

            {attachScrollTarget && <MessageInput theme={theme} onSendMessage={onSendMessage} />}
        </div>
    );

    return (
        <div className="relative flex h-full min-h-0 flex-1 overflow-hidden">
            <div
                className={`absolute inset-0 flex items-center justify-center px-6 text-center text-slate-500 transition-all duration-500 ease-out dark:text-slate-400 ${viewState.currentUser
                    ? 'pointer-events-none translate-y-4 scale-[0.98] opacity-0'
                    : 'translate-y-0 scale-100 opacity-100'
                    }`}
            >
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Welcome to Chatly</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pick a user from the sidebar to start chatting.</p>
                </div>
            </div>

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
    );
}

export default ChatContainer;