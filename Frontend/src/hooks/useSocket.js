// Frontend/src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000'; // Target URL pointing to your Node backend server

export const useSocket = (currentUserId, onMessageReceived, onStatusChanged) => {
    const socketRef = useRef(null);

    useEffect(() => {
        if (!currentUserId) return;

        // Initialize connection
        socketRef.current = io(SOCKET_URL);

        // Register the active user with the backend socket server
        socketRef.current.emit('registerUser', currentUserId);

        // Event listener for incoming live messages
        socketRef.current.on('receiveMessage', (message) => {
            onMessageReceived(message);
        });

        // Event listener to watch contacts flip between online/offline states
        socketRef.current.on('userStatusChanged', (statusPayload) => {
            if (onStatusChanged) onStatusChanged(statusPayload);
        });

        // Clean up connection hooks when component layouts unmount or users switch accounts
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [currentUserId, onMessageReceived, onStatusChanged]);

    // Expose a quick trigger to emit outgoing chat messages down down the websocket pipe
    const emitSendMessage = (receiverId, text) => {
        if (socketRef.current) {
            socketRef.current.emit('sendMessage', {
                senderId: currentUserId,
                receiverId,
                text
            });
        }
    };

    return { emitSendMessage };
};