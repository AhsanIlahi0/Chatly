# 💬 Chatly — Enterprise Real-Time Chat Engine

A polished, full-stack real-time chat application built using the MERN stack (MongoDB, Express, React, Node.js) and enhanced with bi-directional WebSocket communication via Socket.io. Features secure session routing, a responsive fluid UI layout, dynamic cloud media management, and real-time synchronization pipelines.

---

## ✨ Features

- **🔒 Sticky Authentication & Session Isolation:** Built using browser-isolated `sessionStorage` sandboxes, explicitly allowing multi-profile side-by-side execution tabs for developers and users without account pollution or state collision on manual page reloads.
- **⚡ Real-Time Bi-directional Communication:** Fueled by a custom Socket.io integration mapping live event listeners for immediate text and media delivery, as well as active contact connection lifecycle states (Online/Offline/Away).
- **🎨 Visual Paradigm "Circles" Login Interface:** A custom layout design featuring premium glassmorphic properties, responsive canvas dimensions, and deep navy-blue dark mode components matching a high-fidelity design schema.
- **🖼️ Real-Time Profile Avatar Propagation:** Upload custom image assets seamlessly routed through cloud object storage API pipelines, written directly to MongoDB User documents, and broadcasted globally across active channels instantly via low-latency websocket hooks.
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
- **Media Optimization Pipeline:** Cloud object storage REST API integration

---

## 🚀 Installation & Local Environment Configuration

### Prerequisites
Ensure your workstation has **Node.js (v16+)** installed alongside a running instance of **MongoDB** (Local Community Edition daemon or an Atlas Cloud cluster connection string URL).

### 1. Initializing the Server Core
Navigate into your backend cluster workspace terminal directory:
```bash
cd Backend
npm install