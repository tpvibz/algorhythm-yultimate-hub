import { useEffect, useMemo, useRef, useState } from 'react';
import api from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';

type Cache = Record<string, string>;

export function useTranslate() {
  const { language } = useLanguage();
  const cacheRef = useRef<Record<string, Cache>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // initialize cache bucket for current language
    if (!cacheRef.current[language]) cacheRef.current[language] = {};
  }, [language]);

  const t = useMemo(() => {
    const translate = async (input: string): Promise<string> => {
      if (!input) return input;
      if (language === 'en') return input;

      const langCache = cacheRef.current[language] || (cacheRef.current[language] = {});
      if (langCache[input]) return langCache[input];

      try {
        setIsTranslating(true);
        const { data } = await api.post('/translate', { text: input, lang: language });
        const out = data?.data?.translation || input;
        langCache[input] = out;
        return out;
      } catch {
        return input;
      } finally {
        setIsTranslating(false);
      }
    };
    return translate;
  }, [language]);

  const translateMany = async (inputs: string[]): Promise<string[]> => {
    const langCache = cacheRef.current[language] || (cacheRef.current[language] = {});
    const missing = inputs.filter(s => s && !langCache[s]);
    if (language !== 'en' && missing.length > 0) {
      try {
        setIsTranslating(true);
        const { data } = await api.post('/translate', { texts: missing, lang: language });
        const outs: string[] = data?.data?.translations || [];
        missing.forEach((src, i) => {
          langCache[src] = outs[i] || src;
        });
      } catch {
        // ignore
      } finally {
        setIsTranslating(false);
      }
    }
    return inputs.map(s => (s ? langCache[s] || s : s));
  };

  return { t, translateMany, isTranslating };
}