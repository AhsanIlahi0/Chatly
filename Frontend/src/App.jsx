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

    // Instantiate socket hook passing current logged-in user ID safely
    // 💡 Note: Ensure your useSocket hook gracefully handles a null/undefined ID!
    const { emitSendMessage } = useSocket(currentUserId, handleIncomingLiveMessage);

    // FETCH DYNAMIC DIRECTORY ONCE LOGGED IN
    useEffect(() => {
        if (!currentUserId) return;

        const fetchUsers = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/auth/all-users");

                const dynamicList = res.data
                    .filter(u => u._id !== currentUserId)
                    .map(u => ({
                        id: u._id,
                        name: u.name, 
                        avatar: u.name ? u.name.substring(0, 2).toUpperCase() : "??",
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
    };

    // 🚀 GATEKEEPER INTERFACE (Sign In / Sign Up Card)
    // 🚀 UPDATED GATEKEEPER INTERFACE (Matches the uploaded design layout)
    if (!currentUser) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-400 p-4 md:p-10 font-sans select-none">
                {/* Main Dashboard Canvas Frame */}
                <div className="relative flex h-full w-screen max-w-6xl items-center justify-between overflow-hidden rounded-[2.5rem] bg-[#071126] px-8 md:px-20 shadow-2xl">
                    
                    {/* Abstract Deep Blue/Purple Glow Circles Behind Everything */}
                    <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-900/20 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-10 left-1/3 h-[500px] w-[500px] rounded-full bg-sky-950/40 blur-3xl pointer-events-none" />
                    
                    {/* LEFT SIDE: Brand Branding Info */}
                    <div className="relative z-10 hidden max-w-md flex-col md:flex">
                        {/* Logo header */}
                        <div className="flex items-center gap-2 text-white">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-4 border-blue-500 p-1">
                                <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                            </div>
                            <span className="text-xl font-bold tracking-wide">chatly</span>
                        </div>

                        {/* Heading titles */}
                        <h1 className="mt-16 text-4xl font-bold tracking-tight text-white lg:text-5xl">
                            {isSignup ? "Create your account" : "Login into your account"}
                        </h1>
                        <p className="mt-4 text-base text-slate-400/80 font-medium">
                            {isSignup ? "Let's make the room bigger!" : "Let's make the circle bigger!"}
                        </p>
                    </div>

                    {/* RIGHT SIDE: Floating White Input Card Form Frame */}
                    <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-8 md:p-10 shadow-2xl shadow-black/40">
                        <form onSubmit={handleAuthSubmit} className="flex flex-col">
                            
                            {/* Mobile-only logo display when left side collapses */}
                            <div className="mb-6 flex items-center gap-2 text-slate-900 md:hidden">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full border-4 border-blue-600 p-0.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                </div>
                                <span className="text-lg font-bold">chatly</span>
                            </div>

                            {/* Conditional Display Name Field for Signup */}
                            {isSignup && (
                                <div className="mb-5">
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Display Name</label>
                                    <input
                                        type="text"
                                        value={nameInput}
                                        onChange={(e) => setNameInput(e.target.value)}
                                        placeholder="Your username"
                                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-300 transition-colors focus:border-blue-500 focus:outline-none bg-slate-50/50"
                                        required
                                    />
                                </div>
                            )}

                            {/* Email Field Container */}
                            <div className="mb-5">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-300 transition-colors focus:border-blue-500 focus:outline-none bg-slate-50/50"
                                    required
                                />
                            </div>

                            {/* Password Field Container */}
                            <div className="mb-6">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Password</label>
                                <input
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="Your password"
                                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-300 transition-colors focus:border-blue-500 focus:outline-none bg-slate-50/50"
                                    required
                                />
                            </div>

                            {/* Bottom Flex Bar: Switch Action Toggle & Core Action Trigger */}
                            <div className="flex items-center justify-between gap-4 pt-2">
                                <p className="text-xs text-slate-500 font-medium">
                                    {isSignup ? "Have an account?" : "Don't have an account?"}{" "}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSignup(!isSignup);
                                            setNameInput("");
                                        }}
                                        className="text-blue-600 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0 ml-0.5"
                                    >
                                        {isSignup ? "Login" : "Sign up"}
                                    </button>
                                </p>

                                <button
                                    type="submit"
                                    disabled={authLoading}
                                    className="rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 active:scale-95 disabled:bg-slate-300 disabled:pointer-events-none shadow-md shadow-blue-600/10"
                                >
                                    {authLoading ? "..." : isSignup ? "Register" : "Login"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Bottom Copyright watermark layout matching layout file footer */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-[10px] tracking-wide text-slate-600 font-medium pointer-events-none w-full">
                        © 2026 Chatly - All Rights Reserved
                    </div>
                </div>
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
                onLogout={handleLogout} // Passed logout action down
            />
            <ActiveChat
                theme={theme}
                setTheme={toggleTheme}
                activeUser={activeUser}
                messages={activeMessages}
                onLogout={handleLogout} // Passed logout action down
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