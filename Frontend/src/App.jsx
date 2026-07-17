import Sidebar from "./components/sidebar/Sidebar";
import ActiveChat from "./components/chat/ActiveChat";
import DetailTab from "./components/profile/DetailTab";
import emmaAvatar from "./images/1avatar.png";
import { useDarkMode } from './hooks/useDarkMode';
import { useSocket } from './hooks/useSocket';
import axios from 'axios';
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { API_URL } from './config';

function App() {
    const [theme, toggleTheme] = useDarkMode();
    const [isDetailTabOpen, setIsDetailTabOpen] = useState(false);
    const [conversations, setConversations] = useState({});
    const [activeUserId, setActiveUserId] = useState(() => {
        try {
            return localStorage.getItem('chatly_active_user') || null;
        } catch (error) {
            console.error('Failed to read active chat from local storage:', error);
            return null;
        }
    });

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
    const usersRef = useRef(users);
    const activeUserIdRef = useRef(activeUserId);

    // AUTHENTICATION FORM STATES
    const [isSignup, setIsSignup] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    // 🚀 NEW OTP VERIFICATION STATES
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [otpInput, setOtpInput] = useState("");
    const [otpError, setOtpError] = useState("");

    // 🚀 GOOGLE BUTTON TARGET REFERENCE
    const googleButtonRef = useRef(null);

    // Grab current logged-in user ID dynamically
    const currentUserId = useMemo(() => currentUser?._id || null, [currentUser]);

    const activeUser = useMemo(
        () => users.find((user) => user.id === activeUserId) ?? null,
        [users, activeUserId]
    );

    useEffect(() => {
        usersRef.current = users;
    }, [users]);

    useEffect(() => {
        activeUserIdRef.current = activeUserId;
    }, [activeUserId]);
    
    // 🚀 INITIALIZE GOOGLE AUTH ONCE ON LOAD (Removed isSignup dependency to prevent re-mount errors)
    useEffect(() => {
        if (currentUser) return;
        
        const initializeGoogleSignIn = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    callback: handleGoogleLoginSuccess,
                });

                if (googleButtonRef.current) {
                    window.google.accounts.id.renderButton(
                        googleButtonRef.current,
                        {
                            theme: "filled_blue",
                            size: "large",
                            width: "320",
                            text: "continue_with",
                            shape: "pill"
                        }
                    );
                }
            }
        };

        if (window.google) {
            initializeGoogleSignIn();
        } else {
            const checkInterval = setInterval(() => {
                if (window.google) {
                    initializeGoogleSignIn();
                    clearInterval(checkInterval);
                }
            }, 100);
            return () => clearInterval(checkInterval);
        }
    }, [currentUser]);

    // 🚀 EXCHANGE GOOGLE TOKEN WITH THE BACKEND API
    const handleGoogleLoginSuccess = async (response) => {
        setAuthLoading(true);
        try {
            const idToken = response.credential;

            const res = await axios.post(`${API_URL}/api/auth/google-login`, {
                idToken
            });

            // Persist returned user profile data
            localStorage.setItem("chatly_user", JSON.stringify(res.data));
            setCurrentUser(res.data);

            // Clean out local credentials
            setNameInput("");
            setEmailInput("");
            setPasswordInput("");
        } catch (err) {
            console.error("Google Auth execution failed:", err);
            alert("Google Sign-In failed. Please try again.");
        } finally {
            setAuthLoading(false);
        }
    };

    const formatMessageTime = useCallback((value) => {
        const date = value ? new Date(value) : new Date();

        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    }, []);

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
        const isVoiceNote = Boolean(msg.file?.type?.startsWith('audio/'));
        const messagePreview = isVoiceNote ? 'VN' : (msg.text?.trim() || msg.file?.name || 'New message');
        const messageTime = formatMessageTime(msg.time);

        if (isReceived) {
            const senderName = usersRef.current.find((user) => user.id === partnerId)?.name || 'New message';
            const shouldNotifyDesktop = typeof window !== 'undefined'
                && 'Notification' in window
                && Notification.permission === 'granted'
                && (document.visibilityState === 'hidden' || activeUserIdRef.current !== partnerId);

            if (shouldNotifyDesktop) {
                const notification = new Notification(`New message from ${senderName}`, {
                    body: messagePreview
                });

                notification.onclick = () => {
                    window.focus();
                    setActiveUserId(partnerId);
                    notification.close();
                };
            }
        }

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

        setUsers((currentUsers) => currentUsers.map((user) => {
            if (user.id !== partnerId) return user;

            return {
                ...user,
                lastMessage: messagePreview,
                lastMessageType: isVoiceNote ? 'voice-note' : 'text',
                lastMessageAt: new Date(msg.time).getTime(),
                time: messageTime,
                unread: isReceived && activeUserIdRef.current !== partnerId ? (user.unread ?? 0) + 1 : (user.unread ?? 0)
            };
        }));
    }, [currentUserId, formatMessageTime]);

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

    const syncSidebarConversationSummary = useCallback((partnerId, chatMessages) => {
        const latestMessage = chatMessages.at(-1);
        const latestPreview = latestMessage?.file?.type?.startsWith('audio/')
            ? 'VN'
            : (latestMessage?.text?.trim() || latestMessage?.file?.name || '');

        setUsers((currentUsers) => currentUsers.map((user) => (
            user.id === partnerId
                ? {
                    ...user,
                    lastMessage: latestPreview,
                    lastMessageType: latestMessage?.file?.type?.startsWith('audio/') ? 'voice-note' : 'text',
                    lastMessageAt: latestMessage ? new Date(latestMessage.time).getTime() : 0,
                    time: latestMessage ? formatMessageTime(latestMessage.time) : '',
                    unread: currentUserId && activeUserIdRef.current !== partnerId
                        ? chatMessages.filter((message) => !message.sent && message.status !== 'read').length
                        : 0
                }
                : user
        )));
    }, [currentUserId, formatMessageTime]);

    const fetchConversation = useCallback(async (userId) => {
        if (!currentUserId || !userId) return;

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

            const latestMessage = formattedMessages.at(-1);
            const latestPreview = latestMessage?.file?.type?.startsWith('audio/')
                ? 'VN'
                : (latestMessage?.text?.trim() || latestMessage?.file?.name || '');

            if (latestMessage) {
                setUsers((currentUsers) => currentUsers.map((user) => (
                    user.id === userId
                        ? {
                            ...user,
                            lastMessage: latestPreview,
                            lastMessageType: latestMessage.file?.type?.startsWith('audio/') ? 'voice-note' : 'text',
                            lastMessageAt: latestMessage ? new Date(latestMessage.time).getTime() : 0,
                            time: formatMessageTime(latestMessage.time)
                        }
                        : user
                )));
            }

            setConversations(prev => ({ ...prev, [userId]: formattedMessages }));
        } catch (err) {
            console.error('Failed to pull message history:', err);
        }
    }, [currentUserId, formatMessageTime]);
    const fetchConversationSummaries = useCallback(async (userList) => {
        if (!currentUserId) return;

        try {
            const res = await axios.get(
                `${API_URL}/api/messages/summary/${currentUserId}`
            );

            const summaries = res.data;

            setUsers(
                userList.map(user => {
                    const summary = summaries[user.id];

                    if (!summary) return user;

                    const isVoice =
                        summary.file?.type?.startsWith("audio/");

                    return {
                        ...user,
                        lastMessage: isVoice
                            ? "VN"
                            : (summary.text?.trim() ||
                                summary.file?.name ||
                                ""),

                        lastMessageType: isVoice ? "voice-note" : "text",

                        lastMessageAt: new Date(summary.createdAt).getTime(),

                        time: formatMessageTime(summary.createdAt)
                    };
                })
            );
        } catch (err) {
            console.error(err);
        }
    }, [currentUserId, formatMessageTime]);

    const handleDeleteMessage = useCallback(async (messageId, partnerId) => {
        if (!currentUserId || !messageId || !partnerId) return;

        try {
            await axios.delete(`${API_URL}/api/messages/${messageId}`, {
                data: { requesterId: currentUserId }
            });

            setConversations((prev) => {
                const existingChat = prev[partnerId] || [];
                const nextChat = existingChat.filter((message) => String(message.id) !== String(messageId));
                const nextConversations = {
                    ...prev,
                    [partnerId]: nextChat
                };

                syncSidebarConversationSummary(partnerId, nextChat);

                return nextConversations;
            });
        } catch (error) {
            console.error('Failed to delete message:', error);
            alert(error?.response?.data?.error || 'Could not delete this message.');
        }
    }, [currentUserId, syncSidebarConversationSummary]);

    const handleMessageDeleted = useCallback((deletedPayload) => {
        const messageId = deletedPayload?.messageId;
        const senderId = deletedPayload?.senderId;
        const receiverId = deletedPayload?.receiverId;

        if (!messageId || !senderId || !receiverId || !currentUserId) return;

        const partnerId = senderId === currentUserId ? receiverId : senderId;

        setConversations((prev) => {
            const existingChat = prev[partnerId] || [];
            const nextChat = existingChat.filter((message) => String(message.id) !== String(messageId));
            const nextConversations = {
                ...prev,
                [partnerId]: nextChat
            };

            syncSidebarConversationSummary(partnerId, nextChat);

            return nextConversations;
        });
    }, [currentUserId, syncSidebarConversationSummary]);

    const handleUserStatusChanged = useCallback((statusPayload) => {
        const userId = statusPayload?.userId || statusPayload?.id;
        const status = statusPayload?.status;

        if (!userId || !status) return;

        setUsers((currentUsers) => currentUsers.map((user) => (
            user.id === userId ? { ...user, status } : user
        )));

        setCurrentUser((currentUserState) => (
            currentUserState?._id === userId
                ? { ...currentUserState, status }
                : currentUserState
        ));
    }, []);

    const handleNewUserAdded = useCallback((payload) => {
        const newUser = payload?.user;
        if (!newUser?.id || newUser.id === currentUserId) return;

        setUsers((currentUsers) => {
            if (currentUsers.some((user) => user.id === newUser.id)) {
                return currentUsers;
            }

            return [
                {
                    id: newUser.id,
                    name: newUser.name,
                    avatar: newUser.avatar,
                    status: newUser.status || 'offline',
                    unread: 0,
                    lastMessageAt: 0,
                    time: '',
                    lastMessage: '',
                    lastMessageType: 'text'
                },
                ...currentUsers
            ];
        });
    }, [currentUserId]);

    const handleAvatarChanged = useCallback((avatarPayload) => {
        const userId = avatarPayload?.userId || avatarPayload?.id;
        const avatarUrl = avatarPayload?.avatarUrl;

        if (!userId || !avatarUrl) return;

        applyAvatarUpdate(userId, avatarUrl);
    }, [applyAvatarUpdate]);

    const { emitSendMessage, emitMarkMessagesRead, emitUpdateAvatar } = useSocket(currentUserId, handleIncomingLiveMessage, handleUserStatusChanged, handleAvatarChanged, handleMessageStatusUpdated, handleNewUserAdded, handleMessageDeleted);

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
                        lastMessageAt: 0,
                        unread: 0
                    }));
                setUsers(dynamicList);
                await fetchConversationSummaries(dynamicList);

                const storedActiveUserId = localStorage.getItem('chatly_active_user');
                if (storedActiveUserId && dynamicList.some((user) => user.id === storedActiveUserId)) {
                    setActiveUserId(storedActiveUserId);
                    await fetchConversation(storedActiveUserId);
                }
            } catch (err) {
                console.error("Error pulling live user list directory:", err);
            }
        };

        fetchUsers();
    }, [currentUserId, fetchConversationSummaries, fetchConversation]);
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
        try {
            localStorage.setItem('chatly_active_user', userId);
        } catch (error) {
            console.error('Failed to persist active chat:', error);
        }
        setUsers((currentUsers) =>
            currentUsers.map((user) =>
                user.id === userId ? { ...user, unread: 0 } : user
            )
        );

        await fetchConversation(userId);
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

            if (isSignup) {
                // 🚀 OTP generated & sent on backend, hold screen flow for verification input
                setIsVerifyingOtp(true);
                alert("A 6-digit OTP code has been sent to your email address!");
            } else {
                // Regular login session success
                localStorage.setItem("chatly_user", JSON.stringify(res.data));
                setCurrentUser(res.data);
                setNameInput("");
                setEmailInput("");
                setPasswordInput("");
            }
        } catch (err) {
            console.error("Authentication action failed:", err);
            alert(err.response?.data?.error || "Authentication dropped. Try again.");
        } finally {
            setAuthLoading(false);
        }
    };

    // 🚀 NEW OTP VERIFICATION HANDLER
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpInput.trim() || otpInput.length !== 6) {
            setOtpError("Please enter a valid 6-digit code.");
            return;
        }

        setAuthLoading(true);
        setOtpError("");

        try {
            const res = await axios.post(`${API_URL}/api/auth/verify-otp`, {
                email: emailInput.trim().toLowerCase(),
                otp: otpInput.trim()
            });

            // Write verified registration dataset profile
            localStorage.setItem("chatly_user", JSON.stringify(res.data));
            setCurrentUser(res.data);

            // Clean out cached input controllers
            setNameInput("");
            setEmailInput("");
            setPasswordInput("");
            setOtpInput("");
            setIsVerifyingOtp(false);
        } catch (err) {
            console.error("OTP verification failed:", err);
            setOtpError(err.response?.data?.error || "Invalid OTP code. Please try again.");
        } finally {
            setAuthLoading(false);
        }
    };

    // LOGOUT ACTION UTILITY
    const handleLogout = () => {
        localStorage.removeItem("chatly_user");
        localStorage.removeItem('chatly_active_user');
        setCurrentUser(null);
        setActiveUserId(null);
    };

    // 🚀 GATEKEEPER INTERFACE (Sign In / Sign Up Card with Google integration)
    if (!currentUser) {
        return (
            <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-ink px-4 font-sans text-bone">
                {/* Ambient signal glow */}
                <div className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-ember/20 blur-[120px]" />
                <div className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-teal/10 blur-[120px]" />

                <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-ink-soft/80 p-6 shadow-2xl backdrop-blur-sm animate-rise-in sm:p-8">

                    {/* 🚀 CONDITIONAL OTP VERIFICATION MODULE */}
                    {isVerifyingOtp ? (
                        <form onSubmit={handleVerifyOtp}>
                            <div className="mb-6 flex flex-col items-center text-center">
                                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-ink">
                                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                    </svg>
                                </span>
                                <h2 className="font-display text-2xl font-bold tracking-tight text-bone">
                                    Verify your Email
                                </h2>
                                <p className="mt-1.5 text-xs text-dusk">
                                    We sent a 6-digit confirmation code to <span className="text-ember font-semibold">{emailInput}</span>
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block font-mono text-[10px] font-semibold uppercase tracking-widest text-dusk mb-2">
                                    Enter 6-Digit Code
                                </label>
                                <input
                                    type="text"
                                    maxLength="6"
                                    value={otpInput}
                                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))} // Digits only
                                    placeholder="123456"
                                    className="w-full text-center tracking-[0.75em] font-mono text-lg rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-bone placeholder-dusk/30 focus:outline-none focus:border-ember focus:bg-white/[0.07] transition-all"
                                    required
                                />
                                {otpError && (
                                    <p className="mt-2 text-xs text-red-500 text-center font-semibold animate-pulse">
                                        {otpError}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full rounded-xl bg-ember py-3 text-sm font-bold text-ink transition-colors hover:bg-ember-soft disabled:bg-white/10 disabled:text-dusk shadow-lg shadow-ember/20"
                            >
                                {authLoading ? "Verifying..." : "Verify & Create Account"}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setIsVerifyingOtp(false); setOtpInput(""); setOtpError(""); }}
                                className="mt-4 w-full text-center text-xs text-dusk hover:text-bone transition-all"
                            >
                                ← Back to Sign Up
                            </button>
                        </form>
                    ) : (
                        /* STANDARD LOGIN & SIGNUP SELECTION PANEL */
                        <form onSubmit={handleAuthSubmit}>
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
                    )}

                    {/* Styled Visual Divider (Always mounted, visually hidden during OTP verification) */}
                    <div className={`relative py-5 items-center w-full ${isVerifyingOtp ? 'hidden' : 'flex'}`}>
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink mx-4 text-xs text-dusk/60 uppercase tracking-widest font-semibold font-mono text-[10px]">Or</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    {/* 🚀 GOOGLE LOGIN MOUNT TARGET (Always mounted, visually hidden during OTP verification) */}
                    <div className={`justify-center w-full min-h-[44px] ${isVerifyingOtp ? 'hidden' : 'flex'}`}>
                        <div ref={googleButtonRef} className="w-full max-w-[320px]"></div>
                    </div>
                </div>
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
                theme={theme}
                onToggleTheme={toggleTheme}
                onLogout={handleLogout}
            />
            <ActiveChat
                onLogout={handleLogout}
                theme={theme}
                setTheme={toggleTheme}
                activeUser={activeUser}
                messages={activeMessages}
                onSendMessage={handleSendMessage}
                onDeleteMessage={handleDeleteMessage}
                isDetailTabOpen={isDetailTabOpen}
                onCloseProfile={() => setIsDetailTabOpen(false)}
                onDeselectUser={() => setActiveUserId(null)}
                isChatActive={Boolean(activeUserId)}
                currentUserId={currentUserId}
                onOpenProfile={() => setIsDetailTabOpen(true)}
            />
        </div>
    );
}

export default App;