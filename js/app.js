// Google Sheets Configuration
// Shows Sheet:
// Columns: title, date (DD/MM/YYYY), venue, time, ticketLink
const GOOGLE_SHEET_ID = '2PACX-1vTMlSM8Zk6bXrftMZ-Pj0o-Ddod1ANoWDMol2vLQRapze1aU_T0-eSWN5mfprsWKDL5aYCS1AdSnHxR';

// Reviews Sheet:
// Columns: review, size (xl/l/m/s/xs — optional, defaults to 'm'), style (text-dark/text-light — optional, defaults to 'text-dark')
// Instructions: Publish your reviews Google Sheet tab to web as CSV/TSV and paste the ID portion below.
const REVIEWS_SHEET_ID = '2PACX-1vR_ORGP_ysVDqfLrn3inGl0DtrBCbMfqZDUtUJaoC3dMSg7psNu9DMJoJpKCKNUppTRjJige_2zfvLj';

document.addEventListener('DOMContentLoaded', () => {
    // 1. UI Setup
    setupIntersectionObservers();
    setupKaleidoText();
    // document.getElementById('year').textContent = new Date().getFullYear();

    // 2. Fetch Data asynchronously without blocking the main thread
    // Using setTimeout defers execution until the call stack is clear,
    // allowing the browser to paint the initial UI first.
    setTimeout(() => {
        // Fetch Shows
        fetchShows();

        // Fetch Reviews
        fetchReviews();
    }, 0);
});

// Venue lookup for enriched Schema.org Structured Data
const VENUE_DETAILS = [
    {
        pattern: /improvworks/i,
        name: 'ImprovWorks Berlin',
        streetAddress: 'Rudolfstraße 14',
        postalCode: '10245',
        addressLocality: 'Berlin',
        addressCountry: 'DE'
    },
    {
        pattern: /comedy caf[eé]/i,
        name: 'Comedy Café Berlin',
        streetAddress: 'Roseggerstraße 17',
        postalCode: '12059',
        addressLocality: 'Berlin',
        addressCountry: 'DE'
    },
    {
        pattern: /monbijou/i,
        name: 'Monbijou Märchenhütten',
        streetAddress: 'Monbijouplatz',
        postalCode: '10178',
        addressLocality: 'Berlin',
        addressCountry: 'DE'
    },
    {
        pattern: /english theatre/i,
        name: 'English Theatre Berlin',
        streetAddress: 'Fidicinstraße 40',
        postalCode: '10965',
        addressLocality: 'Berlin',
        addressCountry: 'DE'
    },
    {
        pattern: /brotfabrik/i,
        name: 'Brotfabrik Berlin',
        streetAddress: 'Caligariplatz 1',
        postalCode: '13086',
        addressLocality: 'Berlin',
        addressCountry: 'DE'
    },
    {
        pattern: /bühnenrausch/i,
        name: 'Theater BühnenRausch',
        streetAddress: 'Erich-Weinert-Straße 27',
        postalCode: '10439',
        addressLocality: 'Berlin',
        addressCountry: 'DE'
    },
    {
        pattern: /alte feuerwache/i,
        name: 'Alte Feuerwache',
        streetAddress: 'Marchlewskistraße 6',
        postalCode: '10243',
        addressLocality: 'Berlin',
        addressCountry: 'DE'
    }
];

function getVenueLocation(venueString) {
    const trimmed = (venueString || '').trim();
    for (const v of VENUE_DETAILS) {
        if (v.pattern.test(trimmed)) {
            return {
                '@type': 'Place',
                'name': v.name,
                'address': {
                    '@type': 'PostalAddress',
                    'streetAddress': v.streetAddress,
                    'addressLocality': v.addressLocality,
                    'postalCode': v.postalCode,
                    'addressCountry': v.addressCountry
                }
            };
        }
    }

    return {
        '@type': 'Place',
        'name': trimmed || 'Berlin',
        'address': {
            '@type': 'PostalAddress',
            'addressLocality': 'Berlin',
            'addressCountry': 'DE'
        }
    };
}

