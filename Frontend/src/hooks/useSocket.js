import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';

const SOCKET_URL = API_URL;

export const useSocket = (
    currentUserId,
    onMessageReceived,
    onStatusChanged,
    onAvatarChanged,
    onMessageStatusUpdated,
    onNewUserAdded,
    onMessageDeleted,
    onReconnected   // ← new: called when socket reconnects so App can re-fetch missed messages
) => {
    const socketRef = useRef(null);

    // Keep a stable ref to onMessageReceived so the effect doesn't re-run
    // every render when the callback identity changes
    const onMessageReceivedRef = useRef(onMessageReceived);
    useEffect(() => { onMessageReceivedRef.current = onMessageReceived; }, [onMessageReceived]);

    const onReconnectedRef = useRef(onReconnected);
    useEffect(() => { onReconnectedRef.current = onReconnected; }, [onReconnected]);

    useEffect(() => {
        if (!currentUserId) return;

        const socket = io(SOCKET_URL, {
            reconnection: true,
            reconnectionAttempts: Infinity,    // keep trying forever
            reconnectionDelay: 1000,           // start at 1s
            reconnectionDelayMax: 5000,        // cap at 5s
            timeout: 10000,
        });

        socketRef.current = socket;

        // ✅ THE FIX: registerUser inside 'connect' fires on EVERY connect,
        //    including automatic reconnects after mobile background/sleep.
        //    The previous code emitted it once outside this handler, so after
        //    any reconnect the server never knew the user was back online.
        let isFirstConnect = true;
        socket.on('connect', () => {
            socket.emit('registerUser', currentUserId);

            // On reconnects (not the very first connect), tell App.jsx to
            // re-fetch the active conversation so missed messages are loaded.
            if (!isFirstConnect && onReconnectedRef.current) {
                onReconnectedRef.current();
            }
            isFirstConnect = false;
        });

        socket.on('receiveMessage', (message) => {
            onMessageReceivedRef.current?.(message);
        });

        socket.on('userStatusChanged', (payload) => {
            if (onStatusChanged) onStatusChanged(payload);
        });

        socket.on('messageStatusUpdated', (payload) => {
            if (onMessageStatusUpdated) onMessageStatusUpdated(payload);
        });

        socket.on('newUserAdded', (payload) => {
            if (onNewUserAdded) onNewUserAdded(payload);
        });

        socket.on('messageDeleted', (payload) => {
            if (onMessageDeleted) onMessageDeleted(payload);
        });

        socket.on('userAvatarChanged', (payload) => {
            if (onAvatarChanged) onAvatarChanged(payload);
        });

        // ✅ MOBILE FIX: When the user returns to the browser tab/app after
        //    it was backgrounded, re-register if the socket is still connected
        //    (reconnection may have happened silently without firing 'connect').
        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible') return;

            if (socket.connected) {
                // Socket stayed connected (e.g. short background), just re-register
                // to make sure the server still has us in onlineUsers.
                socket.emit('registerUser', currentUserId);
            } else {
                // Socket dropped while backgrounded — force a reconnect.
                // The 'connect' event above will handle registerUser + missed msg fetch.
                socket.connect();
            }

            if (onReconnectedRef.current) {
                onReconnectedRef.current();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            socket.disconnect();
        };

    // ✅ Only depends on currentUserId — stable callbacks are accessed via refs.
    //    The old code had all callbacks in the dep array, causing the socket to
    //    disconnect and reconnect on every render that changed a callback reference.
    }, [currentUserId]);

    const emitSendMessage = useCallback((receiverId, text, file) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('sendMessage', {
                senderId: currentUserId,
                receiverId,
                text,
                file
            });
        }
    }, [currentUserId]);

    const emitMarkMessagesRead = useCallback((partnerId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('markMessagesRead', {
                readerId: currentUserId,
                partnerId
            });
        }
    }, [currentUserId]);

    const emitUpdateAvatar = useCallback((avatarUrl) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('updateAvatar', {
                userId: currentUserId,
                avatarUrl
            });
        }
    }, [currentUserId]);

    return { emitSendMessage, emitUpdateAvatar, emitMarkMessagesRead };
};