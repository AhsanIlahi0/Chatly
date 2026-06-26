<h1 align="center">💬 Chatly</h1>

<p align="center">
  A real-time, one-on-one chat application built on the MERN stack with Socket.IO — instant messaging, file/image sharing, presence status, and a light/dark UI.
</p>

---

## Overview

Chatly is a full-stack real-time messaging app:

- **Frontend** — a React (Vite) single-page app with a sidebar of users, a chat panel, and a profile detail panel.
- **Backend** — a Node.js/Express REST API + Socket.IO server for auth, message history, and live delivery.
- **Database** — MongoDB (via Mongoose) storing users and messages.

## Features

- 🔐 **Authentication** — email/password sign up and login, with passwords hashed using `bcryptjs`. The logged-in session is restored from `localStorage` on page reload.
- 💬 **Real-time 1:1 messaging** — messages are delivered instantly over **Socket.IO** and persisted to MongoDB, with full chat history fetched per-conversation.
- 📎 **File & image sharing** — attach a file to a message; images are auto-compressed client-side (resized to a 1200px max dimension) if larger than 2MB, then uploaded directly to **Cloudinary** before the message is sent.
- 🟢 **Presence status** — online/offline status is tracked server-side per socket connection and broadcast to all connected clients.
- 🔎 **Live user search** — filter the sidebar's user directory by name as you type.
- 📜 **Smart auto-scroll** — the chat panel smoothly scrolls for newly arriving messages, but jumps instantly to the bottom when switching conversations or loading history, so long threads don't visibly "scroll past."
- 🌗 **Light/dark theme** — toggle persisted in `localStorage`, defaulting to the system's preferred color scheme.

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 19, Vite, Tailwind CSS v4, Axios, Socket.IO Client, Cloudinary (direct browser upload) |
| Backend  | Node.js, Express 5, Socket.IO, MongoDB, Mongoose, bcryptjs, dotenv, cors |
| Auth     | Password hashing via bcryptjs (see [Known Issues](#known-issues--things-to-clean-up) re: JWT) |

## Project Structure

```
Chatly-main/
├── Backend/
│   └── src/
│       ├── server.js              # Express + Socket.IO bootstrap, Mongo connection
│       ├── models/
│       │   ├── user.js            # User schema (name, email, password, avatar, status, about)
│       │   └── message.js         # Message schema (sender, receiver, text, file, status)
│       ├── routes/
│       │   ├── auth.js            # Active auth routes: /signup, /login, /all-users
│       │   └── messageRoutes.js   # GET /:myId/:partnerId — chat history
│       ├── controllers/
│       │   └── messageController.js  # getChatHistory (used by messageRoutes)
│       └── sockets/
│           └── chatSocket.js       # registerUser / sendMessage / updateAvatar socket events
└── Frontend/
    └── src/
        ├── App.jsx                 # Auth gate, top-level state, Cloudinary upload logic
        ├── components/
        │   ├── chat/               # ChatContainer (header + scroll logic), MessageBubble, MessageInput
        │   ├── sidebar/             # Sidebar, SearchInput, UserItem, Avatar
        │   └── profile/             # DetailTab (read-only profile panel)
        └── hooks/
            ├── useSocket.js         # Socket.IO connection + emit/listen helpers
            └── useDarkMode.js       # Theme state, persisted to localStorage
```

## API Reference

Base URL: `http://localhost:5000`

| Method | Endpoint | Description |
|--------|----------|--------------|
| POST   | `/api/auth/signup` | Create an account (`{ name, email, password }`) |
| POST   | `/api/auth/login` | Log in (`{ email, password }`) |
| GET    | `/api/auth/all-users` | Get the user directory for the sidebar |
| GET    | `/api/messages/:myId/:partnerId` | Get the message history between two users |

### Socket.IO events

| Direction | Event | Payload | Purpose |
|-----------|-------|---------|---------|
| client → server | `registerUser` | `userId` | Marks a user online and maps their socket |
| client → server | `sendMessage` | `{ senderId, receiverId, text, file }` | Saves a message and forwards it live |
| client → server | `updateAvatar` | `{ userId, avatarUrl }` | Broadcasts an avatar change |
| server → client | `receiveMessage` | message object | New message for the recipient |
| server → client | `userStatusChanged` | presence payload | A user went online/offline |
| server → client | `userAvatarChanged` | `{ userId, avatarUrl }` | Another user updated their avatar |

## Getting Started

### Prerequisites

- Node.js v16+
- MongoDB (local or Atlas)
- A Cloudinary account if you want file/image attachments to work (see note below)

### 1. Backend setup

```bash
cd Backend
npm install
```

Create a `.env` file inside `Backend/`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/chatly
```

Start the server (there's no `npm start` script defined yet, so run the entry file directly, or install `nodemon` for auto-reload during development):

```bash
node src/server.js
# or, for auto-reload while developing:
npx nodemon src/server.js
```

You should see:

```
📦 Connected to MongoDB successfully!
🚀 Server processing on port 5000
```

### 2. Frontend setup

```bash
cd Frontend
npm install
npm run dev
```

Open `http://localhost:5173`. To test real-time messaging, open a second browser (or a different browser profile — see the note on `localStorage` below) and sign up with a second account.

### 3. File/image attachments (optional)

`Frontend/src/App.jsx` uploads attachments straight to Cloudinary using a hardcoded cloud name and unsigned upload preset. To use your own Cloudinary account, replace the cloud name in the upload URL and the `upload_preset` value with your own unsigned preset.

## Known Issues / Things to Clean Up

- **Model filename casing** — `models/user.js` and `models/message.js` are required elsewhere as `../models/User` and `../models/Message`. This works on case-insensitive filesystems (Windows, macOS) but will throw `Cannot find module` on case-sensitive ones (Linux, most CI/CD and Docker images). Either rename the files to match or fix the `require` paths before deploying to Linux.
- **`registerUser` socket handler bug** — `Backend/src/sockets/chatSocket.js` looks up `User.findById(userId)` but never imports the `User` model in that file, so this will throw at runtime. Add `const User = require('../models/User');` at the top of `chatSocket.js`.
- **Unused JWT auth path** — `controllers/authController.js` and `controllers/userController.js` implement a JWT-based login/user-lookup flow, but neither is wired into any route. The app's actual login/signup flow is the plain (non-JWT) version in `routes/auth.js`. `JWT_SECRET` isn't required for the app to run today.
- **Session storage** — the logged-in user is kept in `localStorage` (key `chatly_user`), not `sessionStorage`, so a single browser holds one session across all its tabs. To test two accounts at once, use two different browsers or an incognito window rather than a second tab.
- **Unused Firebase dependency** — `firebase` is installed and imported in `App.jsx`, but attachments actually go through Cloudinary; the Firebase Storage import is dead code and can be removed.
- **Stub files** — `components/chat/Messages.jsx`, `components/chat/ChatHeader.jsx`, and `components/profile/ProfilePanel.jsx` are currently empty; the chat header and message list are actually implemented inline in `ChatContainer.jsx`.

## License

No `LICENSE` file is currently included in this repository. Add one (e.g. MIT) if you intend to share or open-source this project.
