import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from './en';
import lt from './lt';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'lt', label: 'Lietuvių' },
];

export const i18n = new I18n({ en, lt });
i18n.enableFallback = true;
i18n.defaultLocale  = 'en';

export function detectDeviceLanguage() {
  const locales = Localization.getLocales?.() || [];
  const code    = locales[0]?.languageCode?.toLowerCase();
  return SUPPORTED_LANGUAGES.some((l) => l.code === code) ? code : 'en';
}

export function setLocale(code) {
  i18n.locale = code;
}

export function t(key, options) {
  return i18n.t(key, options);
}
