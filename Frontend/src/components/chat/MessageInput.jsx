import { useState } from 'react';
import attachLightIcon from '../../images/attach-light.png'; 
import attachDarkIcon from '../../images/attach-dark.png'; 
import sendLightIcon from '../../images/sendLight.png'; 
import sendDarkIcon from '../../images/sendDark.png'; 

function MessageInput({ theme, onSendMessage }) {
    const [messageText, setMessageText] = useState('');
    // 1. Add state to hold the selected file
    const [selectedFile, setSelectedFile] = useState(null);

    const handleSubmit = (event) => {
        event.preventDefault();

        // 2. Allow submit if there is EITHER text OR a file attached
        if (!messageText.trim() && !selectedFile) {
            return;
        }

        // 3. Pass both the text and the file to your parent component
        onSendMessage(messageText, selectedFile);
        
        // 4. Reset the input fields after sending
        setMessageText('');
        setSelectedFile(null);
        document.getElementById('file-upload').value = ''; // Resets the actual file picker
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
        }
    };

    // Helper to remove the file before sending
    const clearFile = () => {
        setSelectedFile(null);
        document.getElementById('file-upload').value = '';
    };

    return (
        <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
            {/* 📁 FILE PREVIEW UI: Shows up only when a file is selected */}
            {selectedFile && (
                <div className="mx-auto max-w-3xl mb-2 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300 w-fit">
                    <span className="truncate max-w-[200px] font-medium">{selectedFile.name}</span>
                    <button 
                        type="button" 
                        onClick={clearFile}
                        className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-slate-300 dark:hover:bg-slate-600"
                        title="Remove file"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <label
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 shrink-0"
                    aria-label="Attach file"
                >
                    <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        // Save the file to state instead of just console logging it
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                    <img
                        src={theme === 'light' ? attachLightIcon : attachDarkIcon}
                        alt="Attach file"
                        className="h-5 w-5"
                    />
                </label>
                
                <textarea
                    id='txtarea'
                    className="min-h-[29px] flex-1 resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500 py-1"
                    placeholder="Type a message..."
                    rows="1"
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={handleKeyDown}
                />
                
                <button
                    className={`cursor-pointer rounded-full px-5 py-2.5 text-sm font-medium transition-colors shrink-0 ${
                        messageText.trim() || selectedFile 
                        ? 'bg-sky-500 text-white hover:bg-sky-600 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400' 
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                    }`}
                    type="submit"
                    disabled={!messageText.trim() && !selectedFile}
                >
                    <img
                        src={theme === 'light' ? sendLightIcon : sendDarkIcon}
                        alt="Send message"
                        className="h-5 w-5 opacity-90"
                    />
                </button>
            </div>
        </form>
    );
}

export default MessageInput;