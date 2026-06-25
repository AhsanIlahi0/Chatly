import Sidebar from "./components/sidebar/Sidebar";
import ActiveChat from "./components/chat/ActiveChat";
import DetailTab from "./components/profile/DetailTab";
// import { useMemo, useState } from "react";
import emmaAvatar from "./images/1avatar.png";
import { useDarkMode } from './hooks/useDarkMode';
import { useSocket } from './hooks/useSocket';
import axios from 'axios'; // Import axios for HTTP requests
// At the top of App.jsx
import { useMemo, useState, useCallback } from "react"; // ← Add useCallback here!
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export const initialUsers = [
    {
        id: "65f1a2b3c4d5e6f7a8b9c0e2", // Valid 24-character hex ID
        name: "Alice Johnson",
        avatar: "AJ",
        status: "offline",
        unread: 0
    },
    {
        id: "65f1a2b3c4d5e6f7a8b9c0e3", // Valid 24-character hex ID
        name: "Bob Smith",
        avatar: "BS",
        status: "offline",
        unread: 0
    }
];

const initialConversations = {
    1: [
        { id: 1, text: 'Hey Alice, are you free for a quick review?', time: '9:12 AM', sent: true },
        { id: 2, text: 'Yes, send it over.', time: '9:13 AM', sent: false },
    ],
    2: [
        { id: 1, text: 'Bob, did you finish the deploy?', time: '8:45 AM', sent: true },
        { id: 2, text: 'Deploy went out cleanly.', time: '8:46 AM', sent: false },
    ],
    3: [
        { id: 1, text: 'Thanks again for the help on the UI.', time: 'Yesterday', sent: true },
        { id: 2, text: 'Any time.', time: 'Yesterday', sent: false },
    ],
    4: [
        { id: 1, text: 'Let\'s catch up soon.', time: 'Yesterday', sent: false },
        { id: 2, text: 'Absolutely, send me a time.', time: 'Yesterday', sent: true },
    ],
    5: [
        { id: 1, text: 'Sounds great!', time: '2 days ago', sent: false },
        { id: 2, text: 'Perfect, see you then.', time: '2 days ago', sent: true },
    ],
};

