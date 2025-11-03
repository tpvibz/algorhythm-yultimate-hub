import express from 'express';
import { translateText } from '../utils/translationService.js';

const router = express.Router();

// POST /api/translate - translate one or many texts
router.post('/', async (req, res) => {
  try {
    const { texts, text, lang } = req.body || {};
    const targetLanguage = (lang || req.query.lang || req.headers['accept-language'] || 'en').split('-')[0];

    if (Array.isArray(texts)) {
      const results = await Promise.all(texts.map(t => translateText(t, targetLanguage)));
      return res.json({ success: true, data: { translations: results } });
    }

    const input = typeof text === 'string' ? text : '';
    const translated = await translateText(input, targetLanguage);
    return res.json({ success: true, data: { translation: translated } });
  } catch (err) {
    console.error('Translate route error:', err);
    return res.status(500).json({ success: false, message: 'Translation failed' });
  }
});

export default router;


