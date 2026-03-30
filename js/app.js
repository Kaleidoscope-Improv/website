// Google Sheets Configuration
// Instructions:
// 1. Create a Google Sheet with columns: title, date (e.g. DD/MM/YYYY), venue, time, ticketLink
// 2. Share the sheet: File > Share > Publish to web (Entire Document as Web Page or CSV).
// 3. Copy the ID from the URL (the part between /d/ and /edit).
const GOOGLE_SHEET_ID = '2PACX-1vTMlSM8Zk6bXrftMZ-Pj0o-Ddod1ANoWDMol2vLQRapze1aU_T0-eSWN5mfprsWKDL5aYCS1AdSnHxR';

document.addEventListener('DOMContentLoaded', () => {
    // 1. UI Setup
    setupIntersectionObservers();
    setupNavbar();
    setupKaleidoText();
    // document.getElementById('year').textContent = new Date().getFullYear();

    // 2. Fetch Shows
    fetchShows();
});

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
            ? `https://docs.google.com/spreadsheets/d/e/${GOOGLE_SHEET_ID}/pub?output=tsv`
            : `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=tsv`;

        const response = await fetch(url);
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
            let showDate = null;

            if (dateVal) {
                // Support DD/MM/YYYY or DD.MM.YYYY format
                const dateParts = dateVal.includes('/') ? dateVal.split('/') : dateVal.split('.');
                if (dateParts.length === 3) {
                    const day = parseInt(dateParts[0], 10);
                    const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-11
                    const year = parseInt(dateParts[2], 10);
                    showDate = new Date(year, month, day);
                } else {
                    showDate = new Date(dateVal);
                }
            }

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

    // Trigger animations for manually injected content
    setTimeout(setupIntersectionObservers, 100);
}

// --- UI Logic ---

function setupNavbar() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileBtn.classList.toggle('active');
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileBtn.classList.remove('active');
            });
        });
    }
}

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
