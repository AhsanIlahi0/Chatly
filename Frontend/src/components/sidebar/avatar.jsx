import { useState } from "react";

const Avatar = ({ user }) => {
    const [imgFailed, setImgFailed] = useState(false);

    // "default_avatar.png" is the schema's placeholder value, not a real
    // uploaded image — treat it (and any failed image load) as "no avatar".
    const isPlaceholder = !user?.avatar || user.avatar === 'default_avatar.png';
    const hasImageAvatar = !isPlaceholder && !imgFailed && (user.avatar.startsWith('http') || user.avatar.includes('.'));

    return (
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold uppercase overflow-hidden shrink-0">
            {hasImageAvatar ? (
                <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={() => setImgFailed(true)}
                />
            ) : (
                // Fallback UI: Displays the initials safely without any broken image icons!
                <span>{user?.name ? user.name.charAt(0) : "?"}</span>
            )}
        </div>
    );
};
export default Avatar;
