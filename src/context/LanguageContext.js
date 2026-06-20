import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { i18n, detectDeviceLanguage, setLocale, SUPPORTED_LANGUAGES } from '../locales/i18n';

const STORAGE_KEY = '@fixbook:language';
const LanguageContext = createContext({});

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(i18n.defaultLocale);
  const [ready,    setReady]    = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const code  = saved || detectDeviceLanguage();
      setLocale(code);
      setLanguage(code);
      setReady(true);
    })();
  }, []);

  const changeLanguage = useCallback(async (code) => {
    setLocale(code);
    setLanguage(code);
    await AsyncStorage.setItem(STORAGE_KEY, code);
  }, []);

  const t = useCallback((key, options) => i18n.t(key, options), [language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, supported: SUPPORTED_LANGUAGES, ready }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);
