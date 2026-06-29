import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = (currentUserId, onMessageReceived, onStatusChanged, onAvatarChanged) => {
    const socketRef = useRef(null);

    useEffect(() => {
        if (!currentUserId) return;

        socketRef.current = io(SOCKET_URL);
        socketRef.current.emit('registerUser', currentUserId);

        socketRef.current.on('receiveMessage', (message) => {
            onMessageReceived(message);
        });

        socketRef.current.on('userStatusChanged', (statusPayload) => {
            if (onStatusChanged) onStatusChanged(statusPayload);
        });

        // 🚀 listen for other users updating their avatars
        socketRef.current.on('userAvatarChanged', (avatarPayload) => {
            if (onAvatarChanged) onAvatarChanged(avatarPayload);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [currentUserId, onMessageReceived, onStatusChanged, onAvatarChanged]);

    const emitSendMessage = (receiverId, text, file) => {
        if (socketRef.current) {
            socketRef.current.emit('sendMessage', {
                senderId: currentUserId,
                receiverId,
                text,
                file
            });
        }
    };

    // 🚀 function to emit an avatar update event
    const emitUpdateAvatar = (avatarUrl) => {
        if (socketRef.current) {
            socketRef.current.emit('updateAvatar', {
                userId: currentUserId,
                avatarUrl
            });
        }
    };

    return { emitSendMessage, emitUpdateAvatar };
};