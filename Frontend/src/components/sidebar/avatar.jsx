const Avatar = ({ user }) => {
    // Simple check: If it looks like a URL or an image file path, render the image
    const hasImageAvatar = user.avatar && (user.avatar.startsWith('http') || user.avatar.includes('.'));

    return (
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold uppercase overflow-hidden shrink-0">
            {hasImageAvatar ? (
                <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback in case a real image URL fails to load
                        e.target.style.display = 'none';
                    }}
                />
            ) : (
                // Fallback UI: Displays the initials (e.g., "AJ", "BS") safely without any broken image icons!
                <span>{user.avatar || user.name.charAt(0)}</span>
            )}
        </div>
    );
};
export default Avatar;