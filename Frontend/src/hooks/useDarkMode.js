import { useEffect, useState } from 'react';

export function useDarkMode() {
    // 1. Check localStorage first, fallback to system preferences
    const [theme, setThemeState] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved) return saved;

            const systemMatch = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return systemMatch ? 'dark' : 'light';
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // 2. Add or remove the .dark class on the <html> tag
        if (theme === 'dark') {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    // 3. Flip the theme with a radial wipe centered on wherever the toggle
    //    was clicked, using the View Transitions API where it's supported.
    //    `event` is optional — when this is wired straight to onClick, the
    //    browser hands it the MouseEvent for free; if it's ever called
    //    without one, the wipe just centers on the screen instead.
    const toggleTheme = (event) => {
        const next = theme === 'light' ? 'dark' : 'light';

        const x = event?.clientX ?? window.innerWidth / 2;
        const y = event?.clientY ?? window.innerHeight / 2;
        document.documentElement.style.setProperty('--theme-toggle-x', `${x}px`);
        document.documentElement.style.setProperty('--theme-toggle-y', `${y}px`);

        if (typeof document.startViewTransition === 'function') {
            document.startViewTransition(() => setThemeState(next));
        } else {
            setThemeState(next);
        }
    };

    return [theme, toggleTheme];
}