// Parse date and time into a Date object
function parseShowDateTime(dateVal, timeVal) {
    if (!dateVal) return null;
    let day, month, year;

    const dateParts = dateVal.includes('/') ? dateVal.split('/') : (dateVal.includes('.') ? dateVal.split('.') : null);
    if (dateParts && dateParts.length === 3) {
        day = parseInt(dateParts[0], 10);
        month = parseInt(dateParts[1], 10) - 1; // 0-indexed
        year = parseInt(dateParts[2], 10);
        if (year < 100) year += 2000;
    } else if (dateVal.includes('-')) {
        const isoParts = dateVal.split('-');
        if (isoParts.length === 3) {
            year = parseInt(isoParts[0], 10);
            month = parseInt(isoParts[1], 10) - 1;
            day = parseInt(isoParts[2], 10);
        }
    }

    if (day === undefined || isNaN(day) || isNaN(month) || isNaN(year)) {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return null;
        day = d.getDate();
        month = d.getMonth();
        year = d.getFullYear();
    }

    let hours = 20;
    let minutes = 0;

    if (timeVal && typeof timeVal === 'string' && timeVal.trim()) {
        const cleanTime = timeVal.trim().toLowerCase();
        const isPM = cleanTime.includes('pm');
        const isAM = cleanTime.includes('am');
        const match = cleanTime.match(/(\d{1,2})[:.]?(\d{2})?/);
        if (match) {
            let h = parseInt(match[1], 10);
            const m = match[2] ? parseInt(match[2], 10) : 0;
            if (isPM && h < 12) h += 12;
            if (isAM && h === 12) h = 0;
            if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                hours = h;
                minutes = m;
            }
        }
    }

    return new Date(year, month, day, hours, minutes, 0);
}

// Format ISO 8601 with local Berlin timezone offset (+01:00 or +02:00)
function formatISOWithTimezone(date) {
    const pad = (num) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    // Calculate Berlin timezone offset
    const getBerlinOffset = (d) => {
        try {
            const utcDate = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
            const tzDate = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
            const diffMinutes = Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
            const sign = diffMinutes >= 0 ? '+' : '-';
            const absDiff = Math.abs(diffMinutes);
            const offsetHours = pad(Math.floor(absDiff / 60));
            const offsetMins = pad(absDiff % 60);
            return `${sign}${offsetHours}:${offsetMins}`;
        } catch (e) {
            return '+01:00';
        }
    };

    const offset = getBerlinOffset(date);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
}

// Dynamic Schema.org JSON-LD injection for upcoming shows
function updateStructuredData(shows) {
    if (!shows || !Array.isArray(shows) || shows.length === 0) return;

    const eventSchemas = shows.map((show, idx) => {
        const startISO = formatISOWithTimezone(show.date);
        const endDate = new Date(show.date.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
        const endISO = formatISOWithTimezone(endDate);
        const location = getVenueLocation(show.venue);

        const eventName = show.title
            ? (show.title.toLowerCase().includes('kaleidoscope') ? show.title : `Kaleidoscope: ${show.title}`)
            : 'Kaleidoscope: An Improvised Musical';

        const schema = {
            '@type': 'TheaterEvent',
            '@id': `https://kaleidoscope-improv.com/#event-${show.date.toISOString().split('T')[0]}-${idx}`,
            'name': eventName,
            'description': 'Experience Kaleidoscope, Berlin\'s premier unscripted musical improv comedy show. A full two-act improvised musical created live on stage.',
            'startDate': startISO,
            'endDate': endISO,
            'eventStatus': 'https://schema.org/EventScheduled',
            'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
            'location': location,
            'image': [
                'https://kaleidoscope-improv.com/assets/kaleido_logo_full.webp',
                'https://kaleidoscope-improv.com/assets/about_graphic.webp'
            ],
            'performer': {
                '@type': 'PerformingGroup',
                'name': 'Kaleidoscope',
                'url': 'https://kaleidoscope-improv.com/',
                '@id': 'https://kaleidoscope-improv.com/#organization'
            },
            'organizer': {
                '@type': 'Organization',
                'name': 'Kaleidoscope GbR',
                'url': 'https://kaleidoscope-improv.com/',
                '@id': 'https://kaleidoscope-improv.com/#organization'
            }
        };

        if (show.ticketLink && show.ticketLink !== '#' && show.ticketLink.startsWith('http')) {
            schema.offers = {
                '@type': 'Offer',
                'url': show.ticketLink,
                'availability': 'https://schema.org/InStock',
                'priceCurrency': 'EUR'
            };
        }

        return schema;
    });

    let scriptTag = document.getElementById('schema-events');
    if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'schema-events';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
    }

    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': eventSchemas
    };

    scriptTag.textContent = JSON.stringify(structuredData, null, 2);
}