function App() {
    const [theme, toggleTheme] = useDarkMode();
    const [isDetailTabOpen, setIsDetailTabOpen] = useState(false);
    const [conversations, setConversations] = useState({});

    // 🛠️ DYNAMIC LOGIN WORKAROUND FOR TESTING PARALLEL TABS
    const currentUserId = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const userParam = params.get('user'); // Looks for ?user=bob or ?user=alice

        if (userParam === 'bob') return "65f1a2b3c4d5e6f7a8b9c0e3";   // Bob's ID
        if (userParam === 'alice') return "65f1a2b3c4d5e6f7a8b9c0e2"; // Alice's ID
        return "65f1a2b3c4d5e6f7a8b9c0e1";                             // Default: You
    }, []);

    // 🛠️ DYNAMIC SIDEBAR LIST: Show everyone except the logged-in user
    const [users, setUsers] = useState(() => {
        const allMockUsers = [
            { id: "65f1a2b3c4d5e6f7a8b9c0e1", name: "Ahsan Ilahi (Me)", avatar: "AI", status: "offline", unread: 0 },
            { id: "65f1a2b3c4d5e6f7a8b9c0e2", name: "Alice Johnson", avatar: "AJ", status: "offline", unread: 0 },
            { id: "65f1a2b3c4d5e6f7a8b9c0e3", name: "Bob Smith", avatar: "BS", status: "offline", unread: 0 }
        ];
        // Filter out whoever is currently logged into this specific window tab instance
        return allMockUsers.filter(user => user.id !== currentUserId);
    });

    const [activeUserId, setActiveUserId] = useState(null);

    const activeUser = useMemo(
        () => users.find((user) => user.id === activeUserId) ?? null,
        [users, activeUserId]
    );

    // Inbound socket message receiver callback
    const handleIncomingLiveMessage = useCallback((msg) => {
        // 1. Determine who we are talking to based on who sent the message
        // If someone else sent it, the partner is the sender. If we sent it, the partner is the receiver.
        const isReceived = msg.senderId !== currentUserId;
        const partnerId = isReceived ? msg.senderId : msg.receiverId;

        setConversations(prev => {
            const existingChat = prev[partnerId] || [];

            // 2. Avoid duplicate message rendering if we already added it optimistically
            if (!isReceived && existingChat.some(m => m.id === msg.id)) {
                return prev;
            }

            return {
                ...prev,
                [partnerId]: [
                    ...existingChat,
                    {
                        id: msg.id || Date.now().toString(),
                        text: msg.text,
                        file: msg.file, // 🛠️ GRAB THE FILE FROM THE SOCKET HERE
                        time: new Date(msg.time),
                        sent: !isReceived
                    }
                ]
            };
        });
    }, [currentUserId]);

    // 🛠️ HOOK UPDATE: Instantiating the socket with your user ID, not the chat target's ID
    const { emitSendMessage } = useSocket(currentUserId, handleIncomingLiveMessage);

    const activeMessages = activeUserId ? conversations[activeUserId] ?? [] : [];

    // Inside App.jsx
    const handleSelectUser = async (userId) => {
        setActiveUserId(userId);

        // Clear unread counts locally
        setUsers((currentUsers) =>
            currentUsers.map((user) =>
                user.id === userId ? { ...user, unread: 0 } : user
            )
        );

        // 🛠️ FETCH STORED CHAT HISTORY FROM DATABASE
        // Inside App.jsx -> handleSelectUser (or your history fetch useEffect)
        try {
            const res = await axios.get(`http://localhost:5000/api/messages/${currentUserId}/${userId}`);

            const formattedMessages = res.data.map(msg => ({
                id: msg._id,
                text: msg.text,
                file: msg.file, // 👈 ADD THIS LINE! Extract the file from the DB response
                time: new Date(msg.createdAt),
                sent: msg.sender === currentUserId
            }));

            setConversations(prev => ({
                ...prev,
                [userId]: formattedMessages
            }));
        } catch (err) {
            console.error("Failed to pull message history:", err);
        }
    };
    const handleSendMessage = async (messageText, selectedFile) => {
        if (!activeUserId) return;

        // Helper function to handle socket emission and state update
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
                            file: filePayload
                        }
                    ]
                };
            });
        };

        // If the user attached a file (Image, PDF, etc.)
       if (selectedFile) {
    try {
        let fileToUpload = selectedFile;

        // 🛠️ AUTO-COMPRESSION FOR HEAVY IMAGES
        if (selectedFile.type.startsWith("image/") && selectedFile.size > 2 * 1024 * 1024) {
            console.log("Compressing heavy image...");
            fileToUpload = await new Promise((resolve) => {
                const img = new Image();
                img.src = URL.createObjectURL(selectedFile);
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    // Maintain aspect ratio but cap max width/height at 1200px
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to a compressed JPEG blob (0.7 quality = 70% compression)
                    canvas.toBlob((blob) => {
                        const compressedFile = new File([blob], selectedFile.name, {
                            type: "image/jpeg",
                        });
                        resolve(compressedFile);
                    }, "image/jpeg", 0.7);
                };
            });
            console.log(`Compressed! New size: ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`);
        }

        // Proceed with your Cloudinary Form Upload
        const formData = new FormData();
        formData.append("file", fileToUpload); // Uses the compressed file if it was an image!
        formData.append("upload_preset", "xgx72g5u"); 
        
        const resourceType = fileToUpload.type.startsWith("image/") ? "image" : "raw";
        formData.append("resource_type", resourceType);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/dhwdd6d0e/${resourceType}/upload`, 
            { method: "POST", body: formData }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.log("EXACT CLOUDINARY ERROR:", JSON.stringify(errorData));
            throw new Error("Failed to upload file to Cloudinary");
        }

        const data = await response.json();

        const filePayload = {
            name: fileToUpload.name,
            type: fileToUpload.type,
            url: data.secure_url 
        };

        processAndSendMessage(messageText, filePayload);
        
    } catch (error) {
        console.error("Cloudinary upload workflow failed:", error);
        alert("Could not upload file. Please check connection.");
    }
} else {
            // Text-only message path
            processAndSendMessage(messageText, null);
        }
    };

    return (
        <div className="flex w-full h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Sidebar
                users={users}
                activeUserId={activeUserId}
                onSelectUser={handleSelectUser}
            />
            <ActiveChat
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
export default App
