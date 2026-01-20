import React, { createContext, useContext, useState, useEffect } from 'react';
import { en, type TranslationKeys } from '../translations/en';
import { fr } from '../translations/fr';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'fr';

interface I18nContextType {
language: Language;
setLanguage: (lang: Language) => void;
t: TranslationKeys;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations: Record<Language, TranslationKeys> = {
en,
fr,
};

const LANGUAGE_KEY = '@transpo_language';

export function I18nProvider({ children }: { children?: any }) {
const [language, setLanguageState] = useState<Language>('en');

useEffect(() => {
// Load saved language preference
AsyncStorage.getItem(LANGUAGE_KEY).then((saved: string | null) => {
if (saved === 'en' || saved === 'fr') {
setLanguageState(saved);
}
});
}, []);

const setLanguage = (lang: Language) => {
setLanguageState(lang);
AsyncStorage.setItem(LANGUAGE_KEY, lang);
};

const value: I18nContextType = {
language,
setLanguage,
// Some TS build configurations used by this environment can incorrectly widen `language` to `any`.
// Keep the runtime behavior identical, but cast to preserve type-safety for consumers.
t: (translations as any)[language] as TranslationKeys,
};

return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
const context = useContext(I18nContext);
if (!context) {
throw new Error('useTranslation must be used within I18nProvider');
}
return context;
}