// Fetch shows from Google Sheets
async function fetchShows() {
    const showsContainer = document.getElementById('shows-container');

    if (GOOGLE_SHEET_ID === 'YOUR_GOOGLE_SHEET_ID_HERE') {
        console.warn("Google Sheet ID not set. Using fallback data.");
        renderFallbackShows();
        return;
    }

    try {
        const isPublishedId = GOOGLE_SHEET_ID.startsWith('2PACX');
        const url = isPublishedId
            ? `https://docs.google.com/spreadsheets/d/e/${GOOGLE_SHEET_ID}/pub?output=tsv&cb=${Date.now()}`
            : `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=tsv&cb=${Date.now()}`;

        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error("HTTP-Error: " + response.status);
        const text = await response.text();

        // Parse TSV
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        if (lines.length < 2) throw new Error("Sheet is empty or missing headers");

        const headers = lines[0].split('\t').map(h => h.toLowerCase().trim().replace('\r', ''));
        const titleIdx = headers.indexOf('title');
        const dateIdx = headers.indexOf('date');
        const venueIdx = headers.indexOf('venue');
        const timeIdx = headers.indexOf('time');
        const linkIdx = headers.indexOf('ticketlink');

        let shows = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split('\t').map(c => c.trim().replace('\r', ''));
            if (row.length === 1 && row[0] === '') continue;

            const title = titleIdx !== -1 && row[titleIdx] ? row[titleIdx] : 'Lights Up!';
            const venue = venueIdx !== -1 && row[venueIdx] ? row[venueIdx] : 'TBA';
            const time = timeIdx !== -1 && row[timeIdx] ? row[timeIdx] : '';
            const ticketLink = linkIdx !== -1 && row[linkIdx] ? row[linkIdx] : '#';

            const dateVal = dateIdx !== -1 && row[dateIdx] ? row[dateIdx] : null;
            const showDate = parseShowDateTime(dateVal, time);

            if (showDate && !isNaN(showDate.getTime()) && showDate >= now) {
                shows.push({ title, date: showDate, venue, time, ticketLink });
            }
        }

        shows = shows.sort((a, b) => a.date - b.date).slice(0, 5);

        if (shows.length === 0) {
            showsContainer.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No upcoming shows scheduled right now. Check back soon!</p>';
            return;
        }

        let html = '';
        shows.forEach(show => {
            html += generateShowCard(
                show.title,
                show.date,
                show.venue,
                show.time || show.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                show.ticketLink
            );
        });

        showsContainer.innerHTML = html;

        // Update Structured Data for Google Rich Results
        updateStructuredData(shows);

        // Trigger animations for dynamically injected content
        setTimeout(setupIntersectionObservers, 100);

    } catch (error) {
        console.warn("Error fetching shows from Google Sheets, using fallback data:", error);
        renderFallbackShows();
    }
}

