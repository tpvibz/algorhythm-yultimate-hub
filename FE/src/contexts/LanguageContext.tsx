import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = {
  code: string;
  name: string;
  nativeName: string;
};

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  languages: Language[];
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get language from URL query param, localStorage, or default to 'en'
  const getInitialLanguage = (): string => {
    // Check URL query param first
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    if (langFromUrl && SUPPORTED_LANGUAGES.some(l => l.code === langFromUrl)) {
      return langFromUrl;
    }

    // Check localStorage
    const langFromStorage = localStorage.getItem(STORAGE_KEY);
    if (langFromStorage && SUPPORTED_LANGUAGES.some(l => l.code === langFromStorage)) {
      return langFromStorage;
    }

    // Default to English
    return 'en';
  };

  const [language, setLanguageState] = useState<string>(getInitialLanguage);

  // Update URL and localStorage when language changes
  const setLanguage = (lang: string) => {
    if (!SUPPORTED_LANGUAGES.some(l => l.code === lang)) {
      console.warn(`Unsupported language: ${lang}`);
      return;
    }

    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);

    // Update URL query param without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url.toString());
  };

  // Listen for URL changes (e.g., when user manually changes ?lang=)
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const langFromUrl = urlParams.get('lang');
      if (langFromUrl && SUPPORTED_LANGUAGES.some(l => l.code === langFromUrl)) {
        setLanguageState(langFromUrl);
        localStorage.setItem(STORAGE_KEY, langFromUrl);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync language from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    if (langFromUrl && langFromUrl !== language) {
      setLanguage(langFromUrl);
    }
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

