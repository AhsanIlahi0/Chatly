import { useState } from "react";

const Avatar = ({ user }) => {
    const [imgFailed, setImgFailed] = useState(false);

    // "default_avatar.png" is a schema placeholder, not a real uploaded
    // image — treat it (and any failed image load) as "no avatar".
    const isPlaceholder = !user?.avatar || user.avatar === 'default_avatar.png';
    const hasImageAvatar = !isPlaceholder && !imgFailed && (user.avatar.startsWith('http') || user.avatar.includes('.'));

    return (
        <div className="relative w-full h-full shrink-0">
            <div className="flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-ember to-ember-soft text-ink font-display font-bold uppercase overflow-hidden">
                {hasImageAvatar ? (
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <span>{user?.name ? user.name.charAt(0) : "?"}</span>
                )}
            </div>

            {/* Live-signal presence indicator */}
            {user?.status === 'online' && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-teal animate-signal-pulse" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-teal ring-2 ring-parchment dark:ring-ink" />
                </span>
            )}
            {user?.status === 'away' && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-parchment dark:ring-ink" />
            )}
        </div>
    );
};
export default Avatar;
