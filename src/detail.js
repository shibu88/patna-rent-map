// Pin detail panel. Shown when a marker is clicked. Renders only real stored
// pin data (plus community ratings and comments). Layout follows the design
// screenshots: rent header, info chips, a meta row, a context card, the
// community rating, and a comments thread.
import { formatRent, bhkLabel } from './pins.js';

const $ = (sel) => document.querySelector(sel);

const FURNISHED_LABELS = { unfurnished: 'Unfurnished', semi: 'Semi-furnished', full: 'Furnished' };
const OCCUPANT_LABELS = { family: 'Family', bachelors: 'Bachelors' }; // 'any' → hidden chip
const OCCUPANT_EMOJI = { family: '👪', bachelors: '🧑' };
const REPORT_LABELS = {
  wrong_rent: 'Wrong rent',
  not_available: 'Not available',
  fake: 'Fake',
  other: 'Other',
};

export function setupDetail() {
  const overlay = $('#detail-overlay');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideDetail();
  });
}

export function hideDetail() {
  $('#detail-overlay').hidden = true;
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// "just now" / "5m ago" / "3h ago" / "12d ago" from a Firestore Timestamp.
function timeAgo(ts) {
  const ms = ts && ts.toMillis ? ts.toMillis() : ts instanceof Date ? ts.getTime() : null;
  if (!ms) return '';
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function chip(text, cls = '') {
  return `<span class="d-chip ${cls}"><span class="d-dot"></span>${esc(text)}</span>`;
}

function chipsHtml(pin) {
  const out = [];
  if (pin.bhk) out.push(chip(bhkLabel(pin.bhk), 'c-bhk'));
  if (FURNISHED_LABELS[pin.furnished]) out.push(chip(FURNISHED_LABELS[pin.furnished], 'c-furnish'));
  if (pin.maintenanceIncluded === true) out.push(chip('Maintenance Incl.', 'c-maint'));
  else if (pin.maintenanceIncluded === false) out.push(chip('Maintenance Extra', 'c-maint'));
  if (pin.gated === true) out.push(chip('Gated Society', 'c-gated'));
  else if (pin.gated === false) out.push(chip('Not Gated', 'c-gated'));
  if (OCCUPANT_LABELS[pin.occupantType])
    out.push(
      `<span class="d-chip c-occ">${OCCUPANT_EMOJI[pin.occupantType]} ${esc(OCCUPANT_LABELS[pin.occupantType])}</span>`
    );
  if (pin.depositMonths) out.push(chip(`${pin.depositMonths} mo deposit`, 'c-deposit'));
  return out.join('');
}

function metaHtml(pin) {
  const out = [];
  if (pin.society) out.push(`<span class="d-meta-item">🏠 Society: ${esc(pin.society)}</span>`);
  if (pin.sqft) out.push(`<span class="d-meta-item">⤢ ${esc(pin.sqft)} sq.ft</span>`);
  const ago = timeAgo(pin.createdAt);
  if (ago) out.push(`<span class="d-meta-item">🕐 Pinned ${esc(ago)}</span>`);
  return out.length ? `<div class="d-meta">${out.join('')}</div>` : '';
}

function availabilityText(pin) {
  if (pin.availableFrom === 'asap') return 'Available now';
  if (pin.availableFrom === 'next_month') return 'From next month';
  if (pin.availableFrom === 'flexible') return 'Flexible move-in';
  if (!pin.availableFrom) return 'Occupied / not available';
  return `From ${esc(pin.availableFrom)}`;
}

function contextCardHtml(pin) {
  if (pin.pinKind === 'tolet') {
    return `<div class="d-card">
      <div class="d-card-title">📍 ${esc(availabilityText(pin))}</div>
      <p class="d-card-text">Spotted on a To-Let board — contact details may be on the board at the location.</p>
    </div>`;
  }
  // pinKind 'rent' = a flat someone added via "Add Your Flat". Drive the card
  // off availability: a set availableFrom means it's listed as available;
  // null means the lister marked it occupied / not available.
  if (!pin.availableFrom) {
    return `<div class="d-card">
      <div class="d-card-title">📍 Not currently available</div>
      <p class="d-card-text">The lister marked this flat as occupied / not available right now.</p>
      <button type="button" class="d-link" id="d-see-available">See flats currently available →</button>
    </div>`;
  }
  return `<div class="d-card">
    <div class="d-card-title">📍 ${esc(availabilityText(pin))}</div>
    <p class="d-card-text">This flat is listed as available to rent.</p>
  </div>`;
}

function commentsHtml(comments) {
  const items = comments
    .map(
      (c) => `<div class="d-comment">
        <div class="d-comment-text">${esc(c.text)}</div>
        <div class="d-comment-time">${esc(timeAgo(c.createdAt)) || 'just now'}</div>
      </div>`
    )
    .join('');
  return `<div class="d-section d-comments">
    <div class="d-section-head">COMMENTS</div>
    <div id="d-comment-list">${items}</div>
    <div class="d-comment-form">
      <input id="d-comment-input" type="text" maxlength="500" placeholder="Add a comment..." />
      <button type="button" id="d-comment-post">Post</button>
    </div>
  </div>`;
}

export function showDetail(pin, opts = {}) {
  const {
    userInteraction = { rating: null, reported: null },
    comments = [],
    onRate,
    onReport,
    onComment,
    onSeeAvailable,
  } = opts;

  const myRating = userInteraction.rating;
  const reported = userInteraction.reported;

  let html = '';

  // Header: MONTHLY RENT + amount, with share / report / close.
  html += `<div class="d-head">
    <div>
      <div class="d-head-label">MONTHLY RENT</div>
      <div class="d-rent">₹${esc(formatRent(pin.rentAmount))}</div>
    </div>
    <div class="d-head-btns">
      <button type="button" class="d-iconbtn" id="d-share" aria-label="Share" title="Share">🔗</button>
      <button type="button" class="d-iconbtn ${reported ? 'on' : ''}" id="d-report-btn" aria-label="Report" title="Report">🚩</button>
      <button type="button" class="d-iconbtn" id="d-close" aria-label="Close" title="Close">×</button>
    </div>
  </div>`;

  // Chips.
  const chips = chipsHtml(pin);
  if (chips) html += `<div class="d-chips">${chips}</div>`;

  // Meta row + directions.
  html += metaHtml(pin);
  html += `<button type="button" class="d-link d-directions" id="d-directions">🧭 Get directions</button>`;

  // Report reasons (revealed by the flag icon).
  html += `<div class="d-report" id="d-report-panel" hidden>`;
  if (reported) {
    html += `<span class="d-reported">Reported: ${esc(REPORT_LABELS[reported] || reported)}</span>`;
  } else {
    html += `<span class="d-report-label">Report this pin:</span><div class="d-report-btns">`;
    for (const [key, label] of Object.entries(REPORT_LABELS)) {
      html += `<button type="button" data-reason="${key}">${label}</button>`;
    }
    html += `</div>`;
  }
  html += `</div>`;

  // Context card.
  html += contextCardHtml(pin);

  // Community rating.
  html += `<div class="d-section">
    <div class="d-section-head">COMMUNITY RATING</div>
    <button type="button" class="d-rating-row" id="d-rating-toggle">
      <span>${pin.ratingCount ? `★ ${pin.avgRating.toFixed(1)} (${pin.ratingCount})` : 'No ratings yet — tap to rate'}</span>
      <span class="d-chev">›</span>
    </button>
    <div class="d-stars" id="d-stars" hidden>`;
  for (let n = 1; n <= 5; n++) {
    html += `<button type="button" class="d-star ${myRating && n <= myRating ? 'on' : ''}" data-rate="${n}" aria-label="${n} star">★</button>`;
  }
  html += `</div></div>`;

  // Comments.
  html += commentsHtml(comments);

  const body = $('#detail-body');
  body.innerHTML = html;
  body.scrollTop = 0;

  // --- Wiring ---
  $('#d-close').addEventListener('click', hideDetail);

  $('#d-share').addEventListener('click', () => sharePin(pin));

  $('#d-directions').addEventListener('click', () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`,
      '_blank',
      'noopener'
    );
  });

  // Flag icon toggles the report panel.
  $('#d-report-btn').addEventListener('click', () => {
    const panel = $('#d-report-panel');
    panel.hidden = !panel.hidden;
  });
  const reportPanel = $('#d-report-panel');
  if (reportPanel && onReport) {
    reportPanel.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-reason]');
      if (btn) onReport(btn.dataset.reason);
    });
  }

  // Rating: the row reveals the stars.
  $('#d-rating-toggle').addEventListener('click', () => {
    const stars = $('#d-stars');
    stars.hidden = !stars.hidden;
  });
  const stars = $('#d-stars');
  if (stars && onRate) {
    stars.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-rate]');
      if (btn) onRate(Number(btn.dataset.rate));
    });
  }

  // "See flats currently available" (rent pins only).
  const seeBtn = $('#d-see-available');
  if (seeBtn && onSeeAvailable) seeBtn.addEventListener('click', onSeeAvailable);

  // Comments.
  const postBtn = $('#d-comment-post');
  const input = $('#d-comment-input');
  if (postBtn && input && onComment) {
    const submit = () => {
      const text = input.value.trim();
      if (!text) return;
      postBtn.disabled = true;
      onComment(text);
    };
    postBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
  }

  $('#detail-overlay').hidden = false;
}

async function sharePin(pin) {
  const url = `${location.origin}${location.pathname}?lat=${pin.lat}&lng=${pin.lng}`;
  const text = `${bhkLabel(pin.bhk)} · ₹${formatRent(pin.rentAmount)} in Patna`;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Patna Rent Map', text, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard.');
    }
  } catch (err) {
    // User cancelled the share sheet, or clipboard blocked — no action needed.
    console.debug('Share cancelled or unavailable:', err);
  }
}
