import { useEffect, useMemo, useState } from 'react';

function MessageBubble({ message, currentUserId, onDeleteMessage }) {
    const formatTime = (timeData) => {
        if (!timeData) return "";
        if (timeData instanceof Date) {
            return timeData.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return typeof timeData === 'string' ? timeData : "";
    };

    const isImage = (fileType) => fileType && fileType.startsWith('image/');
    const isAudio = (fileType) => fileType && fileType.startsWith('audio/');
    const isSentMessage = Boolean(message.sent);
    const messageTimestamp = useMemo(() => {
        if (!message.time) return null;

        const parsedTime = message.time instanceof Date ? message.time : new Date(message.time);
        return Number.isNaN(parsedTime.getTime()) ? null : parsedTime;
    }, [message.time]);

    const [canDelete, setCanDelete] = useState(() => {
        if (!isSentMessage || !onDeleteMessage || !currentUserId || !messageTimestamp) return false;

        return Date.now() - messageTimestamp.getTime() < 10 * 60 * 1000;
    });

    useEffect(() => {
        if (!isSentMessage || !onDeleteMessage || !currentUserId || !messageTimestamp) {
            setCanDelete(false);
            return undefined;
        }

        const tenMinutes = 10 * 60 * 1000;
        const elapsed = Date.now() - messageTimestamp.getTime();

        if (elapsed >= tenMinutes) {
            setCanDelete(false);
            return undefined;
        }

        setCanDelete(true);

        const timerId = window.setTimeout(() => {
            setCanDelete(false);
        }, tenMinutes - elapsed);

        return () => window.clearTimeout(timerId);
    }, [currentUserId, isSentMessage, messageTimestamp, onDeleteMessage]);

    const TickIcon = ({ double = false, className = '' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
            {double && <path d="M15 6L4 17" />}
        </svg>
    );

    const renderStatusIcon = () => {
        if (!isSentMessage) return null;

        if (message.status === 'read') {
            return <TickIcon double className="h-3.5 w-3.5 text-[#3b82f6]" />;
        }

        if (message.status === 'delivered') {
            return <TickIcon double className="h-3.5 w-3.5 text-white/80 dark:text-bone/80" />;
        }

        return <TickIcon className="h-3.5 w-3.5 text-white/75 dark:text-bone/75" />;
    };

    return (
        <div className={`flex animate-rise-in ${isSentMessage ? 'justify-end' : 'justify-start'} mb-1`}>
            <div
                className={`max-w-[82%] sm:max-w-[65%] md:max-w-[55%] flex flex-col rounded-2xl shadow-sm overflow-hidden ${isSentMessage
                    ? 'rounded-br-md bg-gradient-to-br from-ember to-[#ff5a35] text-white shadow-ember/10'
                    : 'rounded-bl-md bg-white text-ink ring-1 ring-bone dark:bg-ink-soft dark:text-bone dark:ring-ink-line'
                    }`}
            >
                {/* 📁 FILE ATTACHMENT RENDERER */}
                {message.file && (
                    <div className={`${message.text ? 'border-b border-white/15 dark:border-black/10' : ''}`}>
                        {isImage(message.file.type) ? (
                            <a href={message.file.url} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={message.file.url}
                                    alt={message.file.name || "Attached image"}
                                    className="w-full h-auto object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                                />
                            </a>
                        ) : isAudio(message.file.type) ? (
                            <div className={`p-4 ${isSentMessage ? 'bg-white/10' : 'bg-bone/40 dark:bg-white/5'}`}>
                                <div className="mb-2 flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isSentMessage ? 'bg-white/15' : 'bg-white dark:bg-ink'}`}>
                                        <svg className={`h-5 w-5 ${isSentMessage ? 'text-white' : 'text-ink dark:text-bone'}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                            <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm5 9a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-2.07A7 7 0 0 0 19 12h-2Z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block truncate text-sm font-semibold">Voice note</span>
                                        <span className="font-mono text-[10px] uppercase tracking-wide opacity-70">Audio message</span>
                                    </div>
                                </div>
                                <audio controls preload="metadata" src={message.file.url} className="w-64 max-w-full" />
                            </div>
                        ) : (
                            <a
                                href={message.file.url}
                                download={message.file.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 p-4 hover:opacity-80 transition-opacity ${isSentMessage ? 'bg-white/10' : 'bg-bone/40 dark:bg-white/5'
                                    }`}
                            >
                                <svg className="w-8 h-8 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-semibold truncate">{message.file.name || "Attachment"}</span>
                                    <span className="font-mono text-[10px] tracking-wide opacity-70 uppercase">{message.file.type?.split('/')[1] || 'FILE'}</span>
                                </div>
                            </a>
                        )}
                    </div>
                )}

                {/* 💬 TEXT RENDERER */}
                {message.text && (
                    <div className="px-4 pt-3 pb-1">
                        <p className="break-words whitespace-pre-wrap text-[14px] leading-6">{message.text}</p>
                    </div>
                )}

                {/* 🕒 TIMESTAMP */}
                <div className={`px-4 pb-2.5 flex items-center justify-end gap-1.5 ${!message.text && message.file ? 'pt-2' : ''} font-mono text-[10px] tracking-wide ${isSentMessage ? 'text-white/75' : 'text-dusk/80'
                    }`}>
                    {canDelete && (
                        <button
                            type="button"
                            onClick={onDeleteMessage}
                            className="rounded-full p-1 text-current transition-colors hover:bg-white/10 hover:text-rose-200 dark:hover:bg-white/5"
                            aria-label="Delete message"
                            title="Delete message"
                        >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M6 6l1 14h10l1-14" />
                            </svg>
                        </button>
                    )}
                    <span>{formatTime(message.time)}</span>
                    {renderStatusIcon()}
                </div>
            </div>
        </div>
    );
}

export default MessageBubble;
