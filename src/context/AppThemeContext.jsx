import { createContext, useContext, useState, useEffect } from 'react';

const AppThemeContext = createContext();

export function useAppTheme() {
    return useContext(AppThemeContext);
}

export function AppThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('appTheme') || 'system';
    });

    const [accentColor, setAccentColor] = useState(() => {
        return localStorage.getItem('accentColor') || 'orange';
    });

    const [navbarAlign, setNavbarAlign] = useState(() => {
        return localStorage.getItem('navbarAlign') || 'left';
    });

    const [notifications, setNotifications] = useState(() => {
        return localStorage.getItem('notifications') !== 'false';
    });

    useEffect(() => {
        localStorage.setItem('appTheme', theme);
        localStorage.setItem('accentColor', accentColor);
        localStorage.setItem('navbarAlign', navbarAlign);
        localStorage.setItem('notifications', notifications.toString());

        const root = document.documentElement;
        
        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme === 'light') {
            root.classList.remove('dark');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }, [theme, accentColor, navbarAlign, notifications]);

    useEffect(() => {
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    const value = {
        theme,
        setTheme,
        accentColor,
        setAccentColor,
        navbarAlign,
        setNavbarAlign,
        notifications,
        setNotifications
    };

    return (
        <AppThemeContext.Provider value={value}>
            {children}
        </AppThemeContext.Provider>
    );
}
