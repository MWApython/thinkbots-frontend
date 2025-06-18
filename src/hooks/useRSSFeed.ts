import { useState, useEffect, useCallback } from 'react';

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

export const useRSSFeed = (url: string) => {
  const [items, setItems] = useState<RSSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use a more reliable CORS proxy
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const response = await fetch(corsProxy + encodeURIComponent(url), {
        headers: {
          'Accept': 'application/xml, application/rss+xml, text/xml, application/atom+xml',
          'Content-Type': 'application/xml',
          'Origin': window.location.origin
        },
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log('Feed response:', text.substring(0, 200)); // Log first 200 chars for debugging
      
      // Basic validation of the response
      if (!text.includes('<rss') && !text.includes('<feed') && !text.includes('<atom')) {
        console.error('Invalid feed format. Response:', text);
        throw new Error('Invalid feed format');
      }

      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      
      // Check for parsing errors
      const parserError = xml.querySelector('parsererror');
      if (parserError) {
        console.error('Parser error:', parserError.textContent);
        throw new Error('Failed to parse feed');
      }

      // Try different selectors for feed items
      const items = Array.from(xml.querySelectorAll('item, entry')).map(item => {
        // Get the title and clean it up
        const title = item.querySelector('title')?.textContent?.trim() || 'No title';
        
        // Get the description and clean it up
        const description = item.querySelector('description, summary, content')?.textContent?.trim() || 'No description';
        
        // Get the link, trying different methods
        const link = item.querySelector('link')?.textContent?.trim() || 
                    item.querySelector('link')?.getAttribute('href') || 
                    item.querySelector('guid')?.textContent?.trim() || '#';
        
        // Get the publication date, trying different formats
        const pubDate = item.querySelector('pubDate, published, updated')?.textContent?.trim() || 
                       new Date().toISOString();

        // Clean up the description by removing HTML tags and extra whitespace
        const cleanDescription = description
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        return {
          title,
          description: cleanDescription,
          link,
          pubDate
        };
      });

      if (items.length === 0) {
        throw new Error('No items found in the feed');
      }

      // Sort items by date, newest first
      items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      setItems(items);
      setError(null);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feed');
      // Set empty items array on error
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 15 * 60 * 1000); // Refresh every 15 minutes
    return () => clearInterval(interval);
  }, [fetchFeed]);

  return { items, loading, error, refetch: fetchFeed };
}; 