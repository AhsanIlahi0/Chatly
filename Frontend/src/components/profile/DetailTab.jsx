import Avatar from '../sidebar/avatar';

function DetailTab({ activeUser, isOpen, onClose }) {
    const visible = isOpen && activeUser;

    return (
        /* Mobile: full-screen overlay when open, hidden otherwise.
           Desktop (md+): the original collapsing slide-in column. */
        <aside
            className={`${visible
                ? 'fixed inset-0 z-50 w-full opacity-100 md:static md:z-auto md:w-72'
                : 'hidden md:block md:w-0 md:opacity-0 md:border-l-0'
                } flex-shrink-0 overflow-hidden border-l border-bone bg-white transition-all duration-400 ease-out dark:border-ink-line dark:bg-ink`}
        >
            <div className="bg-white text-ink h-full w-full flex flex-col overflow-y-auto dark:bg-gradient-to-br dark:from-ink-soft dark:to-ink dark:text-bone md:w-72">
                <div className="flex items-center gap-2 border-b border-bone px-5 py-5 dark:border-ink-line">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full text-dusk transition-colors hover:bg-bone hover:text-ink dark:hover:bg-white/10 dark:hover:text-bone"
                        aria-label="Close detail tab"
                    >
                        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                    <h2 className="m-0 font-display text-base font-semibold text-ink dark:text-bone">{activeUser?.name ? `${(activeUser.name).split(' ')[0]}'s Profile` : ''}</h2>
                </div>

                {!activeUser ? (
                    <div className="p-6 text-sm text-ink dark:text-bone"></div>
                ) : (
                    <div className="p-6">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-24 w-24 shadow-sm">
                                <Avatar user={activeUser} />
                            </div>

                            <div className="text-center">
                                <h3 className="font-display text-lg font-semibold text-ink dark:text-bone">{activeUser.name}</h3>
                                <p className={`font-mono text-[11px] uppercase tracking-wide mt-0.5 ${activeUser.status === 'online' ? 'text-teal' : 'text-dusk'}`}>
                                    {activeUser.status === 'online' ? 'online' : activeUser.status === 'away' ? 'away' : 'offline'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-7 space-y-4">
                            <div>
                                <h4 className="font-mono text-[10px] uppercase tracking-widest text-dusk">About</h4>
                                <p className="mt-1.5 text-sm text-ink/90 dark:text-bone/90">{activeUser.about ?? 'No profile description provided.'}</p>
                            </div>

                            <div>
                                <h4 className="font-mono text-[10px] uppercase tracking-widest text-dusk">Last Seen</h4>
                                <p className="mt-1.5 text-sm text-ink/90 dark:text-bone/90">{activeUser.time ?? 'Unknown'}</p>
                            </div>

                            <div>
                                <h4 className="font-mono text-[10px] uppercase tracking-widest text-dusk">Unread</h4>
                                <p className="mt-1.5 text-sm text-ink/90 dark:text-bone/90">{activeUser.unread ?? 0} messages</p>
                            </div>
                        </div>

                        <div className="mt-7 flex gap-2">
                            <button onClick={() => {
                               
                                document.getElementById("txtarea").focus();
                            }, {onClose}} className="cursor-pointer flex-1 rounded-xl bg-ember py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ff5a35]">Message</button>
                            <button className="rounded-xl cursor-pointer border border-bone py-2.5 px-4 text-sm font-medium text-ink transition-colors hover:bg-bone/60 dark:border-ink-line dark:text-bone dark:hover:bg-white/5">More</button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

export default DetailTab;
