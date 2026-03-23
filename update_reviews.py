import re

html_file = 'index.html'
with open(html_file, 'r') as f:
    html = f.read()

replacement = """    <!-- Hero Reviews Section -->

    <section class="hero-reviews marquee-container">
        <div class="marquee-content">
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-xl text-dark">"HILARIOUS CRAZY FUN!"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-l text-light">"FILLED WITH LOVE."</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-s text-light">"AMAZINGLY TALENTED"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-l text-dark">"BROADWAY AT ITS BEST!"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-m text-light">"YOU WILL LAUGH TILL YOUR STOMACH HURTS"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-xl text-dark">"JOYOUS"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-s text-light">"AN ABSOLUTE TREAT"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-l text-dark">"RIOTOUSLY FUNNY,<br>INCREDIBLY CLEVER"</div>
            </div>

            <div class="review-card logo-card">
                <img src="assets/kaleido_text_logo.png" alt="Kaleidoscope Logo" class="hero-image-logo">
            </div>

            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-xl text-dark">"PURE MAGIC ON STAGE"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-m text-dark">"KALEIDOSCOPE WILL ROCK YOUR SOCKS OFF"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-m text-light">"AMAZING!"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-m text-dark">"A TREASURE OF CREATIVITY"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-xl text-dark">"ELECTRIC"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-s text-light">"WUNDERBAR"</div>
            </div>
        </div>
        
        <div class="marquee-content" aria-hidden="true">
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-xl text-dark">"HILARIOUS CRAZY FUN!"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-l text-light">"FILLED WITH LOVE."</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-s text-light">"AMAZINGLY TALENTED"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-l text-dark">"BROADWAY AT ITS BEST!"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-m text-light">"YOU WILL LAUGH TILL YOUR STOMACH HURTS"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-xl text-dark">"JOYOUS"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-s text-light">"AN ABSOLUTE TREAT"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-l text-dark">"RIOTOUSLY FUNNY,<br>INCREDIBLY CLEVER"</div>
            </div>

            <div class="review-card logo-card">
                <img src="assets/kaleido_text_logo.png" alt="Kaleidoscope Logo" class="hero-image-logo">
            </div>

            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-xl text-dark">"PURE MAGIC ON STAGE"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-m text-dark">"KALEIDOSCOPE WILL ROCK YOUR SOCKS OFF"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-m text-light">"AMAZING!"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-m text-dark">"A TREASURE OF CREATIVITY"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-xl text-dark">"ELECTRIC"</div>
            </div>
            <div class="review-card">
                <div class="stars">★★★★★</div>
                <div class="rev size-s text-light">"WUNDERBAR"</div>
            </div>
        </div>
    </section>"""

pattern = re.compile(r'<!-- Hero Reviews Section -->.*?</section>', re.DOTALL)
new_html = pattern.sub(replacement, html)

with open(html_file, 'w') as f:
    f.write(new_html)
