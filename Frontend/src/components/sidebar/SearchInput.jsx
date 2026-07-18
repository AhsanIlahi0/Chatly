function SearchInput({ searchTerm, setSearchTerm }) {
    return (
        <div className="relative bg-parchment/60 px-5 py-4  dark:bg-transparent">
            <input
                type="text"
                style={{ outline: 'none' }} // Inline style to remove the default focus outline
                placeholder="Search people..."
                className="w-full rounded-full  px-4 py-2.5 pl-10 text-sm text-ink outline-none transition-all placeholder-dusk/70  focus:shadow-[0_0_0_4px_rgba(255,107,71,0.12)]  dark:bg-ink-soft dark:text-bone dark:placeholder:text-dusk "
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="pointer-events-none absolute left-8 top-1/2 h-4 w-4 -translate-y-1/2 stroke-2 text-dusk/70" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
            </svg>
        </div>
    );
}

export default SearchInput;
