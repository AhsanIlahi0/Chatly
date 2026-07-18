import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import { toast } from 'sonner';
const SOCKET_URL = API_URL;

export const useSocket = (currentUserId, onMessageReceived, onStatusChanged, onAvatarChanged, onMessageStatusUpdated, onNewUserAdded, onMessageDeleted) => {
    const socketRef = useRef(null);

    useEffect(() => {
        if (!currentUserId) return;
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
        socketRef.current = io(SOCKET_URL);
        socketRef.current.emit('registerUser', currentUserId);

        socketRef.current.on("receiveMessage", (message) => {
            onMessageReceived(message);

            // Don't notify if user is already viewing this chat
            if (activeUserId === message.sender) return;

            // Only notify when tab isn't focused
            if (document.hidden && Notification.permission === "granted") {
                new Notification(message.senderName, {
                    body: message.text,
                    icon: message.senderAvatar || "/logo.png",
                });
            }
        });

        socketRef.current.on('userStatusChanged', (statusPayload) => {
            if (onStatusChanged) onStatusChanged(statusPayload);
        });

        socketRef.current.on('messageStatusUpdated', (statusPayload) => {
            if (onMessageStatusUpdated) onMessageStatusUpdated(statusPayload);
        });

        socketRef.current.on('newUserAdded', (newUserPayload) => {
            if (onNewUserAdded) onNewUserAdded(newUserPayload);
        });

        socketRef.current.on('messageDeleted', (deletedPayload) => {
            if (onMessageDeleted) onMessageDeleted(deletedPayload);
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
    }, [currentUserId, onMessageReceived, onStatusChanged, onAvatarChanged, onMessageStatusUpdated, onNewUserAdded, onMessageDeleted]);

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

    const emitMarkMessagesRead = (partnerId) => {
        if (socketRef.current) {
            socketRef.current.emit('markMessagesRead', {
                readerId: currentUserId,
                partnerId
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

    return { emitSendMessage, emitUpdateAvatar, emitMarkMessagesRead };
};