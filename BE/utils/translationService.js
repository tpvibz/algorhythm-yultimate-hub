import { v2 } from '@google-cloud/translate';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Google Translate client (v2 supports API key)
const translate = new v2.Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY,
});

// In-memory cache as fallback (we can use Redis later if needed)
const translationCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Redis client (optional - will use in-memory if Redis is not available)
let redisClient = null;

try {
  // Try to import and initialize Redis if available
  const redis = await import('redis');
  if (process.env.REDIS_URL) {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
    });
    redisClient.on('error', (err) => {
      console.warn('Redis client error, using in-memory cache:', err.message);
      redisClient = null;
    });
    await redisClient.connect().catch(() => {
      console.warn('Redis connection failed, using in-memory cache');
      redisClient = null;
    });
  }
} catch (error) {
  console.warn('Redis not available, using in-memory cache');
}

/**
 * Generate cache key for a translation
 */
const getCacheKey = (text, targetLanguage) => {
  return `translation:${targetLanguage}:${Buffer.from(text).toString('base64')}`;
};

/**
 * Get translation from cache
 */
const getCachedTranslation = async (text, targetLanguage) => {
  const cacheKey = getCacheKey(text, targetLanguage);
  
  try {
    if (redisClient && redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.warn('Redis get error:', error.message);
  }
  
  // Fallback to in-memory cache
  const cached = translationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.translation;
  }
  
  return null;
};

/**
 * Store translation in cache
 */
const setCachedTranslation = async (text, targetLanguage, translation) => {
  const cacheKey = getCacheKey(text, targetLanguage);
  const cacheData = {
    translation,
    timestamp: Date.now(),
  };
  
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 86400, JSON.stringify(translation)); // 24 hours TTL
    }
  } catch (error) {
    console.warn('Redis set error:', error.message);
  }
  
  // Also store in in-memory cache
  translationCache.set(cacheKey, cacheData);
  
  // Clean up old entries from in-memory cache periodically
  if (translationCache.size > 10000) {
    const now = Date.now();
    for (const [key, value] of translationCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        translationCache.delete(key);
      }
    }
  }
};

/**
 * Translate a single text string
 */
export const translateText = async (text, targetLanguage = 'en') => {
  // Return original if target is English or text is empty
  if (!text || typeof text !== 'string' || targetLanguage === 'en' || !targetLanguage) {
    return text;
  }

  // Skip translation for very short strings (likely not translatable)
  if (text.trim().length < 2) {
    return text;
  }

  try {
    // Check cache first
    const cached = await getCachedTranslation(text, targetLanguage);
    if (cached) {
      return cached;
    }

    // Translate using Google Translate
    const [translation] = await translate.translate(text, targetLanguage);
    
    // Cache the translation
    await setCachedTranslation(text, targetLanguage, translation);
    
    return translation;
  } catch (error) {
    console.error('Translation error:', error.message);
    // Return original text if translation fails
    return text;
  }
};

/**
 * Translate an object recursively
 */
export const translateObject = async (obj, targetLanguage = 'en') => {
  if (!obj || targetLanguage === 'en' || !targetLanguage) {
    return obj;
  }

  // Handle null or undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle strings
  if (typeof obj === 'string') {
    return await translateText(obj, targetLanguage);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => translateObject(item, targetLanguage)));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const translated = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip translation for certain fields (IDs, dates, numbers, etc.)
      if (
        key.toLowerCase().includes('id') ||
        key.toLowerCase().includes('_id') ||
        key.toLowerCase().includes('email') ||
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('url') ||
        key.toLowerCase().includes('image') ||
        key.toLowerCase().includes('date') ||
        key.toLowerCase().includes('time') ||
        key.toLowerCase().includes('timestamp') ||
        key.toLowerCase().includes('createdat') ||
        key.toLowerCase().includes('updatedat') ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        translated[key] = value;
      } else {
        translated[key] = await translateObject(value, targetLanguage);
      }
    }
    return translated;
  }

  // Return primitive types as-is
  return obj;
};

export default { translateText, translateObject };

