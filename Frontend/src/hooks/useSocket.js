import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = (
    currentUserId,
    onMessageReceived,
    onStatusChanged,
    onAvatarChanged,
    onFriendRequestReceived,
    onFriendRequestAccepted,
    onFriendRequestDeclined,
    onFriendRequestCancelled
) => {
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

        // 📨 Someone just sent ME a friend request
        socketRef.current.on('friendRequestReceived', (payload) => {
            if (onFriendRequestReceived) onFriendRequestReceived(payload);
        });

        // ✅ Someone accepted a friend request I sent them
        socketRef.current.on('friendRequestAccepted', (payload) => {
            if (onFriendRequestAccepted) onFriendRequestAccepted(payload);
        });

        // ❌ Someone declined a friend request I sent them
        socketRef.current.on('friendRequestDeclined', (payload) => {
            if (onFriendRequestDeclined) onFriendRequestDeclined(payload);
        });

        // 🚫 Someone cancelled a friend request they'd sent me
        socketRef.current.on('friendRequestCancelled', (payload) => {
            if (onFriendRequestCancelled) onFriendRequestCancelled(payload);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [
        currentUserId,
        onMessageReceived,
        onStatusChanged,
        onAvatarChanged,
        onFriendRequestReceived,
        onFriendRequestAccepted,
        onFriendRequestDeclined,
        onFriendRequestCancelled
    ]);

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