// Generate the HTML for a show card
function generateShowCard(title, dateObj, venue, timeStr, ticketLink) {
    const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short' });
    const dayFormatter = new Intl.DateTimeFormat('en', { day: '2-digit' });
    const dayOfWeekFormatter = new Intl.DateTimeFormat('en', { weekday: 'short' });

    const month = monthFormatter.format(dateObj);
    const day = dayFormatter.format(dateObj);
    const dayOfWeek = dayOfWeekFormatter.format(dateObj); // e.g. "Sat"

    let btnHtml = ticketLink && ticketLink !== '#'
        ? `<a href="${ticketLink}" target="_blank" class="btn btn-primary">Tickets & Info</a>`
        : `<button class="btn btn-secondary" disabled>Available Soon</button>`;

    return `
        <div class="show-card glass-card fade-in">
            <div class="show-date">
                <span class="month">${month}</span>
                <span class="day">${day}</span>
            </div>
            <div class="show-details">
                <h3>${title}</h3>
                <div class="show-meta">
                    <span>📍 ${venue}</span>
                    <span>🕘 ${dayOfWeek} - ${timeStr}</span>
                </div>
            </div>
            <div class="show-action">
                ${btnHtml}
            </div>
        </div>
    `;
}

// Fallback if Google Sheets is not configured or data can't be fetched
function renderFallbackShows() {
    const showsContainer = document.getElementById('shows-container');

    // Using dummy data based on their historical wix site data
    const dummyShows = [
        {
            title: "Lights Up! @ ImprovWorks Berlin",
            date: new Date(2026, 2, 13, 20, 0), // March 13
            venue: "ImprovWorks Berlin",
            time: "20:00",
            ticketLink: "https://www.improvworksberlin.com/shows"
        },
        {
            title: "Lights Up! @ Monbijou Märchenhütten",
            date: new Date(2026, 2, 21, 19, 30), // March 21
            venue: "Monbijou Märchenhütten",
            time: "19:30",
            ticketLink: "https://www.yesticket.org/event/en/lights-up-the-improvised-musical-monbijou-maerchenhuetten-21-03-26/"
        }
    ];

    let html = '';
    dummyShows.forEach(s => {
        html += generateShowCard(s.title, s.date, s.venue, s.time, s.ticketLink);
    });

    // Add a little note about configuration for development
    html += `<p style="grid-column:1/-1; text-align:center; font-size:0.8rem; color:var(--text-muted); opacity: 0.5;">(Example data. Connect your Google Sheet to load dynamically.)</p>`;

    showsContainer.innerHTML = html;

    // Update Structured Data for Google Rich Results
    updateStructuredData(dummyShows);

    // Trigger animations for manually injected content
    setTimeout(setupIntersectionObservers, 100);
}

// --- Reviews ---

async function fetchReviews() {
    const marqueeContainer = document.querySelector('.hero-reviews.marquee-container');
    if (!marqueeContainer) return;

    if (REVIEWS_SHEET_ID === 'YOUR_REVIEWS_SHEET_ID_HERE') {
        renderFallbackReviews(marqueeContainer);
        return;
    }

    try {
        const isPublishedId = REVIEWS_SHEET_ID.startsWith('2PACX');
        const url = isPublishedId
            ? `https://docs.google.com/spreadsheets/d/e/${REVIEWS_SHEET_ID}/pub?output=tsv&cb=${Date.now()}`
            : `https://docs.google.com/spreadsheets/d/${REVIEWS_SHEET_ID}/export?format=tsv&cb=${Date.now()}`;

        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error('HTTP-Error: ' + response.status);
        const text = await response.text();

        const lines = text.split('\n').filter(line => line.trim().length > 0);
        if (lines.length < 2) throw new Error('Sheet is empty or missing headers');

        const headers = lines[0].split('\t').map(h => h.toLowerCase().trim().replace('\r', ''));
        const reviewIdx = headers.indexOf('review');
        const sizeIdx = headers.indexOf('size');
        const styleIdx = headers.indexOf('style');

        if (reviewIdx === -1) throw new Error("No 'review' column found in sheet");

        const reviews = [];
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split('\t').map(c => c.trim().replace('\r', ''));
            if (row.length === 1 && row[0] === '') continue;
            const review = row[reviewIdx];
            if (!review) continue;
            const size = sizeIdx !== -1 && row[sizeIdx] ? row[sizeIdx] : 'm';
            const style = styleIdx !== -1 && row[styleIdx] ? row[styleIdx] : 'text-dark';
            reviews.push({ review, size, style });
        }

        if (reviews.length === 0) {
            renderFallbackReviews(marqueeContainer);
            return;
        }

        injectMarqueeReviews(marqueeContainer, reviews);

    } catch (error) {
        console.warn('Error fetching reviews from Google Sheets, using fallback:', error);
        renderFallbackReviews(marqueeContainer);
    }
}

