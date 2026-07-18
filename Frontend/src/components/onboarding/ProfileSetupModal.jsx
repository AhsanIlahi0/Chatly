import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';

/**
 * ProfileSetupModal
 * Shown once after first login when user.visibility is null.
 * Forces the user to pick a unique username and a privacy setting
 * before they can access the app.
 */
export default function ProfileSetupModal({ currentUser, onComplete }) {
    const [username, setUsername] = useState('');
    const [visibility, setVisibility] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!username.trim()) return setError('Please choose a username');
        if (!/^[a-z0-9_]{3,20}$/.test(username.trim())) {
            return setError('3-20 characters: letters, numbers, underscores only');
        }
        if (!visibility) return setError('Please choose Public or Private');

        setError('');
        setLoading(true);

        try {
            const res = await axios.put(`${API_URL}/api/auth/setup-profile`, {
                userId: currentUser._id,
                username: username.trim().toLowerCase(),
                visibility
            });
            onComplete(res.data); // pass updated user back to App
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-ink shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-teal to-teal/70 px-6 py-5">
                    <h2 className="text-xl font-bold text-white">Set up your profile</h2>
                    <p className="text-sm text-white/80 mt-1">
                        Choose how others can find and contact you
                    </p>
                </div>

                <div className="px-6 py-6 space-y-6">

                    {/* Avatar + name preview */}
                    <div className="flex items-center gap-3">
                        <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-teal/30"
                        />
                        <div>
                            <p className="font-semibold text-ink dark:text-bone">{currentUser.name}</p>
                            <p className="text-xs text-dusk">{currentUser.email}</p>
                        </div>
                    </div>

                    {/* Username input */}
                    <div>
                        <label className="block text-sm font-semibold text-ink dark:text-bone mb-1.5">
                            Username
                        </label>
                        <div className="flex items-center rounded-xl border border-bone dark:border-ink-line bg-bone/40 dark:bg-white/5 px-3 py-2.5 gap-2 focus-within:ring-2 focus-within:ring-teal/40">
                            <span className="text-dusk font-mono text-sm">@</span>
                            <input
                                type="text"
                                value={username}
                                onChange={e => {
                                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                                    setError('');
                                }}
                                placeholder="your_username"
                                maxLength={20}
                                className="flex-1 bg-transparent text-sm text-ink dark:text-bone placeholder:text-dusk outline-none font-mono"
                            />
                            <span className="text-xs text-dusk">{username.length}/20</span>
                        </div>
                        <p className="text-[11px] text-dusk mt-1">
                            Others can search for you using this username
                        </p>
                    </div>

                    {/* Visibility picker */}
                    <div>
                        <label className="block text-sm font-semibold text-ink dark:text-bone mb-2">
                            Account Privacy
                        </label>
                        <div className="grid grid-cols-2 gap-3">

                            {/* Public card */}
                            <button
                                type="button"
                                onClick={() => { setVisibility('public'); setError(''); }}
                                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                                    visibility === 'public'
                                        ? 'border-teal bg-teal/5 dark:bg-teal/10'
                                        : 'border-bone dark:border-ink-line hover:border-teal/40'
                                }`}
                            >
                                {visibility === 'public' && (
                                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-teal">
                                        <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                    </span>
                                )}
                                <div className="text-2xl mb-2">🌐</div>
                                <p className="font-semibold text-sm text-ink dark:text-bone">Public</p>
                                <p className="text-[11px] text-dusk mt-0.5 leading-snug">
                                    Anyone can message you directly
                                </p>
                            </button>

                            {/* Private card */}
                            <button
                                type="button"
                                onClick={() => { setVisibility('private'); setError(''); }}
                                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                                    visibility === 'private'
                                        ? 'border-ember bg-ember/5 dark:bg-ember/10'
                                        : 'border-bone dark:border-ink-line hover:border-ember/40'
                                }`}
                            >
                                {visibility === 'private' && (
                                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-ember">
                                        <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                    </span>
                                )}
                                <div className="text-2xl mb-2">🔒</div>
                                <p className="font-semibold text-sm text-ink dark:text-bone">Private</p>
                                <p className="text-[11px] text-dusk mt-0.5 leading-snug">
                                    Others must request to message you
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-ember bg-ember/10 rounded-lg px-3 py-2">{error}</p>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !username || !visibility}
                        className="w-full rounded-xl bg-teal py-3 text-sm font-semibold text-white transition-all hover:bg-teal/90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : 'Continue to Chatly →'}
                    </button>
                </div>
            </div>
        </div>
    );
}