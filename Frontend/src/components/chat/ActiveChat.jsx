import ChatContainer from './ChatContainer';

function ActiveChat({ theme, setTheme, onLogout, activeUser, messages, isDetailTabOpen, onSendMessage, onDeleteMessage, onDeselectUser, onCloseProfile, onOpenProfile, onToggleProfile, isChatActive, currentUserId }) {
    return (
        <div className={`${isChatActive ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col overflow-hidden bg-parchment dark:bg-ink`}>
            <ChatContainer
                theme={theme}
                setTheme={setTheme}
                onLogout={onLogout}
                activeUser={activeUser}
                messages={messages}
                isDetailTabOpen={isDetailTabOpen}
                onSendMessage={onSendMessage}
                onDeleteMessage={onDeleteMessage}
                onDeselectUser={onDeselectUser}
                onCloseProfile={onCloseProfile}
                onOpenProfile={onOpenProfile}
                onToggleProfile={onToggleProfile}
                currentUserId={currentUserId}
            />
        </div>
    );
}

export default ActiveChat;