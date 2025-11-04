import React, { useEffect, useRef } from 'react';
import api from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';

// Heuristics to skip non-translatable strings
const shouldSkip = (s: string): boolean => {
  if (!s) return true;
  const text = s.trim();
  if (text.length < 2) return true;
  if (/^\s*$/.test(text)) return true;
  if (/^[0-9.,:;\-_/\\()\[\]{}]+$/.test(text)) return true;
  if (/\S+@\S+\.\S+/.test(text)) return true; // emails
  if (/https?:\/\//i.test(text)) return true; // urls
  if (/^[A-Z0-9_-]{6,}$/i.test(text)) return true; // codes/tokens
  return false;
};

// Collect all visible text nodes
const collectTextNodes = (root: Node): Text[] => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.parentElement) return NodeFilter.FILTER_REJECT;
      const el = node.parentElement as HTMLElement;
      // Skip script/style/meta/noscript and elements with data-no-translate
      if (
        ['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'TITLE', 'LINK'].includes(el.tagName) ||
        el.closest('[data-no-translate]')
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      // Skip inputs/textareas
      if (['INPUT', 'TEXTAREA'].includes(el.tagName)) return NodeFilter.FILTER_REJECT;
      // Must be visible
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return NodeFilter.FILTER_REJECT;
      const content = node.nodeValue || '';
      return shouldSkip(content) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  } as any);

  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
};

const AutoTranslate: React.FC = () => {
  const { language } = useLanguage();
  const originalText = useRef<Map<Text, string>>(new Map());
  const cache = useRef<Map<string, string>>(new Map());
  const observerRef = useRef<MutationObserver | null>(null);
  const isApplyingRef = useRef(false);
  const scheduledRef = useRef<number | null>(null);

  const applyTranslations = async (nodes: Text[]) => {
    if (language === 'en') return;
    if (!nodes.length) return;
    isApplyingRef.current = true;
    // Limit work per batch to avoid blocking UI
    const limited = nodes.slice(0, 1000);
    const inputs: string[] = [];
    const toTranslate: Text[] = [];
    for (const n of limited) {
      const val = n.nodeValue || '';
      if (!shouldSkip(val)) {
        if (!originalText.current.has(n)) originalText.current.set(n, val);
        const cached = cache.current.get(val);
        if (cached) {
          if (n.nodeValue !== cached) n.nodeValue = cached;
        } else {
          inputs.push(val);
          toTranslate.push(n);
        }
      }
    }

    if (inputs.length === 0) {
      isApplyingRef.current = false;
      return;
    }

    // Batch in chunks to avoid huge payloads
    const chunkSize = 100;
    for (let i = 0; i < inputs.length; i += chunkSize) {
      const chunk = inputs.slice(i, i + chunkSize);
      try {
        const { data } = await api.post('/translate', { texts: chunk, lang: language });
        const outs: string[] = data?.data?.translations || [];
        outs.forEach((out, idx) => {
          const src = chunk[idx];
          cache.current.set(src, out || src);
        });
      } catch {
        // On failure, keep originals in cache as identity mapping to avoid loops
        chunk.forEach((src) => cache.current.set(src, src));
      }
    }

    // Apply from cache
    for (const n of toTranslate) {
      const val = n.nodeValue || '';
      const orig = originalText.current.get(n) || val;
      const translated = cache.current.get(orig) || orig;
      if (n.nodeValue !== translated) n.nodeValue = translated;
    }
    isApplyingRef.current = false;
  };

  const restoreOriginals = () => {
    for (const [node, orig] of originalText.current.entries()) {
      if (node && node.nodeValue !== orig) node.nodeValue = orig;
    }
  };

  useEffect(() => {
    // Tear down prior observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (language === 'en') {
      restoreOriginals();
      return;
    }

    // Initial pass in idle time
    const kickoff = () => {
      const nodes = collectTextNodes(document.body);
      applyTranslations(nodes);
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(kickoff);
    } else {
      setTimeout(kickoff, 0);
    }

    // Observe future DOM changes
    const observer = new MutationObserver((mutations) => {
      if (isApplyingRef.current) return; // ignore our own updates
      const changed: Text[] = [];
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              changed.push(node as Text);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              changed.push(...collectTextNodes(node));
            }
          });
        } else if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
          changed.push(m.target as Text);
        }
      }
      if (!changed.length) return;
      // debounce to next frame
      if (scheduledRef.current) cancelAnimationFrame(scheduledRef.current);
      scheduledRef.current = requestAnimationFrame(() => applyTranslations(changed));
    });

    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  return null;
};

export default AutoTranslate;


