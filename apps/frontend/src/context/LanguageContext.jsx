import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../locales/en';
import { es } from '../locales/es';

const dictionaries = { en, es };

const LanguageContext = createContext(undefined);

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => localStorage.getItem('vibe_lang') || 'es');

  useEffect(() => {
    localStorage.setItem('vibe_lang', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const toggleLanguage = () => {
    setLocale((prev) => (prev === 'es' ? 'en' : 'es'));
  };

  const t = (key) => {
    const dict = dictionaries[locale];
    if (!dict) return key;
    return dict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
