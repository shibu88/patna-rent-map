// Pin detail panel. Shown when a marker is clicked.
// (Rating/report controls are added in Step 5.)
import { formatRent, bhkLabel, isAvailable } from './pins.js';

const $ = (sel) => document.querySelector(sel);

const LISTING_LABELS = { whole_flat: 'Whole flat', room: 'Room', flatmate: 'Flatmate' };
const FURNISHED_LABELS = { unfurnished: 'Unfurnished', semi: 'Semi-furnished', full: 'Fully furnished' };
const REPORT_LABELS = {
  wrong_rent: 'Wrong rent',
  not_available: 'Not available',
  fake: 'Fake',
  other: 'Other',
};

export function setupDetail() {
  const overlay = $('#detail-overlay');
  $('#detail-close').addEventListener('click', hideDetail);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideDetail();
  });
}

export function hideDetail() {
  $('#detail-overlay').hidden = true;
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function row(label, value) {
  if (value === null || value === undefined || value === '' || value === '—') return '';
  return `<div class="d-row"><span class="d-label">${label}</span><span class="d-value">${esc(value)}</span></div>`;
}

function availableText(pin) {
  if (pin.availableFrom === 'asap') return 'Available now';
  if (!pin.availableFrom) return 'Occupied / not available';
  return `From ${esc(pin.availableFrom)}`;
}

export function showDetail(pin, opts = {}) {
  const { aboveAvg = false, userInteraction = { rating: null, reported: null }, onRate, onReport } = opts;

  $('#detail-title').textContent = `${bhkLabel(pin.bhk)} · ₹${formatRent(pin.rentAmount)}`;

  const avail = isAvailable(pin);
  const images = Array.isArray(pin.imageUrls) ? pin.imageUrls : [];

  let html = '';

  if (images.length) {
    html += `<div class="d-images">${images
      .map((u) => `<img src="${esc(u)}" alt="flat photo" loading="lazy" />`)
      .join('')}</div>`;
  }

  html += `<div class="d-badges">
    <span class="d-badge ${avail ? 'ok' : 'muted'}">${avail ? 'Available' : 'Occupied'}</span>
    ${pin.ratingCount ? `<span class="d-badge">★ ${pin.avgRating.toFixed(1)} (${pin.ratingCount})</span>` : ''}
    ${aboveAvg ? '<span class="d-badge warn">Above avg</span>' : ''}
    ${pin.reportCount ? `<span class="d-badge warn">${pin.reportCount} report${pin.reportCount > 1 ? 's' : ''}</span>` : ''}
  </div>`;

  html += '<div class="d-rows">';
  html += row('Locality', pin.locality);
  html += row('Society', pin.society);
  html += row('Listing', LISTING_LABELS[pin.listingType]);
  if (pin.listingType === 'room' || pin.listingType === 'flatmate') {
    html += row('Rooms available', pin.roomsAvailable);
    html += row('Rent per room', pin.rentPerRoom ? `₹${formatRent(pin.rentPerRoom)}` : null);
  }
  html += row('Deposit', pin.depositMonths ? `${pin.depositMonths} month(s)` : null);
  html += row('Area', pin.sqft ? `${pin.sqft} sqft` : null);
  html += row('Availability', availableText(pin));
  html += row('Furnished', FURNISHED_LABELS[pin.furnished]);
  html += row('Gated', pin.gated === true ? 'Yes' : pin.gated === false ? 'No' : null);
  html += row('Pet friendly', pin.petFriendly === true ? 'Yes' : pin.petFriendly === false ? 'No' : null);
  html += row('Maintenance incl.', pin.maintenanceIncluded === true ? 'Yes' : pin.maintenanceIncluded === false ? 'No' : null);
  html += row('Occupants', pin.occupantType);
  html += row('Food pref', pin.prefFood);
  html += row('Gender pref', pin.prefGender);
  html += '</div>';

  if (pin.feedback) html += `<p class="d-feedback">${esc(pin.feedback)}</p>`;

  // --- Rate ---
  const myRating = userInteraction.rating;
  html += '<div class="d-action"><span class="d-action-label">Your rating</span><div class="stars" id="d-stars">';
  for (let n = 1; n <= 5; n++) {
    html += `<button type="button" class="star ${myRating && n <= myRating ? 'on' : ''}" data-rate="${n}" aria-label="${n} star">★</button>`;
  }
  html += '</div></div>';

  // --- Report ---
  html += '<div class="d-action"><span class="d-action-label">Report</span>';
  if (userInteraction.reported) {
    html += `<span class="d-reported">Reported: ${REPORT_LABELS[userInteraction.reported] || userInteraction.reported}</span>`;
  } else {
    html += '<div class="report-btns" id="d-report">';
    for (const [key, label] of Object.entries(REPORT_LABELS)) {
      html += `<button type="button" data-reason="${key}">${label}</button>`;
    }
    html += '</div>';
  }
  html += '</div>';

  const body = $('#detail-body');
  body.innerHTML = html;

  // Wire rating.
  const stars = document.getElementById('d-stars');
  if (stars && onRate) {
    stars.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-rate]');
      if (btn) onRate(Number(btn.dataset.rate));
    });
  }

  // Wire report.
  const report = document.getElementById('d-report');
  if (report && onReport) {
    report.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-reason]');
      if (btn) onReport(btn.dataset.reason);
    });
  }

  $('#detail-overlay').hidden = false;
}
