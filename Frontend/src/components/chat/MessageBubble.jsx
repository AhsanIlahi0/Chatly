function MessageBubble({ message }) {
    // Helper function to safely format the time string
    const formatTime = (timeData) => {
        if (!timeData) return "";

        if (timeData instanceof Date) {
            return timeData.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        return typeof timeData === 'string' ? timeData : "";
    };

    // Helper to check if the file is an image based on its type/extension
    const isImage = (fileType) => fileType && fileType.startsWith('image/');

    return (
        <div className={`flex ${message.sent ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
                className={`max-w-[65%] sm:max-w-[55%] flex flex-col rounded-2xl shadow-sm ring-1 overflow-hidden ${message.sent
                    ? 'rounded-br-md bg-slate-900 text-white ring-slate-900/10 dark:bg-sky-500 dark:text-slate-950 dark:ring-sky-500/20'
                    : 'rounded-bl-md bg-white text-slate-800 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700'
                    }`}
            >
                {/* 📁 FILE ATTACHMENT RENDERER */}
                {message.file && (
                    <div className={`${message.text ? 'border-b border-white/10 dark:border-slate-950/10' : ''}`}>
                        {isImage(message.file.type) ? (
                            // Render Image File
                            <a href={message.file.url} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={message.file.url}
                                    alt={message.file.name || "Attached image"}
                                    className="w-full h-auto object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                                />
                            </a>
                        ) : (
                            // Render Non-Image File (PDF, Doc, ZIP, etc.)
                            <a
                                href={message.file.url}
                                download={message.file.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 p-4 hover:opacity-80 transition-opacity ${message.sent ? 'bg-white/10 dark:bg-black/10' : 'bg-slate-100 dark:bg-slate-700'
                                    }`}
                            >
                                {/* Generic File Icon SVG */}
                                <svg className="w-8 h-8 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-semibold truncate">{message.file.name || "Attachment"}</span>
                                    <span className="text-xs opacity-70 uppercase">{message.file.type?.split('/')[1] || 'FILE'}</span>
                                </div>
                            </a>
                        )}
                    </div>
                )}

                {/* 💬 TEXT RENDERER */}
                {message.text && (
                    <div className="px-4 pt-3 pb-1">
                        <p className="break-words whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                    </div>
                )}


                {/* 🕒 TIME & WHATSAPP TICK RENDERER */}
                <div className={`px-4 pb-3 flex items-center justify-end gap-1.5 ${!message.text && message.file ? 'pt-2' : ''} text-[11px] ${message.sent ? 'text-slate-300 dark:text-slate-900/70' : 'text-slate-400 dark:text-slate-400'
                    }`}>
                    <span>{formatTime(message.time)}</span>


                   {/* {message.sent && (
                        <span
                        className={`material-symbols-outlined text-[14px] leading-none select-none ${message.status === 'read'
                            ? 'text-sky-400 dark:text-blue-600 font-bold'
                            : 'opacity-60 text-slate-300 dark:text-slate-900'
                            }`}
                            >
                            {/* 🛠️ Safe Fallback: mapping undefined or 'sent' status cleanly to a single checkmark }
                            {(!message.status || message.status === 'sent') && 'done'}
                            {message.status === 'delivered' && 'done_all'}
                            {message.status === 'read' && 'done_all'}
                            </span>
                        )} */}
                    
                </div>
            </div>
        </div>
    );
}

export default MessageBubble;