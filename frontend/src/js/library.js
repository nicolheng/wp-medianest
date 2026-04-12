import { fetchMovieById, fetchTVShowById, fetchBookById, fetchTrackById } from './api.js';
import { renderRail } from './ui.js';

export const getLibrary = (key) => {
  let data = JSON.parse(localStorage.getItem(key));
  
  // If data doesn't exist, OR if it's the old array format, reset it!
  if (!data || Array.isArray(data) || !data.movies) {
      data = { movies: [], tv: [], books: [], music: [] };
      localStorage.setItem(key, JSON.stringify(data));
  }
  return data;
};

window.addToWatchlist = (id, type) => {
  const list = getLibrary('watchlist');
  const idStr = String(id);
  if (!list[type].includes(idStr)) {
      list[type].push(idStr);
      localStorage.setItem('watchlist', JSON.stringify(list));
      if (document.getElementById("libraryTabContent")) loadWatchlistAndHistory();
      if (window.loadCharts && document.getElementById("top-charts")) window.loadCharts();
  }
};

window.removeFromWatchlist = (id, type) => {
  const list = getLibrary('watchlist');
  const idStr = String(id);
  list[type] = list[type].filter(itemId => itemId !== idStr);
  localStorage.setItem('watchlist', JSON.stringify(list));
  if (document.getElementById("libraryTabContent")) loadWatchlistAndHistory();
  if (window.loadCharts && document.getElementById("top-charts")) window.loadCharts();
};

window.moveToHistory = (id, type) => {
  window.removeFromWatchlist(id, type); 
  const history = getLibrary('history');
  const idStr = String(id);
  if (!history[type].includes(idStr)) {
      history[type].push(idStr);
      localStorage.setItem('history', JSON.stringify(history));
  }
  if (document.getElementById("libraryTabContent")) loadWatchlistAndHistory();
  if (window.loadCharts && document.getElementById("top-charts")) window.loadCharts();
};

export async function loadWatchlistAndHistory() {
  const watchlist = getLibrary('watchlist');
  const history = getLibrary('history');
   
  try {
    const movieData = await Promise.all(watchlist.movies.map(fetchMovieById));
    const tvData = await Promise.all(watchlist.tv.map(fetchTVShowById));
    const bookData = await Promise.all(watchlist.books.map(fetchBookById));
    const trackData = await Promise.all(watchlist.music.map(fetchTrackById));
    
    const historyMovieData = await Promise.all(history.movies.map(fetchMovieById));
    const historyTvData = await Promise.all(history.tv.map(fetchTVShowById));
    const historyBookData = await Promise.all(history.books.map(fetchBookById));
    const historyTrackData = await Promise.all(history.music.map(fetchTrackById));

    renderRail('watchlist-movies-list', movieData, 'Your movie watchlist is empty.', 'movies');
    renderRail('watchlist-tv-list', tvData, 'Your TV show watchlist is empty.', 'tv');
    renderRail('watchlist-books-list', bookData, 'Your book watchlist is empty.', 'books');
    renderRail('watchlist-music-list', trackData, 'Your music watchlist is empty.', 'music');

    renderRail('history-movies-list', historyMovieData, 'You have no watched movies.', 'movies');
    renderRail('history-tv-list', historyTvData, 'You have no watched TV shows.', 'tv');
    renderRail('history-books-list', historyBookData, 'You have no read books.', 'books');
    renderRail('history-music-list', historyTrackData, 'You have no listened tracks.', 'music');

  } catch (error) {
    console.error("Error loading library:", error);
  }
}