import ChatContainer from './ChatContainer';

function ActiveChat({ theme, setTheme, onLogout, activeUser, messages, isDetailTabOpen, onSendMessage, onDeselectUser, onCloseProfile, onOpenProfile, onToggleProfile, isChatActive }) {
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
                onDeselectUser={onDeselectUser}
                onCloseProfile={onCloseProfile}
                onOpenProfile={onOpenProfile}
                onToggleProfile={onToggleProfile}
            />
        </div>
    );
}

export default ActiveChat;