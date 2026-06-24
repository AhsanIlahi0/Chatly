import { useEffect, useState } from 'react';

export function useDarkMode() {
    // 1. Check localStorage first, fallback to system preferences
    const [theme, setTheme] = useState(() => {
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

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    return [theme, toggleTheme];
}