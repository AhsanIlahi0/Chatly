function MessageBubble({ message }) {
    // Helper function to safely format the time string
    const formatTime = (timeData) => {
        if (!timeData) return "";
        
        // If it's a raw Date object, convert to string
        if (timeData instanceof Date) {
            return timeData.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // If it's already a string (like from your backend JSON response), just return it
        return typeof timeData === 'string' ? timeData : "";
    };

    return (
        <div className={`flex ${message.sent ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[55%] rounded-2xl px-4 py-3 shadow-sm ring-1 ${
                    message.sent
                        ? 'rounded-br-md bg-slate-900 text-white ring-slate-900/10 dark:bg-sky-500 dark:text-slate-950 dark:ring-sky-500/20'
                        : 'rounded-bl-md bg-white text-slate-800 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700'
                }`}
            >
                <p className="break-words whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                <div className={`mt-2 text-[11px] ${message.sent ? 'text-slate-300 dark:text-slate-900/70' : 'text-slate-400 dark:text-slate-400'}`}>
                    
                    {/* 🛠️ FIX HERE: Wrap it in the formatter function */}
                    {formatTime(message.time)} 

                </div>
            </div>
        </div>
    );
}

export default MessageBubble;