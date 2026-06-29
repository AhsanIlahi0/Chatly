function MessageBubble({ message }) {
    const formatTime = (timeData) => {
        if (!timeData) return "";
        if (timeData instanceof Date) {
            return timeData.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return typeof timeData === 'string' ? timeData : "";
    };

    const isImage = (fileType) => fileType && fileType.startsWith('image/');

    return (
        <div className={`flex animate-rise-in ${message.sent ? 'justify-end' : 'justify-start'} mb-1`}>
            <div
                className={`max-w-[65%] sm:max-w-[55%] flex flex-col rounded-2xl shadow-sm overflow-hidden ${message.sent
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
                        ) : (
                            <a
                                href={message.file.url}
                                download={message.file.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 p-4 hover:opacity-80 transition-opacity ${message.sent ? 'bg-white/10' : 'bg-bone/40 dark:bg-white/5'
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
                <div className={`px-4 pb-2.5 flex items-center justify-end gap-1.5 ${!message.text && message.file ? 'pt-2' : ''} font-mono text-[10px] tracking-wide ${message.sent ? 'text-white/75' : 'text-dusk/80'
                    }`}>
                    <span>{formatTime(message.time)}</span>
                </div>
            </div>
        </div>
    );
}

export default MessageBubble;
