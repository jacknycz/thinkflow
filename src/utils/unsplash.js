// src/utils/unsplash.js

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

export async function fetchBackgroundImage(query) {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash API key not found. Using default background.');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const photo = data.results[0];
      return {
        url: photo.urls.regular,
        alt: photo.alt_description || query,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
    return null;
  }
} 