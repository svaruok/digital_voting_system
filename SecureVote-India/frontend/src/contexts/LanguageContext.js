import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, langMap } from '../i18n/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState('en');
  const [activeLangDisplay, setActiveLangDisplay] = useState('English');

  const t = (key) => {
    return translations[currentLang]?.[key] || key;
  };

  const changeLanguage = (displayLang) => {
    const langCode = langMap[displayLang];
    if (langCode) {
      setCurrentLang(langCode);
      setActiveLangDisplay(displayLang);
      document.documentElement.lang = langCode;
      localStorage.setItem('preferredLang', displayLang);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('preferredLang') || 'English';
    changeLanguage(saved);
  }, []);

  return (
    <LanguageContext.Provider value={{ t, changeLanguage, currentLang, activeLangDisplay }}>
      {children}
    </LanguageContext.Provider>
  );
};
