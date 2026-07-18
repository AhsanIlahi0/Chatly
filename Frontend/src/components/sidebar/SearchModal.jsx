import { useState, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';

/**
 * SearchModal
 * Lets users search by exact username.
 * - Public account  → "Message" button opens chat directly
 * - Private account → "Add Friend", "Pending", or "Message" (if already friends)
 */
export default function SearchModal({ currentUserId, onClose, onStartChat, onSendRequest, friendStatuses }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const inputRef = useRef(null);

  const handleSearch = async () => {
    const q = query.trim().toLowerCase().replace('@', '');
    if (!q) return;
    setLoading(true);
    setError('');
    setResult(null);
    setRequestSent(false);

    try {
      const res = await axios.get(`${API_URL}/api/auth/search`, {
        params: { username: q, currentUserId }
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.status === 404
        ? `No user found with username "@${q}"`
        : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  // Determine relationship between currentUser and found user
  const getRelationshipStatus = () => {
    if (!result) return 'none';
    const key = result._id?.toString() || result.id;
    return friendStatuses[key] || 'none';
  };

  const handleSendRequest = async () => {
    try {
      const targetId = result._id?.toString() || result.id;
      await onSendRequest(targetId);
      setRequestSent(true);
    } catch {
      setError('Failed to send request');
    }
  };

  const relationship = getRelationshipStatus();

  const ActionButton = () => {
    if (!result) return null;

    // Already friends → allow chat regardless of visibility
    if (relationship === 'accepted') {
      return (
        <button
          onClick={() => { onStartChat(result); onClose(); }}
          className="flex items-center gap-1.5 rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90 transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Message
        </button>
      );
    }

    // Public account → direct chat
    if (result.visibility === 'public') {
      return (
        <button
          onClick={() => { onStartChat(result); onClose(); }}
          className="flex items-center gap-1.5 rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90 transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Message
        </button>
      );
    }

    // Private account
    if (relationship === 'requested' || requestSent) {
      return (
        <span className="flex items-center gap-1.5 rounded-xl border border-dusk/30 px-4 py-2 text-sm text-dusk">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Request Sent
        </span>
      );
    }

    if (relationship === 'pending') {
      return (
        <span className="flex items-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-50 dark:bg-amber-400/10 px-4 py-2 text-sm text-amber-600 dark:text-amber-400">
          Sent you a request
        </span>
      );
    }

    // No relationship yet with private account → Add Friend
    return (
      <button
        onClick={handleSendRequest}
        className="flex items-center gap-1.5 rounded-xl bg-ember/10 border border-ember/20 px-4 py-2 text-sm font-semibold text-ember hover:bg-ember hover:text-white transition-all"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Add Friend
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-16 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-ink shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bone dark:border-ink-line">
          <h3 className="font-semibold text-ink dark:text-bone">Find a user</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-bone dark:hover:bg-white/10 transition-colors">
            <svg className="h-4 w-4 text-dusk" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Search input */}
          <div className="flex gap-2">
            {/* 🛠️ Styled focus ring cleanly controlled on wrapper container */}
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-bone dark:border-ink-line bg-bone/40 dark:bg-white/5 px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal/40">
              <span className="text-dusk font-mono text-sm">@</span>
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value.replace('@', '')); setError(''); setResult(null); }}
                onKeyDown={handleKeyDown}
                placeholder="username"
                /* Inline styles act as an absolute override against browser defaults and form plugins */
                style={{ outline: 'none', boxShadow: 'none' }}
                className="flex-1 bg-transparent text-sm text-ink dark:text-bone placeholder:text-dusk font-mono border-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none focus-visible:ring-0"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-40 transition-all"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>

          {/* Error state */}
          {error && (
            <p className="text-sm text-dusk text-center py-2">{error}</p>
          )}

          {/* Result card */}
          {result && (
            <div className="rounded-xl border border-bone dark:border-ink-line bg-bone/30 dark:bg-white/5 p-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={result.avatar}
                    alt={result.name}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-ink ${result.status === 'online' ? 'bg-teal' : 'bg-dusk/40'}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink dark:text-bone truncate">{result.name}</p>
                  <p className="text-xs text-dusk font-mono">@{result.username}</p>
                </div>

                {/* Visibility badge */}
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${result.visibility === 'public'
                    ? 'bg-teal/10 text-teal'
                    : 'bg-ember/10 text-ember'
                  }`}>
                  {result.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                </span>
              </div>

              {/* Action row */}
              <div className="mt-3 flex justify-end">
                <ActionButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}