function generateReviewCard(review, size, style) {
    return `
        <div class="review-card">
            <div class="stars">★★★★★</div>
            <div class="rev ${style} size-${size}">${review}</div>
        </div>
    `;
}

function injectMarqueeReviews(container, reviews) {
    const logoCard = `
        <div class="review-card logo-card">
            <img src="assets/kaleido_text_logo.webp" alt="Kaleidoscope Logo" class="hero-image-logo">
        </div>
    `;

    let cardsHtml = '';
    const midpoint = Math.floor(reviews.length / 2);
    reviews.forEach((r, i) => {
        cardsHtml += generateReviewCard(r.review, r.size, r.style);
        if (i === midpoint) cardsHtml += logoCard;
    });

    container.innerHTML =
        `<div class="marquee-content">${cardsHtml}</div>` +
        `<div class="marquee-content" aria-hidden="true">${cardsHtml}</div>`;
}

function renderFallbackReviews(container) {
    const fallbackReviews = [
        { review: '"HILARIOUS CRAZY FUN!"',                    size: 'l',  style: 'text-dark'  },
        { review: '"FILLED WITH LOVE."',                       size: 'm',  style: 'text-light' },
        { review: '"AMAZINGLY TALENTED"',                      size: 'm',  style: 'text-light' },
        { review: '"BROADWAY AT ITS BEST!"',                   size: 'l',  style: 'text-dark'  },
        { review: '"YOU WILL LAUGH TILL YOUR STOMACH HURTS"',  size: 'm',  style: 'text-light' },
        { review: '"JOYOUS"',                                  size: 'xl', style: 'text-dark'  },
        { review: '"AN ABSOLUTE TREAT"',                       size: 'l',  style: 'text-light' },
        { review: '"RIOTOUSLY FUNNY,<br>INCREDIBLY CLEVER"',  size: 'm',  style: 'text-dark'  },
        { review: '"PURE MAGIC ON STAGE"',                     size: 'l',  style: 'text-dark'  },
        { review: '"KALEIDOSCOPE WILL ROCK YOUR SOCKS OFF"',   size: 'm',  style: 'text-dark'  },
        { review: '"AMAZING!"',                                size: 'xl', style: 'text-light' },
        { review: '"A TREASURE OF CREATIVITY"',               size: 'm',  style: 'text-dark'  },
        { review: '"ELECTRIC"',                                size: 'xl', style: 'text-dark'  },
        { review: '"WUNDERBAR"',                               size: 'l',  style: 'text-light' },
    ];
    injectMarqueeReviews(container, fallbackReviews);
}

// --- UI Logic ---

function setupKaleidoText() {
    const elements = document.querySelectorAll('.kaleido-text');
    elements.forEach(el => {
        // Only split top-level text nodes cleanly, avoiding destroying nested HTML
        const text = el.textContent;
        el.textContent = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char.trim() === '') {
                el.appendChild(document.createTextNode(char));
            } else {
                const span = document.createElement('span');
                span.textContent = char;
                el.appendChild(span);
            }
        }
    });
}

function setupIntersectionObservers() {
    const faders = document.querySelectorAll('.fade-in');

    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });
}
