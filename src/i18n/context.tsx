import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import fr from './locales/fr.json';
import en from './locales/en.json';
import sw from './locales/sw.json';

export type Language = 'fr' | 'en' | 'sw';

const allTranslations: Record<Language, Record<string, string>> = { fr, en, sw };

interface TranslationContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('ldbusiness_lang');
    if (saved === 'en' || saved === 'sw') return saved;
    return 'fr';
  });

  const handleSetLang = useCallback((newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('ldbusiness_lang', newLang);
  }, []);

  const translations = allTranslations[lang];

  const t = useCallback(
    (key: string): string => translations[key] || key,
    [translations]
  );

  return (
    <TranslationContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useTranslation must be used within TranslationProvider');
  return ctx;
}
