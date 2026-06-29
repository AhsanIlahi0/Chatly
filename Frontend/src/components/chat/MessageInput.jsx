import { useState } from 'react';

function MessageInput({ onSendMessage }) {
    const [messageText, setMessageText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!messageText.trim() && !selectedFile) {
            return;
        }

        onSendMessage(messageText, selectedFile);

        setMessageText('');
        setSelectedFile(null);
        document.getElementById('file-upload').value = '';
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        document.getElementById('file-upload').value = '';
    };

    const canSend = Boolean(messageText.trim() || selectedFile);

    return (
        <form onSubmit={handleSubmit} className="border-t border-bone bg-white px-4 py-4 sm:px-6 dark:border-ink-line dark:bg-ink">
            {/* 📁 FILE PREVIEW */}
            {selectedFile && (
                <div className="mx-auto max-w-3xl mb-2 flex items-center gap-2 rounded-lg bg-bone/50 px-3 py-2 text-sm text-ink dark:bg-white/5 dark:text-bone w-fit">
                    <span className="truncate max-w-[200px] font-medium">{selectedFile.name}</span>
                    <button
                        type="button"
                        onClick={clearFile}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-dusk hover:bg-bone hover:text-ink dark:hover:bg-white/10 dark:hover:text-bone"
                        title="Remove file"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-bone bg-parchment/60 px-3 py-2.5 shadow-sm dark:border-ink-line dark:bg-ink-soft">
                <label
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-dusk transition-colors hover:bg-bone hover:text-ink dark:hover:bg-white/10 dark:hover:text-bone shrink-0"
                    aria-label="Attach file"
                >
                    <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.667 3.667 0 1 1 5.18 5.18l-9.2 9.19a1.833 1.833 0 0 1-2.59-2.59l8.49-8.48" />
                    </svg>
                </label>

                <textarea
                    id='txtarea'
                    className="min-h-[28px] mb-[4px] flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-dusk/70 dark:text-bone dark:placeholder:text-dusk py-1.5"
                    placeholder="Type a message..."
                    rows="1"
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={handleKeyDown}
                />

                <button
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${
                        canSend
                            ? 'bg-ember text-white hover:bg-[#ff5a35] shadow-md shadow-ember/30 active:scale-95'
                            : 'bg-bone text-dusk/60 cursor-not-allowed dark:bg-white/5 dark:text-dusk/50'
                    }`}
                    type="submit"
                    disabled={!canSend}
                    aria-label="Send message"
                >
                    <svg className="h-[18px] w-[18px] translate-x-px" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.4 20.4 21 12 3.4 3.6a.6.6 0 0 0-.86.68L5.2 12 2.54 19.72a.6.6 0 0 0 .86.68Z" />
                    </svg>
                </button>
            </div>
        </form>
    );
}

export default MessageInput;
