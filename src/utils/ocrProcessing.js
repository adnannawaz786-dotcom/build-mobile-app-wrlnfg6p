// OCR text extraction and processing utilities
import { format, parse, isValid, addDays } from 'date-fns';

/**
 * Mock OCR function that simulates text extraction from an image
 * In a real implementation, this would integrate with an OCR service like Tesseract.js
 */
export const extractTextFromImage = async (imageFile) => {
  try {
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock OCR results for demonstration
    const mockTexts = [
      "Milk expires 2024-12-25\nBread best by 12/20/2024\nApples fresh until Dec 22, 2024\nYogurt use by 2024-12-18",
      "Bananas 12/19/2024\nChicken breast exp 12/21/24\nCheese expires December 23 2024\nEggs best before 12/26/2024",
      "Tomatoes Dec 20 2024\nLettuce expires 12/18/24\nCarrots fresh until 12/25/2024\nOnions good until December 30, 2024"
    ];
    
    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    return randomText;
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw new Error('Failed to extract text from image');
  }
};

/**
 * Common date patterns found in grocery items
 */
const DATE_PATTERNS = [
  // MM/DD/YYYY or MM/DD/YY
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g,
  // YYYY-MM-DD
  /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g,
  // Month DD, YYYY or Month DD YYYY
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/gi,
  // DD Month YYYY
  /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/gi
];

/**
 * Common expiry keywords that indicate a date is an expiry date
 */
const EXPIRY_KEYWORDS = [
  'exp', 'expires', 'expiry', 'expiration',
  'best by', 'best before', 'use by', 'use before',
  'sell by', 'fresh until', 'good until'
];

/**
 * Common grocery item names
 */
const COMMON_ITEMS = [
  'milk', 'bread', 'eggs', 'cheese', 'butter', 'yogurt',
  'chicken', 'beef', 'pork', 'fish', 'salmon', 'turkey',
  'apples', 'bananas', 'oranges', 'grapes', 'strawberries',
  'lettuce', 'tomatoes', 'carrots', 'onions', 'potatoes',
  'rice', 'pasta', 'cereal', 'juice', 'water'
];

/**
 * Extract dates from text using various patterns
 */
const extractDates = (text) => {
  const dates = [];
  
  DATE_PATTERNS.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const matchText = match[0];
      const fullMatch = match.input.substring(
        Math.max(0, match.index - 20),
        Math.min(match.input.length, match.index + matchText.length + 20)
      );
      
      dates.push({
        text: matchText,
        context: fullMatch.trim(),
        index: match.index
      });
    }
  });
  
  return dates;
};

/**
 * Parse a date string into a Date object
 */
const parseDate = (dateText) => {
  const cleanDate = dateText.trim();
  
  // Try various date formats
  const formats = [
    'MM/dd/yyyy', 'MM/dd/yy', 'M/d/yyyy', 'M/d/yy',
    'yyyy-MM-dd', 'yyyy/MM/dd',
    'MMM dd yyyy', 'MMM dd, yyyy', 'MMMM dd yyyy', 'MMMM dd, yyyy',
    'dd MMM yyyy', 'dd MMMM yyyy'
  ];
  
  for (const formatStr of formats) {
    try {
      const parsed = parse(cleanDate, formatStr, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Try native Date parsing as fallback
  const nativeDate = new Date(cleanDate);
  if (isValid(nativeDate)) {
    return nativeDate;
  }
  
  return null;
};

/**
 * Check if a date context suggests it's an expiry date
 */
const isLikelyExpiryDate = (context) => {
  const lowerContext = context.toLowerCase();
  return EXPIRY_KEYWORDS.some(keyword => lowerContext.includes(keyword));
};

/**
 * Extract item names from text
 */
const extractItemNames = (text, dateContexts = []) => {
  const words = text.toLowerCase().split(/\s+/);
  const items = [];
  
  // Look for common grocery items
  COMMON_ITEMS.forEach(item => {
    if (words.some(word => word.includes(item))) {
      items.push({
        name: item.charAt(0).toUpperCase() + item.slice(1),
        confidence: 0.8
      });
    }
  });
  
  // Extract items from date contexts
  dateContexts.forEach(context => {
    const contextWords = context.toLowerCase().split(/\s+/);
    contextWords.forEach(word => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (cleanWord.length > 2 && COMMON_ITEMS.includes(cleanWord)) {
        const itemName = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
        if (!items.find(item => item.name === itemName)) {
          items.push({
            name: itemName,
            confidence: 0.9
          });
        }
      }
    });
  });
  
  // If no items found, extract potential item names from the beginning of lines
  if (items.length === 0) {
    const lines = text.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed) {
        const firstWord = trimmed.split(/\s+/)[0].replace(/[^a-zA-Z]/g, '');
        if (firstWord.length > 2) {
          items.push({
            name: firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase(),
            confidence: 0.5
          });
        }
      }
    });
  }
  
  return items;
};

