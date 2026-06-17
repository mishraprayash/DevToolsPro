export type Result<T> = { success: true; data: T } | { success: false; error: string };

export async function convertToNepali(text: string): Promise<Result<string>> {
  if (!text.trim()) return { success: true, data: '' };

  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=ne-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data[0] === 'SUCCESS' && Array.isArray(data[1])) {
      // data[1] is an array of translation blocks (split by punctuation usually)
      // Each block has the structure: [originalText, [translations], ...]
      const translated = data[1].map((block: any) => {
        if (Array.isArray(block[1]) && block[1].length > 0) {
          return block[1][0]; // Pick the highest confidence translation
        }
        return block[0]; // Fallback to original text
      }).join('');

      return { success: true, data: translated };
    }

    return { success: false, error: 'Unexpected response format from translation service.' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to convert to Nepali. Check your connection.' };
  }
}
