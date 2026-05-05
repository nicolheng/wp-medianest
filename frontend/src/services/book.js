import { itemCache } from '../core/cache.js';
import { API_ROUTES, nytBooksApiKey, FALLBACK_BOOK } from './config.js';

export async function fetchBooks() {
  if (!nytBooksApiKey) throw new Error('Missing VITE_NYT_BOOKS_API_KEY');
  const res = await fetch(`${API_ROUTES.NYT_BOOKS}/lists/current/hardcover-fiction.json?api-key=${nytBooksApiKey}`);
  if (!res.ok) throw new Error('Books fetch failed');
  const data = await res.json();
  return (data.results?.books || []).slice(0, 10).map((b, i) => ({
    id: b.primary_isbn13 || b.primary_isbn10, rank: i + 1, title: b.title || 'Untitled', sub: b.author || 'Unknown author', image: b.book_image || FALLBACK_BOOK
  }));
}

export async function fetchBookById(id) {
  if (itemCache[`book_${id}`]) return itemCache[`book_${id}`];

  // 1. Try Google Books Volume ID lookup (Fastest & most likely for Search items)
  try {
    const volRes = await fetch(`${API_ROUTES.GOOGLE_BOOKS}/volume/${encodeURIComponent(id)}`);
    if (volRes.ok) {
      const volData = await volRes.json();
      const info = volData.volumeInfo || {};
      const img = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
      const image = img ? String(img).replace(/^http:/, 'https:') : FALLBACK_BOOK;

      const data = {
        id: id,
        title: info.title || 'Untitled',
        sub: (info.authors || []).join(', ') || 'Unknown Author',
        image
      };
      itemCache[`book_${id}`] = data;
      return data;
    }
  } catch (err) {
    console.warn("Volume lookup failed, trying ISBN/Search...");
  }

  // 2. If ID looks like an ISBN, try OpenLibrary
  if (/^\d+$/.test(id)) {
    try {
      const res = await fetch(`${API_ROUTES.OPEN_LIBRARY}?bibkeys=ISBN:${id}&format=json&jscmd=data`);
      if (res.ok) {
        const rawData = await res.json();
        const book = rawData[`ISBN:${id}`];
        if (book) {
          const data = {
            id: id,
            title: book.title || 'Untitled',
            sub: book.authors?.[0]?.name || 'Unknown Author',
            image: book.cover?.medium || FALLBACK_BOOK
          };
          itemCache[`book_${id}`] = data;
          return data;
        }
      }
    } catch (err) {
      console.warn("OpenLibrary failed");
    }
  }

  // 3. Fallback: Search by ISBN or ID string
  try {
    const query = /^\d+$/.test(id) ? `isbn:${id}` : id;
    const searchRes = await fetch(`${API_ROUTES.GOOGLE_BOOKS}?q=${encodeURIComponent(query)}`);
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const item = searchData.items?.[0];
      const info = item?.volumeInfo || {};
      const img = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
      const image = img ? String(img).replace(/^http:/, 'https:') : FALLBACK_BOOK;

      const data = {
        id: id,
        title: info.title || 'Untitled',
        sub: (info.authors || []).join(', ') || 'Unknown Author',
        image
      };
      itemCache[`book_${id}`] = data;
      return data;
    }
  } catch (err) {
    console.error("Final book fallback failed:", err);
  }

  const finalFallback = { id, title: 'Untitled Book', sub: 'Unknown Author', image: FALLBACK_BOOK };
  itemCache[`book_${id}`] = finalFallback;
  return finalFallback;
}