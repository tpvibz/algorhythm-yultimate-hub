import { translateObject } from '../utils/translationService.js';

/**
 * Middleware to automatically translate API responses
 * Extracts language from query params or Accept-Language header
 */
export const translationMiddleware = async (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to translate response
  res.json = async function (data) {
    try {
      // Skip translation endpoint itself to avoid double-translation
      if (req.path && req.path.startsWith('/translate')) {
        return originalJson(data);
      }
      // Opt-in only: require x-translate header or translate=true query
      const shouldTranslate =
        req.headers['x-translate'] === '1' ||
        req.query.translate === 'true' ||
        req.query.translate === '1';
      if (!shouldTranslate) {
        return originalJson(data);
      }
      // Get target language from query param or header
      let targetLanguage = req.query.lang || req.headers['accept-language'];
      
      // Extract language code (e.g., 'hi' from 'hi' or 'hi-IN')
      if (targetLanguage && targetLanguage.includes('-')) {
        targetLanguage = targetLanguage.split('-')[0];
      }
      
      // Default to English if no language specified
      if (!targetLanguage || targetLanguage === 'en') {
        return originalJson(data);
      }

      // Translate the response data
      const translatedData = await translateObject(data, targetLanguage);
      
      return originalJson(translatedData);
    } catch (error) {
      console.error('Translation middleware error:', error);
      // Return original data if translation fails
      return originalJson(data);
    }
  };

  next();
};

export default translationMiddleware;

