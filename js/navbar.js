class SiteNavbar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="nav-container">
                <a href="index.html" class="logo">
                    <img src="assets/kaleido_logo.webp" alt="Kaleidoscope Logo"
                        onerror="this.src=''; this.alt='KALEIDOSCOPE'; this.className='text-logo'">
                </a>
                <ul class="nav-links">
                    <li><a href="index.html#about" class="nav-link">About</a></li>
                    <li><a href="index.html#shows" class="nav-link">Upcoming Shows</a></li>
                    <li><a href="index.html#reviews-iframe" class="nav-link">Reviews</a></li>
                    <li><a href="index.html#cast" class="nav-link">The Company</a></li>
                    <li><a href="https://kaleidoscope-improv.us17.list-manage.com/subscribe?u=deb83251866b51d2f963230ce&id=e0cdb9cdbc"
                            target="_blank" rel="noopener noreferrer" class="nav-link btn-primary">Newsletter</a></li>
                </ul>
                <div class="mobile-menu-btn">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        this.id = 'navbar';
        this.className = 'navbar';

        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                this.classList.add('scrolled');
            } else {
                this.classList.remove('scrolled');
            }
        });

        // Mobile menu toggle
        const mobileBtn = this.querySelector('.mobile-menu-btn');
        const navLinks = this.querySelector('.nav-links');
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
}

customElements.define('site-navbar', SiteNavbar);
