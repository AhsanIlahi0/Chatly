import ChatContainer from './ChatContainer';

function ActiveChat({ theme, setTheme, activeUser, messages,isDetailTabOpen, onSendMessage, onDeselectUser, onCloseProfile, onOpenProfile, onToggleProfile }) {
    return (
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
            <ChatContainer
                theme={theme}
                setTheme={setTheme}
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