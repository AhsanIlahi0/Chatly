import { useEffect, useRef, useState } from 'react';

function MessageInput({ onSendMessage }) {
    const [messageText, setMessageText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [recordingError, setRecordingError] = useState('');
    const [pendingVoiceFile, setPendingVoiceFile] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioStreamRef = useRef(null);
    const timerRef = useRef(null);
    const shouldSendRecordedVoiceRef = useRef(false);

    const clearFileInput = () => {
        const fileInput = document.getElementById('file-upload');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const stopAudioStream = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach((track) => track.stop());
            audioStreamRef.current = null;
        }
    };

    const stopRecording = () => {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
        }
        stopAudioStream();
    };

    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, []);

    const startRecording = async () => {
        try {
            setRecordingError('');
            setSelectedFile(null);
            setPendingVoiceFile(null);
            clearFileInput();
            shouldSendRecordedVoiceRef.current = false;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;
            audioChunksRef.current = [];

            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const mimeType = recorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                const extension = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
                const fileName = `voice-note-${Date.now()}.${extension}`;
                const voiceFile = new File([audioBlob], fileName, { type: mimeType });
                setRecordingSeconds(0);
                audioChunksRef.current = [];
                setIsRecording(false);
                setPendingVoiceFile(voiceFile);
                stopAudioStream();

                if (shouldSendRecordedVoiceRef.current) {
                    onSendMessage('', voiceFile);
                    setPendingVoiceFile(null);
                    shouldSendRecordedVoiceRef.current = false;
                }
            };

            recorder.start();
            setIsRecording(true);
            setRecordingSeconds(0);

            timerRef.current = window.setInterval(() => {
                setRecordingSeconds((current) => current + 1);
            }, 1000);
        } catch (error) {
            setRecordingError(error?.message || 'Microphone access is required for voice notes.');
            stopAudioStream();
            setIsRecording(false);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (isRecording) {
            shouldSendRecordedVoiceRef.current = true;
            stopRecording();
            return;
        }

        if (!messageText.trim() && !selectedFile) {
            return;
        }

        onSendMessage(messageText, selectedFile);

        setMessageText('');
        setSelectedFile(null);
        clearFileInput();
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        clearFileInput();
    };

    const cancelRecording = () => {
        shouldSendRecordedVoiceRef.current = false;
        setPendingVoiceFile(null);
        setRecordingSeconds(0);
        setIsRecording(false);

        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            recorder.onstop = null;
            recorder.stop();
        }

        audioChunksRef.current = [];
        stopAudioStream();
    };

    const handleRecordToggle = () => {
        if (isRecording) {
            cancelRecording();
        } else {
            startRecording();
        }
    };

    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
        const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
        return `${minutes}:${remainingSeconds}`;
    };

    const isAudioFile = selectedFile?.type?.startsWith('audio/');

    return (
        <form onSubmit={handleSubmit} className="border-t border-bone bg-white px-4 py-4 sm:px-6 dark:border-ink-line dark:bg-ink">
            {recordingError && (
                <div className="mx-auto mb-2 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                    {recordingError}
                </div>
            )}

            {isRecording && (
                <div className="mx-auto mb-2 flex max-w-3xl items-center gap-3 rounded-xl border border-ember/20 bg-ember/10 px-3 py-2 text-sm text-ember dark:text-ember-soft">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-ember" />
                    <span className="font-semibold">Recording voice note</span>
                    <span className="font-mono text-[11px] uppercase tracking-widest">{formatDuration(recordingSeconds)}</span>
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            type="button"
                            onClick={cancelRecording}
                            className="rounded-full border border-ember/20 bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-ember transition-colors hover:bg-white dark:bg-ink-soft dark:hover:bg-ink"
                        >
                            Cancel
                        </button>
                        {/* <button
                            type="button"
                            onClick={handleSubmit}
                            className="rounded-full bg-ember px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#ff5a35]"
                        >
                            Send
                        </button> */}
                    </div>
                </div>
            )}

            {/* 📁 FILE PREVIEW */}
            {selectedFile && !isAudioFile && (
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

                <button
                    type="button"
                    onClick={handleRecordToggle}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${isRecording
                        ? 'bg-rose-500 text-white hover:bg-rose-600'
                        : 'text-dusk hover:bg-bone hover:text-ink dark:hover:bg-white/10 dark:hover:text-bone'
                        }`}
                    aria-label={isRecording ? 'Stop recording voice note' : 'Record voice note'}
                    title={isRecording ? 'Stop recording' : 'Record voice note'}
                >
                    {isRecording ? (
                        <span className="h-3.5 w-3.5 rounded-sm bg-current" />
                    ) : (
                        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 11v1a7 7 0 0 1-14 0v-1" />
                            <path d="M12 19v3" />
                        </svg>
                    )}
                </button>

                <textarea
                    id='txtarea'
                    style={{outline: 'none', resize: 'none'}}
                    className="min-h-[28px] mb-[4px] flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-dusk/70 dark:text-bone dark:placeholder:text-dusk py-1.5"
                    placeholder="Type a message..."
                    rows="1"
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={handleKeyDown}
                />

                <button
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${
                        messageText.trim() || selectedFile || isRecording || pendingVoiceFile
                            ? 'bg-ember text-white hover:bg-[#ff5a35] shadow-md shadow-ember/30 active:scale-95'
                            : 'bg-bone text-dusk/60 cursor-not-allowed dark:bg-white/5 dark:text-dusk/50'
                    }`}
                    type="submit"
                    disabled={!messageText.trim() && !selectedFile && !isRecording && !pendingVoiceFile}
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
