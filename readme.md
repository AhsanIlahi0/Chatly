# 💬 Chatly — Enterprise Real-Time Chat Engine

A polished, full-stack real-time chat application built using the MERN stack (MongoDB, Express, React, Node.js) and enhanced with bi-directional WebSocket communication via Socket.io. Features secure session routing, a responsive fluid UI layout, dynamic cloud media management, and real-time synchronization pipelines.

---

## ✨ Features

- **🔒 Sticky Authentication & Session Isolation:** Built using browser-isolated `sessionStorage` sandboxes, explicitly allowing multi-profile side-by-side execution tabs for developers and users without account pollution or state collision on manual page reloads.
- **⚡ Real-Time Bi-directional Communication:** Fueled by a custom Socket.io integration mapping live event listeners for immediate text and media delivery, as well as active contact connection lifecycle states (Online/Offline/Away).
- **🎨 Visual Paradigm "Circles" Login Interface:** A custom layout design featuring premium glassmorphism, responsive canvas dimensions, and deep navy-blue dark mode components matching a high-fidelity design schema.
- **🖼️ Real-Time Profile Avatar Propagation:** Upload custom image assets seamlessly routed through Cloudinary transformations, written directly to MongoDB User documents, and broadcasted globally across active channels instantly via low-latency websocket hooks.
- **📜 Smart Hybrid Scroll Viewport Execution:** A precision layout monitoring engine that smoothly glides downwards to catch new incoming message fragments while applying zero-lag instant snap coordinates on heavy initial room history loading sequences.

---

## 🛠️ Tech Stack

### Frontend Architecture
- **Core Framework:** React.js (Vite configuration workflow)
- **Styling Utility:** Tailwind CSS (Custom color extensions, nested interactive states)
- **State Strategy:** React Hooks (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`)
- **HTTP Transport:** Axios (Asynchronous REST operations)

### Backend Infrastructure
- **Runtime Environment:** Node.js & Express framework server engine
- **WebSocket Gateway:** Socket.io Core Library
- **Database Model:** MongoDB using the Mongoose Object Data Modeling (ODM) layer
- **Media Optimization Pipeline:** Cloudinary REST API asset storage

---

## 📦 System Architecture & Directory Layout

```text
chatly/
├── Backend/
│   ├── src/
│   │   ├── models/          # Mongoose database schemas (User.js, Message.js)
│   │   ├── routes/          # Express application API endpoints (/api/auth, /api/messages)
│   │   ├── sockets/         # Socket.io modular event routers (chatSocket.js)
│   │   └── server.js        # Core server bootstrap entry configuration point
│   └── .env                 # Environment configurations (MONGO_URI, PORT)
└── Frontend/
    ├── src/
    │   ├── components/      # UI Layout modules (ChatContainer, Sidebar, ActiveChat, MessageBubble)
    │   ├── hooks/           # Abstract custom hook orchestration (useSocket, useDarkMode)
    │   ├── images/          # Static local asset binaries and vectors
    │   ├── App.jsx          # Frontend client root routing and global state core
    │   └── main.jsx         # Application viewport DOM mounting script
```


🚀 Installation & Local Environment Configuration
Prerequisites
Ensure your workstation has Node.js (v16+) installed alongside a running instance of MongoDB (Local Community Edition daemon or an Atlas Cloud cluster connection string URL).

1. Initializing the Server Core
Navigate into your backend cluster workspace terminal directory:

Bash
cd Backend
npm install
Create a .env configuration file right inside your Backend/ directory and configure your targeted environment paths:

Code snippet
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/chatly
Launch the Node.js backend server instance pipeline:

Bash
npm start
The console will log: 📦 Connected to MongoDB successfully! followed by 🚀 Server processing on port 5000.

2. Spinning Up the Client Interface
Navigate out to your root shell and move into your client build terminal context:

Bash
cd ../Frontend
npm install
Launch the lightning-fast Vite compilation server environment layout:

Bash
npm run dev
Your browser will spin up locally on http://localhost:5173. Open it up, duplicate an alternate window using your browser's Incognito / Private Window, create two separate user profile identities, and watch messages reflect instantly.

💡 Technical Design Implementation Deep-Dive
Multi-Tab Concurrent Sandbox Strategy
By transforming standard global session structures from shared localStorage arrays into context-isolated sessionStorage engines, Chatly maps private storage silos distinct to every unique browser tab. This removes local cross-contamination, allowing engineering groups to test multi-user conversational flows on a single device easily.

Dynamic Layout Thrashing & Scroll Mitigation
JavaScript
useEffect(() => {
    if (!viewState.isSwitching && viewState.currentMessages.length > 0) {
        const currentCount = viewState.currentMessages.length;
        const prevCount = prevMessageCountRef.current;
        
        // Differentiate heavy initialization loads from small real-time chat fragments
        const isLiveNewMessage = currentCount - prevCount > 0 && currentCount - prevCount <= 2;
        
        const scrollTimeout = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ 
                behavior: isLiveNewMessage ? 'smooth' : 'auto' 
            });
        }, 30);
        
        prevMessageCountRef.current = currentCount;
        return () => clearTimeout(scrollTimeout);
    }
}, [viewState.currentMessages, viewState.isSwitching]);
This custom React execution hook preserves DOM recalculation loops. By analyzing length delta transformations, it maps an automated execution fork: small increments (live chat text) trigger fluid layout movements (behavior: 'smooth'), while massive arrays (historical thread loads) snap instantly to viewport coordinates (behavior: 'auto'). This completely eliminates browser stuttering over large data loads.

📄 License
Distributed under the MIT License. Open source and ready for modifications.