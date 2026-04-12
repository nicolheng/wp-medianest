import { FALLBACK_MOVIE, FALLBACK_TV, FALLBACK_BOOK, FALLBACK_MUSIC } from './api.js';

export function renderRail(containerId, items, emptyLabel, type) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.replaceChildren();
  el.classList.add('media-rail');

  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'text-body-secondary small mb-0';
    empty.textContent = emptyLabel;
    el.append(empty);
    return;
  }

  items.forEach((item) => {
    const link = document.createElement('a');
    const id = item._id || item.id || item.rank; 

    let urlType = type;
    if (type === 'movies') urlType = 'movie';
    if (type === 'tv') urlType = 'show';

    const itemImg = encodeURIComponent(item.image || '');
    link.href = `item_details.html?type=${urlType}&id=${id}&img=${itemImg}`;
    link.style.display = 'contents'; 
    link.classList.add('text-decoration-none');

    const card = document.createElement('article');
    card.className = 'media-card';
    if (type === 'music') card.classList.add('media-card--square');

    const img = document.createElement('img');
    img.className = 'media-thumb';
    img.src = item.image || FALLBACK_MUSIC;
    img.alt = item.title;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
      const fallbackByType = { movies: FALLBACK_MOVIE, tv: FALLBACK_TV, books: FALLBACK_BOOK, music: FALLBACK_MUSIC };
      img.src = fallbackByType[type] || FALLBACK_MUSIC;
    };

    const overlay = document.createElement('div');
    overlay.className = 'media-card-overlay d-flex flex-column justify-content-between p-2';

    const actionContainer = document.createElement('div');
    actionContainer.className = 'd-flex gap-2 justify-content-end w-100 z-3';
    actionContainer.style.position = 'relative'; 

    let watchlist = JSON.parse(localStorage.getItem('watchlist'));
    if (!watchlist || Array.isArray(watchlist)) watchlist = { movies: [], tv: [], books: [], music: [] };

    let history = JSON.parse(localStorage.getItem('history'));
    if (!history || Array.isArray(history)) history = { movies: [], tv: [], books: [], music: [] };
    
    const currentWatchlist = watchlist[type] || [];
    const currentHistory = history[type] || [];
    const idStr = String(id); 

    const circleStyle = "width: 38px; height: 38px; padding: 0; display: flex; align-items: center; justify-content: center;";

    if (currentHistory.includes(idStr)) {
        const badge = document.createElement('span');
        badge.className = 'badge bg-dark bg-opacity-75 text-light rounded-pill border border-secondary align-self-start px-3 py-2';
        let label = 'Watched';
        if (type === 'books') label = 'Read';
        if (type === 'music') label = 'Listened';
        badge.innerHTML = `<i class="bi bi-check2-all me-1"></i> ${label}`;
        actionContainer.append(badge);

    } else if (currentWatchlist.includes(idStr)) {
        const watchBtn = document.createElement('button');
        watchBtn.className = 'btn btn-success rounded-circle shadow';
        watchBtn.style = circleStyle;
        watchBtn.innerHTML = '<i class="bi bi-check-lg fs-5"></i>';
        watchBtn.title = "Mark as Done";
        watchBtn.onclick = (e) => { e.preventDefault(); window.moveToHistory(idStr, type); };

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger rounded-circle shadow';
        removeBtn.style = circleStyle;
        removeBtn.innerHTML = '<i class="bi bi-trash fs-5"></i>';
        removeBtn.title = "Remove";
        removeBtn.onclick = (e) => { e.preventDefault(); window.removeFromWatchlist(idStr, type); };

        actionContainer.append(watchBtn, removeBtn);

    } else {
        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-primary rounded-circle shadow';
        addBtn.style = circleStyle;
        addBtn.innerHTML = '<i class="bi bi-plus-lg fs-5"></i>';
        addBtn.title = "Add to Watchlist";
        addBtn.onclick = (e) => { e.preventDefault(); window.addToWatchlist(idStr, type); };

        actionContainer.append(addBtn);
    }

    const textContainer = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'media-title';
    title.textContent = item.title;

    const sub = document.createElement('div');
    sub.className = 'media-sub';
    sub.textContent = item.sub;

    textContainer.append(title, sub);

    const badgeText = (item.rank !== undefined && item.rank !== null) ? `#${item.rank}` : '';
    if (badgeText) {
      const badge = document.createElement('span');
      badge.className = 'badge text-bg-primary position-absolute top-0 start-0 m-2';
      badge.textContent = badgeText;
      card.append(badge);
    }

    overlay.append(actionContainer, textContainer);
    card.append(img, overlay);
    link.append(card);
    el.append(link);
  });
}

function updateSnapshotItem(prefix, item, fallbackImage) {
  const titleEl = document.getElementById(`${prefix}-title`);
  const imageEl = document.getElementById(`${prefix}-image`);
  if (titleEl) titleEl.textContent = item?.title || 'Not available';
  if (imageEl) imageEl.src = item?.image || fallbackImage;
}

export function updateLiveSnapshot(movies, tvShows, books, music) {
  updateSnapshotItem('snapshot-movie', movies[0], FALLBACK_MOVIE);
  updateSnapshotItem('snapshot-tv', tvShows[0], FALLBACK_TV);
  updateSnapshotItem('snapshot-book', books[0], FALLBACK_BOOK);
  updateSnapshotItem('snapshot-music', music[0], FALLBACK_MUSIC);
}