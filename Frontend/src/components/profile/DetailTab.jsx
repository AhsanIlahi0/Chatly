import closeIcon from '../../images/close.png' // Adjust the paths (../) to match your folder structure
import closeIconDark from '../../images/closeDark.png' // Adjust the paths (../) to match your folder structure
import { useDarkMode } from '../../hooks/useDarkMode'
function DetailTab({ activeUser, isOpen, onClose, theme }) {
    //set deail tab to user 1 for testing;
    // const [theme, toggleTheme] = useDarkMode();

    const testUser = {
        id: 1,
        name: 'Alice Johnson',
        status: 'online',
        about: 'Software Engineer',
        time: 'Just now',
        unread: 0,
        avatar: null
    };
    return (
        /* The width changes from w-0 to w-72 with transitions */
        <aside
            className={`bg-white overflow-hidden flex-shrink-0 border-l border-gray-200 transition-all duration-400 ease-out dark:bg-slate-950 dark:border-slate-800 ${isOpen && activeUser ? "w-72 opacity-100" : "w-0 opacity-0 border-l-0"
                }`}
        >
            {/* Setting a inner fixed content width wrapper holds internal text blocks rigid */}
            <div className=" bg-white text-slate-900 w-72 h-full flex flex-col overflow-y-auto dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 dark:text-slate-100">
                <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-5 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="pl-0.5 cursor-pointer flex mt-0.5 h-8 w-8 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/10"
                        aria-label="Close detail tab"
                    >
                        {
                            (theme === 'light') ?
                                <img
                                    type="button"
                                    src={closeIcon}
                                    alt="Close"
                                    className="h-5 w-5 object-contain "
                                /> : 
                                <img
                                    type="button"
                                    src={closeIconDark}
                                    alt="Close"
                                    className="h-5 w-5 object-contain "
                                />
                        }
                    </button>
                    <h2 className="m-0 text-base font-semibold text-slate-900 dark:text-white">{activeUser?.name ? `${(activeUser.name).split(' ')[0]}'s Profile` : ''}</h2>

                </div>

                {!activeUser ? (
                    <div className="p-6 text-sm text-slate-900 dark:text-white"></div>
                ) : (
                    <div className="p-6 ">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-24 w-24 rounded-full overflow-hidden bg-sky-500 flex items-center justify-center text-2xl font-semibold text-white shadow-sm dark:bg-sky-400 dark:text-slate-950">
                                {activeUser.avatar ? (
                                    <img src={activeUser.avatar} alt={activeUser.name} className="h-full w-full object-cover" />
                                ) : (
                                    activeUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                                )}
                            </div>

                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{activeUser.name}</h3>
                                <p className={`text-sm ${activeUser.status === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-slate-400'}`}>
                                    {activeUser.status === 'online' ? 'Online' : activeUser.status === 'away' ? 'Away' : 'Offline'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <h4 className="text-xs uppercase text-slate-500 dark:text-slate-400">About</h4>
                                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{activeUser.about ?? 'No profile description provided.'}</p>
                            </div>

                            <div>
                                <h4 className="text-xs uppercase text-slate-500 dark:text-slate-400">Last Seen</h4>
                                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{activeUser.time ?? 'Unknown'}</p>
                            </div>

                            <div>
                                <h4 className="text-xs uppercase text-slate-500 dark:text-slate-400">Unread</h4>
                                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{activeUser.unread ?? 0} messages</p>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <button onClick={()=>{
                                document.getElementById("txtarea").focus();
                            }} className="cursor-pointer flex-1 rounded-md bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400">Message</button>
                            <button className="rounded-md cursor-pointer border border-gray-200 py-2 px-3 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">More</button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

export default DetailTab;