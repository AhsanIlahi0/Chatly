function SearchInput({ searchTerm, setSearchTerm }) {
    return (
        /* Light gray background default, dark theme background override */
        <div className="relative border-b border-slate-100 bg-slate-50/50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
            <input
                type="text"
                placeholder="Search users..."
                className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-800 outline-none transition-all placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus:bg-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="pointer-events-none absolute left-8 top-1/2 h-4 w-4 -translate-y-1/2 stroke-2 text-slate-400 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
            </svg>
        </div>
    );
}

export default SearchInput;