import Sidebar from "./components/sidebar/Sidebar";
import ActiveChat from "./components/chat/ActiveChat";
import DetailTab from "./components/profile/DetailTab";
import emmaAvatar from "./images/1avatar.png";
import { useDarkMode } from './hooks/useDarkMode';
import { useSocket } from './hooks/useSocket';
import axios from 'axios';
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {API_URL} from './config';
function App() {
    const [theme, toggleTheme] = useDarkMode();
    const [isDetailTabOpen, setIsDetailTabOpen] = useState(false);
    const [conversations, setConversations] = useState({});
    const [activeUserId, setActiveUserId] = useState(null);

    // 🚀 STICKY INITIALIZATION FROM LOCAL STORAGE
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem("chatly_user");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (err) {
            console.error("Failed to parse local storage session:", err);
            return null;
        }
    }); 

    const [users, setUsers] = useState([]); 
    
    // AUTHENTICATION FORM STATES
    const [isSignup, setIsSignup] = useState(false); 
    const [nameInput, setNameInput] = useState("");   
    const [emailInput, setEmailInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    // Grab current logged-in user ID dynamically
    const currentUserId = useMemo(() => currentUser?._id || null, [currentUser]);

    const activeUser = useMemo(
        () => users.find((user) => user.id === activeUserId) ?? null,
        [users, activeUserId]
    );

    const applyAvatarUpdate = useCallback((userId, avatarUrl) => {
        setUsers((currentUsers) =>
            currentUsers.map((user) => (
                user.id === userId ? { ...user, avatar: avatarUrl } : user
            ))
        );

        setCurrentUser((currentUserState) => (
            currentUserState?._id === userId
                ? { ...currentUserState, avatar: avatarUrl }
                : currentUserState
        ));

        setConversations((currentConversations) => {
            let didChange = false;
            const next = {};

            for (const [partnerId, chatMessages] of Object.entries(currentConversations)) {
                next[partnerId] = chatMessages;
            }

            if (didChange) {
                return next;
            }

            return currentConversations;
        });

        try {
            const savedUser = localStorage.getItem('chatly_user');
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                if (parsed?._id === userId) {
                    localStorage.setItem('chatly_user', JSON.stringify({ ...parsed, avatar: avatarUrl }));
                }
            }
        } catch (error) {
            console.error('Failed to sync avatar in local storage:', error);
        }
    }, []);

    // Inbound socket message receiver callback
    const handleIncomingLiveMessage = useCallback((msg) => {
        if (!currentUserId) return;
        const isReceived = msg.senderId !== currentUserId;
        const partnerId = isReceived ? msg.senderId : msg.receiverId;

        setConversations(prev => {
            const existingChat = prev[partnerId] || [];
            if (existingChat.some(m => m.id === msg.id)) {
                return prev;
            }

            return {
                ...prev,
                [partnerId]: [
                    ...existingChat,
                    {
                        id: msg.id || Date.now().toString(),
                        text: msg.text,
                        file: msg.file,
                        time: new Date(msg.time),
                        sent: !isReceived,
                        status: msg.status || 'sent'
                    }
                ]
            };
        });
    }, [currentUserId]);

    const handleMessageStatusUpdated = useCallback((statusPayload) => {
        const { messageIds = [], status } = statusPayload || {};
        const normalizedIds = messageIds.map(String);
        if (!normalizedIds.length || !status) return;

        setConversations((prev) => {
            let didChange = false;
            const next = {};

            for (const [partnerId, chatMessages] of Object.entries(prev)) {
                next[partnerId] = chatMessages.map((message) => {
                    if (!normalizedIds.includes(String(message.id))) {
                        return message;
                    }

                    didChange = true;
                    return { ...message, status };
                });
            }

            return didChange ? next : prev;
        });
    }, []);

    // Instantiate socket hook passing current logged-in user ID safely
    // 💡 Note: Ensure your useSocket hook gracefully handles a null/undefined ID!
    const handleAvatarChanged = useCallback((avatarPayload) => {
        const userId = avatarPayload?.userId || avatarPayload?.id;
        const avatarUrl = avatarPayload?.avatarUrl;

        if (!userId || !avatarUrl) return;

        applyAvatarUpdate(userId, avatarUrl);
    }, [applyAvatarUpdate]);

    const { emitSendMessage, emitMarkMessagesRead, emitUpdateAvatar } = useSocket(currentUserId, handleIncomingLiveMessage, undefined, handleAvatarChanged, handleMessageStatusUpdated);

    // FETCH DYNAMIC DIRECTORY ONCE LOGGED IN
    useEffect(() => {
        if (!currentUserId) return;

        const fetchUsers = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/auth/all-users`);

                const dynamicList = res.data
                    .filter(u => u._id !== currentUserId)
                    .map(u => ({
                        id: u._id,
                        name: u.name,
                        avatar: u.avatar,
                        status: u.status || "offline",
                        unread: 0
                    }));
                setUsers(dynamicList);
            } catch (err) {
                console.error("Error pulling live user list directory:", err);
            }
        };

        fetchUsers();
    }, [currentUserId]);

    const activeMessages = activeUserId ? conversations[activeUserId] ?? [] : [];
    const lastReadReceiptSignatureRef = useRef('');

    useEffect(() => {
        if (!currentUserId || !activeUserId) return;

        const unreadIncoming = activeMessages.filter((message) => !message.sent && message.status !== 'read');
        const unreadSignature = unreadIncoming.map((message) => message.id).join(',');

        if (!unreadIncoming.length) {
            lastReadReceiptSignatureRef.current = '';
            return;
        }

        if (lastReadReceiptSignatureRef.current === unreadSignature) return;

        lastReadReceiptSignatureRef.current = unreadSignature;

        emitMarkMessagesRead(activeUserId);
    }, [currentUserId, activeUserId, activeMessages, emitMarkMessagesRead]);

    const handleSelectUser = async (userId) => {
        setActiveUserId(userId);
        setUsers((currentUsers) =>
            currentUsers.map((user) =>
                user.id === userId ? { ...user, unread: 0 } : user
            )
        );

        try {
            const res = await axios.get(`${API_URL}/api/messages/${currentUserId}/${userId}`);
            const formattedMessages = res.data.map(msg => ({
                id: msg._id,
                text: msg.text,
                file: msg.file,
                time: new Date(msg.createdAt),
                sent: msg.sender === currentUserId,
                status: msg.status || 'sent'
            }));

            setConversations(prev => ({ ...prev, [userId]: formattedMessages }));
        } catch (err) {
            console.error("Failed to pull message history:", err);
        }
    };

    const handleSendMessage = async (messageText, selectedFile) => {
        if (!activeUserId) return;

        const processAndSendMessage = (text, filePayload = null) => {
            emitSendMessage(activeUserId, text, filePayload);
        };

        if (selectedFile) {
            try {
                let fileToUpload = selectedFile;
                if (selectedFile.type.startsWith("image/") && selectedFile.size > 2 * 1024 * 1024) {
                    fileToUpload = await new Promise((resolve) => {
                        const img = new Image();
                        img.src = URL.createObjectURL(selectedFile);
                        img.onload = () => {
                            const canvas = document.createElement("canvas");
                            const ctx = canvas.getContext("2d");
                            const MAX_WIDTH = 1200;
                            const MAX_HEIGHT = 1200;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                            } else {
                                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                            }
                            canvas.width = width; canvas.height = height;
                            ctx.drawImage(img, 0, 0, width, height);
                            canvas.toBlob((blob) => {
                                resolve(new File([blob], selectedFile.name, { type: "image/jpeg" }));
                            }, "image/jpeg", 0.7);
                        };
                    });
                }

                const formData = new FormData();
                formData.append("file", fileToUpload);
                formData.append("upload_preset", "xgx72g5u");
                const resourceType = fileToUpload.type.startsWith("image/") ? "image" : "raw";
                formData.append("resource_type", resourceType);

                const response = await fetch(`https://api.cloudinary.com/v1_1/dhwdd6d0e/${resourceType}/upload`, { method: "POST", body: formData });
                if (!response.ok) throw new Error("Cloudinary error");
                const data = await response.json();

                processAndSendMessage(messageText, { name: fileToUpload.name, type: fileToUpload.type, url: data.secure_url });
            } catch (error) {
                console.error("Cloudinary failed:", error);
            }
        } else {
            processAndSendMessage(messageText, null);
        }
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file || !currentUserId) return;

        if (!file.type.startsWith('image/')) {
            alert('Please choose an image file for your avatar.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'xgx72g5u');
            formData.append('resource_type', 'image');

            const response = await fetch('https://api.cloudinary.com/v1_1/dhwdd6d0e/image/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Avatar upload failed');
            }

            const data = await response.json();
            const avatarUrl = data.secure_url;

            await axios.put(`${API_URL}/api/auth/avatar`, {
                userId: currentUserId,
                avatarUrl
            });

            applyAvatarUpdate(currentUserId, avatarUrl);
            emitUpdateAvatar({ userId: currentUserId, avatarUrl });
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            alert(error?.message || 'Avatar upload failed. Try again.');
        }
    };

    // UNIFIED AUTHENTICATION ROUTER CONTROLLER
    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        if (!emailInput.trim() || !passwordInput.trim()) return;
        if (isSignup && !nameInput.trim()) return;

        setAuthLoading(true);

        const endpoint = isSignup ? "signup" : "login";
        const payload = isSignup
            ? { name: nameInput.trim(), email: emailInput.trim().toLowerCase(), password: passwordInput.trim() }
            : { email: emailInput.trim().toLowerCase(), password: passwordInput.trim() };

        try {
            const res = await axios.post(`${API_URL}/api/auth/${endpoint}`, payload);
            
            // 🚀 STICK TO LOCAL STORAGE
            localStorage.setItem("chatly_user", JSON.stringify(res.data));
            setCurrentUser(res.data);

            setNameInput("");
            setEmailInput("");
            setPasswordInput("");
        } catch (err) {
            console.error("Authentication action failed:", err);
            alert(err.response?.data?.error || "Authentication dropped. Try again.");
        } finally {
            setAuthLoading(false);
        }
    };

    // LOGOUT ACTION UTILITY
    const handleLogout = () => {
        localStorage.removeItem("chatly_user");
        setCurrentUser(null);
        setActiveUserId(null);
    };

    // 🚀 GATEKEEPER INTERFACE (Sign In / Sign Up Card)
   if (!currentUser) {
        return (
            <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-ink px-4 font-sans text-bone">
                {/* Ambient signal glow — the same "live" motif as the rest of the app */}
                <div className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-ember/20 blur-[120px]" />
                <div className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-teal/10 blur-[120px]" />

                <form onSubmit={handleAuthSubmit} className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-ink-soft/80 p-6 shadow-2xl backdrop-blur-sm animate-rise-in sm:p-8">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ember text-ink">
                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                                <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.4 3.6a.6.6 0 0 1-1-.46V5a1 1 0 0 1 1-1Z" />
                            </svg>
                        </span>
                        <h2 className="font-display text-2xl font-bold tracking-tight text-bone">
                            {isSignup ? "Create an Account" : "Welcome back"}
                        </h2>
                        <p className="mt-1.5 text-xs text-dusk">
                            {isSignup ? "Sign up to start messaging in real-time" : "Sign in to catch up on conversations"}
                        </p>
                    </div>

                    {/* Sign in / Sign up segmented switch */}
                    <div className="mb-6 flex rounded-xl bg-white/5 p-1">
                        <button
                            type="button"
                            onClick={() => { setIsSignup(false); setNameInput(""); }}
                            className={`flex-1 rounded-lg py-2 text-xs font-semibold uppercase tracking-wide transition-all ${!isSignup ? 'bg-ember text-ink shadow-sm' : 'text-dusk hover:text-bone'}`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => { setIsSignup(true); setNameInput(""); }}
                            className={`flex-1 rounded-lg py-2 text-xs font-semibold uppercase tracking-wide transition-all ${isSignup ? 'bg-ember text-ink shadow-sm' : 'text-dusk hover:text-bone'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {isSignup && (
                        <div className="mb-4">
                            <label className="block font-mono text-[10px] font-semibold uppercase tracking-widest text-dusk mb-2">Display Name</label>
                            <input
                                type="text"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder="Alice Smith"
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-bone placeholder-dusk/60 focus:outline-none focus:border-ember focus:bg-white/[0.07] transition-all"
                                required
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-widest text-dusk mb-2">Email Address</label>
                        <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-bone placeholder-dusk/60 focus:outline-none focus:border-ember focus:bg-white/[0.07] transition-all"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-widest text-dusk mb-2">Password</label>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-bone placeholder-dusk/60 focus:outline-none focus:border-ember focus:bg-white/[0.07] transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full rounded-xl bg-ember py-3 text-sm font-bold text-ink transition-colors hover:bg-ember-soft disabled:bg-white/10 disabled:text-dusk shadow-lg shadow-ember/20"
                    >
                        {authLoading ? "Processing..." : isSignup ? "Create Free Account" : "Enter Chatroom"}
                    </button>
                </form>
            </div>
        );
    }

    // Main App View Dashboard (Triggers once logged in)
    return (
        <div className="flex w-full h-screen overflow-hidden bg-parchment text-ink dark:bg-ink dark:text-bone">
            <Sidebar
                users={users}
                activeUserId={activeUserId}
                onSelectUser={handleSelectUser}
                currentUser={currentUser}
                onAvatarUpload={handleAvatarUpload}
                isChatActive={Boolean(activeUserId)}
            />
            <ActiveChat
                            onLogout={handleLogout} // Passed logout action down

                theme={theme}
                setTheme={toggleTheme}
                activeUser={activeUser}
                messages={activeMessages}
                onSendMessage={handleSendMessage}
                isDetailTabOpen={isDetailTabOpen}
                onCloseProfile={() => setIsDetailTabOpen(false)}
                onDeselectUser={() => { setActiveUserId(null) }}
                onOpenProfile={() => setIsDetailTabOpen(true)}
                onToggleProfile={() => setIsDetailTabOpen((currentState) => !currentState)}
                isChatActive={Boolean(activeUserId)}
            />
            <DetailTab
                activeUser={activeUser}
                isOpen={isDetailTabOpen}
                onClose={() => setIsDetailTabOpen(false)}
                theme={theme}
                setTheme={toggleTheme}
            />
        </div>
    );
}

export default App;