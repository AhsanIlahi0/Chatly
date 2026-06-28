import Sidebar from "./components/sidebar/Sidebar";
import ActiveChat from "./components/chat/ActiveChat";
import DetailTab from "./components/profile/DetailTab";
import emmaAvatar from "./images/1avatar.png";
import { useDarkMode } from './hooks/useDarkMode';
import { useSocket } from './hooks/useSocket';
import axios from 'axios';
import { useMemo, useState, useCallback, useEffect } from "react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

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

    const [users, setUsers] = useState([]); // 👈 now holds only ACCEPTED friends (the chat list)

    // 🤝 FRIEND REQUEST STATE
    const [incomingRequests, setIncomingRequests] = useState([]); // requests waiting on MY response
    const [outgoingRequests, setOutgoingRequests] = useState([]); // requests I sent, still pending

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

    // Inbound socket message receiver callback
    const handleIncomingLiveMessage = useCallback((msg) => {
        if (!currentUserId) return;
        const isReceived = msg.senderId !== currentUserId;
        const partnerId = isReceived ? msg.senderId : msg.receiverId;

        setConversations(prev => {
            const existingChat = prev[partnerId] || [];
            if (!isReceived && existingChat.some(m => m.id === msg.id)) return prev;

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

    // 📨 Someone just sent ME a friend request — drop it straight into the panel
    const handleFriendRequestReceived = useCallback((payload) => {
        setIncomingRequests(prev => {
            if (prev.some(r => r._id === payload.requestId)) return prev;
            return [{ _id: payload.requestId, sender: payload.from, createdAt: new Date().toISOString() }, ...prev];
        });
    }, []);

    // ✅ Someone accepted a request I sent — they're a friend now, show up in the sidebar
    const handleFriendRequestAccepted = useCallback((payload) => {
        setOutgoingRequests(prev => prev.filter(r => r._id !== payload.request?._id));
        setUsers(prev => {
            const friend = payload.friend;
            if (!friend || prev.some(u => u.id === friend._id)) return prev;
            return [...prev, {
                id: friend._id,
                name: friend.name,
                avatar: friend.name ? friend.name.substring(0, 2).toUpperCase() : "??",
                status: friend.status || "offline",
                unread: 0
            }];
        });
    }, []);

    // ❌ Someone declined a request I sent — remove it from my "sent" list
    const handleFriendRequestDeclined = useCallback((payload) => {
        setOutgoingRequests(prev => prev.filter(r => r._id !== payload.requestId));
    }, []);

    // 🚫 Someone cancelled a request they'd sent to me — remove it from my incoming list
    const handleFriendRequestCancelled = useCallback((payload) => {
        setIncomingRequests(prev => prev.filter(r => r._id !== payload.requestId));
    }, []);

    // Instantiate socket hook passing current logged-in user ID safely
    // 💡 Note: Ensure your useSocket hook gracefully handles a null/undefined ID!
    const { emitSendMessage } = useSocket(
        currentUserId,
        handleIncomingLiveMessage,
        undefined,
        undefined,
        handleFriendRequestReceived,
        handleFriendRequestAccepted,
        handleFriendRequestDeclined,
        handleFriendRequestCancelled
    );

    // FETCH MY ACCEPTED FRIENDS — this is what populates the sidebar chat list
    const fetchFriends = useCallback(async () => {
        if (!currentUserId) return;
        try {
            const res = await axios.get(`http://localhost:5000/api/friends/${currentUserId}`);
            const dynamicList = res.data.map(u => ({
                id: u._id,
                name: u.name,
                avatar: u.name ? u.name.substring(0, 2).toUpperCase() : "??",
                status: u.status || "offline",
                unread: 0
            }));
            setUsers(dynamicList);
        } catch (err) {
            console.error("Error pulling friends list:", err);
        }
    }, [currentUserId]);

    // FETCH MY PENDING FRIEND REQUESTS (both directions)
    const fetchFriendRequests = useCallback(async () => {
        if (!currentUserId) return;
        try {
            const [incomingRes, outgoingRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/friends/${currentUserId}/incoming`),
                axios.get(`http://localhost:5000/api/friends/${currentUserId}/outgoing`)
            ]);
            setIncomingRequests(incomingRes.data);
            setOutgoingRequests(outgoingRes.data);
        } catch (err) {
            console.error("Error pulling friend requests:", err);
        }
    }, [currentUserId]);

    useEffect(() => {
        (async () => {
            await fetchFriends();
            await fetchFriendRequests();
        })();
    }, [fetchFriends, fetchFriendRequests]);

    // 📨 Send a friend request to someone found via the "Find People" modal
    const handleSendFriendRequest = async (receiverId) => {
        try {
            const res = await axios.post(`http://localhost:5000/api/friends/request`, {
                senderId: currentUserId,
                receiverId
            });
            if (res.data.status === 'accepted') {
                // They'd already sent ME a request — we're instantly friends now
                fetchFriends();
                fetchFriendRequests();
            } else {
                fetchFriendRequests();
            }
            return { success: true, message: res.data.message };
        } catch (err) {
            return { success: false, message: err.response?.data?.error || "Couldn't send that request" };
        }
    };

    // ✅ Accept an incoming friend request
    const handleAcceptFriendRequest = async (requestId) => {
        try {
            await axios.post(`http://localhost:5000/api/friends/accept`, { requestId, userId: currentUserId });
            setIncomingRequests(prev => prev.filter(r => r._id !== requestId));
            fetchFriends();
        } catch (err) {
            console.error("Failed to accept request:", err);
        }
    };

    // ❌ Decline an incoming friend request
    const handleDeclineFriendRequest = async (requestId) => {
        try {
            await axios.post(`http://localhost:5000/api/friends/decline`, { requestId, userId: currentUserId });
            setIncomingRequests(prev => prev.filter(r => r._id !== requestId));
        } catch (err) {
            console.error("Failed to decline request:", err);
        }
    };

    // 🚫 Cancel a friend request I sent before it was answered
    const handleCancelFriendRequest = async (requestId) => {
        try {
            await axios.post(`http://localhost:5000/api/friends/cancel`, { requestId, userId: currentUserId });
            setOutgoingRequests(prev => prev.filter(r => r._id !== requestId));
        } catch (err) {
            console.error("Failed to cancel request:", err);
        }
    };

    const activeMessages = activeUserId ? conversations[activeUserId] ?? [] : [];

    const handleSelectUser = async (userId) => {
        setActiveUserId(userId);
        setUsers((currentUsers) =>
            currentUsers.map((user) =>
                user.id === userId ? { ...user, unread: 0 } : user
            )
        );

        try {
            const res = await axios.get(`http://localhost:5000/api/messages/${currentUserId}/${userId}`);
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
            setConversations(prev => {
                const existingChat = prev[activeUserId] || [];
                return {
                    ...prev,
                    [activeUserId]: [
                        ...existingChat,
                        {
                            id: Date.now().toString(),
                            text: text,
                            time: new Date(),
                            sent: true,
                            status: 'sent',
                            file: filePayload
                        }
                    ]
                };
            });
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
            const res = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, payload);
            
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
        setUsers([]);
        setIncomingRequests([]);
        setOutgoingRequests([]);
    };

    // 🚀 GATEKEEPER INTERFACE (Sign In / Sign Up Card)
    // 🚀 UPDATED GATEKEEPER INTERFACE (Matches the uploaded design layout)
   if (!currentUser) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-sans">
                <form onSubmit={handleAuthSubmit} className="w-full max-w-sm rounded-2xl bg-slate-900 p-8 shadow-2xl ring-1 ring-white/10">
                    <h2 className="mb-2 text-2xl font-bold tracking-tight text-center text-sky-400">
                        {isSignup ? "Create an Account" : "Join Chatly"}
                    </h2>
                    <p className="mb-6 text-xs text-slate-400 text-center">
                        {isSignup ? "Sign up to start messaging in real-time" : "Sign in to catch up on conversations"}
                    </p>

                    {isSignup && (
                        <div className="mb-4">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Display Name</label>
                            <input
                                type="text"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder="Alice Smith"
                                className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                                required
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full rounded-xl bg-sky-500 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 transition-colors shadow-lg shadow-sky-500/20 mb-4"
                    >
                        {authLoading ? "Processing..." : isSignup ? "Create Free Account" : "Enter Chatroom"}
                    </button>

                    <p className="text-center text-xs text-slate-400">
                        {isSignup ? "Already have an account?" : "New to Chatly?"}{" "}
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignup(!isSignup);
                                setNameInput("");
                            }}
                            className="text-sky-400 hover:underline font-semibold focus:outline-none ml-1"
                        >
                            {isSignup ? "Sign In" : "Sign Up Here"}
                        </button>
                    </p>
                </form>
            </div>
        );
    }

    // Main App View Dashboard (Triggers once logged in)
    return (
        <div className="flex w-full h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Sidebar
                users={users}
                activeUserId={activeUserId}
                onSelectUser={handleSelectUser}
                currentUser={currentUser}
                incomingRequests={incomingRequests}
                outgoingRequests={outgoingRequests}
                onSendRequest={handleSendFriendRequest}
                onAcceptRequest={handleAcceptFriendRequest}
                onDeclineRequest={handleDeclineFriendRequest}
                onCancelRequest={handleCancelFriendRequest}
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