/**
 * Process OCR text and extract grocery items with expiry dates
 */
export const processOCRText = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  try {
    const extractedDates = extractDates(text);
    const validDates = extractedDates
      .map(dateInfo => ({
        ...dateInfo,
        date: parseDate(dateInfo.text),
        isExpiry: isLikelyExpiryDate(dateInfo.context)
      }))
      .filter(dateInfo => dateInfo.date !== null);
    
    // Sort by expiry likelihood and date proximity to today
    const today = new Date();
    validDates.sort((a, b) => {
      if (a.isExpiry !== b.isExpiry) {
        return b.isExpiry - a.isExpiry; // Expiry dates first
      }
      const aDiff = Math.abs(a.date.getTime() - today.getTime());
      const bDiff = Math.abs(b.date.getTime() - today.getTime());
      return aDiff - bDiff; // Closer dates first
    });
    
    const itemNames = extractItemNames(text, validDates.map(d => d.context));
    
    // Match items with dates
    const processedItems = [];
    const usedDates = new Set();
    
    // First pass: match items with dates from same context
    itemNames.forEach((item, itemIndex) => {
      const matchingDate = validDates.find((dateInfo, dateIndex) => {
        if (usedDates.has(dateIndex)) return false;
        
        const contextLower = dateInfo.context.toLowerCase();
        const itemNameLower = item.name.toLowerCase();
        
        return contextLower.includes(itemNameLower) || 
               contextLower.includes(itemNameLower.substring(0, 4));
      });
      
      if (matchingDate) {
        const dateIndex = validDates.indexOf(matchingDate);
        usedDates.add(dateIndex);
        
        processedItems.push({
          id: Date.now() + Math.random(),
          name: item.name,
          expiryDate: format(matchingDate.date, 'yyyy-MM-dd'),
          addedDate: format(new Date(), 'yyyy-MM-dd'),
          confidence: item.confidence + (matchingDate.isExpiry ? 0.2 : 0)
        });
      }
    });
    
    // Second pass: match remaining items with remaining dates
    const remainingItems = itemNames.slice(processedItems.length);
    const remainingDates = validDates.filter((_, index) => !usedDates.has(index));
    
    remainingItems.forEach((item, index) => {
      if (remainingDates[index]) {
        processedItems.push({
          id: Date.now() + Math.random() + index,
          name: item.name,
          expiryDate: format(remainingDates[index].date, 'yyyy-MM-dd'),
          addedDate: format(new Date(), 'yyyy-MM-dd'),
          confidence: item.confidence
        });
      } else {
        // Item without date - give it a default expiry
        processedItems.push({
          id: Date.now() + Math.random() + index,
          name: item.name,
          expiryDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
          addedDate: format(new Date(), 'yyyy-MM-dd'),
          confidence: item.confidence * 0.5
        });
      }
    });
    
    // If no items were extracted, create generic items from dates
    if (processedItems.length === 0 && validDates.length > 0) {
      validDates.slice(0, 3).forEach((dateInfo, index) => {
        processedItems.push({
          id: Date.now() + Math.random() + index,
          name: `Item ${index + 1}`,
          expiryDate: format(dateInfo.date, 'yyyy-MM-dd'),
          addedDate: format(new Date(), 'yyyy-MM-dd'),
          confidence: 0.3
        });
      });
    }
    
    return processedItems.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    
  } catch (error) {
    console.error('Error processing OCR text:', error);
    return [];
  }
};

/**
 * Validate and clean extracted item data
 */
export const validateExtractedItem = (item) => {
  if (!item || typeof item !== 'object') {
    return null;
  }
  
  const cleanedItem = {
    id: item.id || Date.now() + Math.random(),
    name: '',
    expiryDate: '',
    addedDate: format(new Date(), 'yyyy-MM-dd'),
    confidence: 0
  };
  
  // Validate and clean name
  if (item.name && typeof item.name === 'string') {
    cleanedItem.name = item.name.trim().substring(0, 50);
  }
  
  // Validate and clean expiry date
  if (item.expiryDate) {
    const date = new Date(item.expiryDate);
    if (isValid(date)) {
      cleanedItem.expiryDate = format(date, 'yyyy-MM-dd');
    } else {
      cleanedItem.expiryDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    }
  }
  
  // Validate confidence
  if (typeof item.confidence === 'number' && item.confidence >= 0 && item.confidence <= 1) {
    cleanedItem.confidence = item.confidence;
  }
  
  return cleanedItem.name ? cleanedItem : null;
};

/**
 * Get confidence level description
 */
export const getConfidenceDescription = (confidence) => {
  if (confidence >= 0.8) return 'High confidence';
  if (confidence >= 0.6) return 'Medium confidence';
  if (confidence >= 0.4) return 'Low confidence';
  return 'Very low confidence';
};