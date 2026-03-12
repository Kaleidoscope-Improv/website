// Firebase Configuration - Replace with production config
const firebaseConfig = {
    // You will need to replace this with your actual Firebase config
    // apiKey: "YOUR_API_KEY",
    // authDomain: "kaleidoscope-berlin.firebaseapp.com",
    projectId: "kaleidoscope-berlin",
    // storageBucket: "kaleidoscope-berlin.appspot.com",
    // messagingSenderId: "123456789",
    // appId: "1:123456789:web:abcdef"
};

let db;

document.addEventListener('DOMContentLoaded', () => {
    // 1. UI Setup
    setupIntersectionObservers();
    setupNavbar();
    setupKaleidoText();
    document.getElementById('year').textContent = new Date().getFullYear();

    // 2. Initialize Firebase
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        fetchShows();
    } catch (e) {
        console.warn("Firebase config not fully set or error initializing.", e);
        renderFallbackShows();
    }
});

// Fetch shows from Firebase
async function fetchShows() {
    const showsContainer = document.getElementById('shows-container');
    
    try {
        const snapshot = await db.collection('shows')
            .where('date', '>=', new Date())
            .orderBy('date', 'asc')
            .limit(5)
            .get();

        if (snapshot.empty) {
            showsContainer.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No upcoming shows scheduled right now. Check back soon!</p>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const show = doc.data();
            const showDate = show.date.toDate();
            
            html += generateShowCard(
                show.title || 'Lights Up!',
                showDate,
                show.venue || 'TBA',
                show.time || showDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                show.ticketLink || '#'
            );
        });

        showsContainer.innerHTML = html;
        
    } catch (error) {
        console.warn("Error fetching shows, using fallback data:", error);
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

// Fallback if Firebase not configured
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
    html += `<p style="grid-column:1/-1; text-align:center; font-size:0.8rem; color:var(--text-muted); opacity: 0.5;">(Example data. Connect Firebase to load dynamically.)</p>`;

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
    if(mobileBtn && navLinks) {
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
    
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
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
