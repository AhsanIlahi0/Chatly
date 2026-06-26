# 💬 Chatly — Enterprise Real-Time Chat Engine

A modern full-stack real-time chat application built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js) and **Socket.io** for instant messaging. Chatly features secure authentication, real-time communication, cloud-based profile image management, and a responsive user interface designed for a seamless messaging experience.

---

## 🚀 Features

### 🔐 Authentication & Session Management

* Secure user authentication.
* Session isolation using `sessionStorage`, allowing multiple accounts to run simultaneously in different browser tabs.
* Prevents state collisions during development and testing.

### 💬 Real-Time Messaging

* Instant text messaging powered by **Socket.io**.
* Real-time online/offline user status updates.
* Low-latency bidirectional communication.

### 🖼️ Profile Avatar Management

* Upload profile pictures through cloud storage.
* Store image URLs in MongoDB.
* Instantly propagate avatar changes across all active chat sessions.

### 📜 Intelligent Auto-Scrolling

* Automatically detects whether messages are newly received or loaded from history.
* Smooth scrolling for live messages.
* Instant scrolling for initial conversation loading to eliminate UI lag.

### 🎨 Modern User Interface

* Responsive React interface.
* Glassmorphism-inspired login screen.
* Dark theme with custom Tailwind CSS styling.

---

## 🛠 Tech Stack

### Frontend

* React.js (Vite)
* Tailwind CSS
* Axios
* React Hooks (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`)

### Backend

* Node.js
* Express.js
* Socket.io
* MongoDB
* Mongoose
* Cloud Storage API Integration

---

## 📂 Project Structure

```
Chatly/
├── Frontend/
├── Backend/
├── README.md
└── package.json
```

---

## ⚙ Installation

### Prerequisites

* Node.js v16+
* MongoDB (Local or Atlas)

---

### 1️⃣ Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file inside the **Backend** directory.

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/chatly
```

Start the backend server.

```bash
npm start
```

Expected output:

```
📦 Connected to MongoDB successfully!
🚀 Server running on port 5000
```

---

### 2️⃣ Frontend Setup

```bash
cd ../Frontend
npm install
npm run dev
```

Open

```
http://localhost:5173
```

To test real-time messaging:

* Open another browser window or an Incognito window.
* Register/login with another account.
* Start chatting and observe instant synchronization.

---

# 💡 Technical Highlights

## Multi-Tab Session Isolation

Unlike applications that rely on `localStorage`, Chatly uses `sessionStorage` to isolate each browser tab. This enables developers to test multiple user sessions simultaneously on the same device without account conflicts.

---

## Intelligent Scroll Management

```javascript
useEffect(() => {
    if (!viewState.isSwitching && viewState.currentMessages.length > 0) {
        const currentCount = viewState.currentMessages.length;
        const prevCount = prevMessageCountRef.current;

        const isLiveNewMessage =
            currentCount - prevCount > 0 &&
            currentCount - prevCount <= 2;

        const scrollTimeout = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({
                behavior: isLiveNewMessage ? "smooth" : "auto",
            });
        }, 30);

        prevMessageCountRef.current = currentCount;

        return () => clearTimeout(scrollTimeout);
    }
}, [viewState.currentMessages, viewState.isSwitching]);
```

This implementation distinguishes between:

* Live incoming messages
* Initial conversation history loading

Small message updates trigger smooth scrolling, while large history loads instantly jump to the latest message, providing a smoother user experience for long conversations.

---

## 📄 License

This project is licensed under the **MIT License**.

Feel free to use, modify, and extend the project.
