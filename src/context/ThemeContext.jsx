import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
    // Themes: 'light', 'midnight', 'gold'
    const [socialTheme, setSocialTheme] = useState(() => {
        return localStorage.getItem('socialTheme') || 'light';
    });

    useEffect(() => {
        localStorage.setItem('socialTheme', socialTheme);

        // Helper to remove social specific classes
        const removeSocialClasses = () => {
            document.documentElement.classList.remove('theme-midnight', 'theme-gold');
            // We also remove dark here because in this context, we are calculating it solely based on social theme
            // If the main app implies a different dark mode strategy, this might strictly enforce light mode on exit
            // For now, this is safer than leaving it stuck in dark mode.
            document.documentElement.classList.remove('dark');
        };

        removeSocialClasses();

        // Add new if not default
        if (socialTheme !== 'light') {
            document.documentElement.classList.add(`theme-${socialTheme}`);
            document.documentElement.classList.add('dark');
        }

        // Cleanup on unmount to ensure main app isn't affected
        return () => removeSocialClasses();
    }, [socialTheme]);

    const value = {
        socialTheme,
        setSocialTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}
