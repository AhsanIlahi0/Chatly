import ChatContainer from './ChatContainer';

function ActiveChat({ theme, setTheme, activeUser, messages, onSendMessage, onDeselectUser, onOpenProfile, onToggleProfile }) {
    return (
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
            <ChatContainer
                theme={theme}
                setTheme={setTheme}
                activeUser={activeUser}
                messages={messages}
                onSendMessage={onSendMessage}
                onDeselectUser={onDeselectUser}
                onOpenProfile={onOpenProfile}
                onToggleProfile={onToggleProfile}
            />
        </div>
    );
}

export default ActiveChat;