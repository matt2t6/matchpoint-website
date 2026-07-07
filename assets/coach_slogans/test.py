<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <!-- Your existing head content... -->
    <!-- GROK FIX: Add CDNs for tour enhancements -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/intro.js/7.2.0/intro.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/intro.js/7.2.0/introjs.min.css">
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <!-- GROK FIX: Pulsing CSS -->
    <style>
        .pulsing-glow { animation: pulse 1.5s infinite ease-in-out; box-shadow: 0 0 15px #00ff00, 0 0 30px #00ff00; transition: all 0.3s; }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.03); opacity: 0.8; } }
        .introjs-tooltip { background: #1c1c1c; color: #fff; border: 1px solid #00ff00; }
        .fade-in { animation: fadeIn 0.5s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        /* Slide styles for fused infographic */
        .slide { display: none; padding: 20px; background: #1c1c1c; border-radius: 10px; margin: 20px 0; }
        .slide.active { display: block; }
        .pillar { display: inline-block; width: 45%; margin: 10px; padding: 10px; background: #333; border-radius: 5px; }
    </style>
</head>
<body>
    <!-- Your existing nav and sections... -->

    <!-- Dashboard Section (with fixes) -->
    <section id="dashboard">
        <!-- Your Diagnostic Hub, Gemini Improvisation, etc. HTML... -->
        <!-- Add ids for buttons/elements if missing, e.g. -->
        <button id="compose-button">Compose Cue</button>
        <div id="generated-cue">Awaiting composition...</div>
        <button id="tactical-cue-button">Tactical Cue</button>
        <button id="reset-cue-button">Reset Cue</button>
        <button id="recovery-cue-button">Recovery Cue</button>
        <div class="cue-played">Cue Played: None</div>
        <div class="audit-score">Audit Score: N/A</div>
        <div class="gemini-feedback">Gemini Feedback: Awaiting session...</div>
        <ul class="gemini-cue-library"></ul> <!-- For appending cues -->

        <!-- GROK FIX: Purple button with id -->
        <button id="begin-cinematic-tour">Begin Cinematic Tour</button>

        <!-- Fused Infographic Pitch-Deck (as slides under Dashboard) -->
        <section id="pitch-deck">
            <h2>Fused Pitch Deck & Roadmap</h2>
            <div id="slide1" class="slide active">
                <h3>A Dual-Domain Vision</h3>
                <p>This section introduces the core strategic insight behind MatchPoint...</p>
                <div class="pillar">🎾 The Proving Ground: Tennis...</div>
                <div class="pillar">⚡️ The Enterprise Scale: Solar Energy...</div>
            </div>
            <div id="slide2" class="slide">
                <h3>The Eight Pillars of the Symphony</h3>
                <!-- Pillars content from your doc... -->
            </div>
            <!-- Add more slides as per previous enhancement, up to 8 -->
            <div class="slide-nav">
                <button onclick="prevSlide()">Prev</button>
                <button onclick="nextSlide()">Next</button>
            </div>
        </section>
    </section>

    <!-- Your other sections... -->

    <script>
        // Your existing JS...

        // GROK FIX: Updated fetchData for POST support
        async function fetchData(url, method = 'GET', body = null) {
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : null
            };
            const response = await fetch(`http://localhost:5000${url}`, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        }

        // GROK FIX: Connection check (hide error if healthy)
        async function checkBackendConnection() {
            try {
                const data = await fetchData('/api/health', 'GET');
                document.querySelector('.connection-error').style.display = 'none';
            } catch (error) {
                console.error('Backend connection failed:', error);
            }
        }
        window.addEventListener('load', checkBackendConnection);

        // GROK FIX: Compose Cue (POST, repeatable, update UI)
        async function composeCue() {
            const button = document.getElementById('compose-button');
            button.disabled = true;
            try {
                const data = await fetchData('/api/compose', 'POST', { player_id: 'matthew_001' });
                document.getElementById('generated-cue').textContent = data.generated_cue_text;
                const library = document.querySelector('.gemini-cue-library');
                const li = document.createElement('li');
                li.textContent = `${data.generated_cue_text} (${data.generation_reason})`;
                library.appendChild(li);
            } catch (error) {
                console.error('Compose error:', error);
            } finally {
                button.disabled = false;
            }
        }
        document.getElementById('compose-button').addEventListener('click', composeCue);

        // GROK FIX: Manual Cues (similar, POST)
        async function playTacticalCue() {
            const button = document.getElementById('tactical-cue-button');
            button.disabled = true;
            try {
                const data = await fetchData('/api/tactical', 'POST', { player_id: 'matthew_001' });
                document.querySelector('.cue-played').textContent = data.cue;
                document.querySelector('.audit-score').textContent = data.score;
                document.querySelector('.gemini-feedback').textContent = data.feedback;
                // Play demo audio (placeholder)
                new Audio('path/to/audio.mp3').play();
            } catch (error) {
                console.error('Tactical error:', error);
            } finally {
                button.disabled = false;
            }
        }
        document.getElementById('tactical-cue-button').addEventListener('click', playTacticalCue);

        // Add similar for reset and recovery using /api/reset and /api/recovery

        // GROK FIX: Exceptional Cinematic Tour
        function startCinematicTour() {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00ff00', '#ffffff', '#ff00ff'] });
            // Trigger existing tour (assume your glow/menu logic)
            document.querySelector('.tour-controls').style.display = 'block';
            // Intro.js fusion
            introJs().setOptions({
                steps: [
                    { intro: '<h2 class="fade-in">Welcome to MatchPoint!</h2><p>Conduct the symphony.</p>' },
                    // Your steps...
                    // Last step: Play demo cue
                    { intro: '<p class="fade-in">Tour Complete! Hear a demo cue.</p>', onbeforechange: () => new Audio('path/to/demo-audio.mp3').play() }
                ],
                // Options as before...
            }).start();
        }
        document.getElementById('begin-cinematic-tour').addEventListener('click', startCinematicTour);

        // GROK FIX: Infographic slide nav
        let currentSlide = 1;
        const totalSlides = 8; // Adjust to your slide count
        function showSlide(n) {
            for (let i = 1; i <= totalSlides; i++) {
                const slide = document.getElementById(`slide${i}`);
                if (slide) slide.classList.toggle('active', i === n);
            }
        }
        function nextSlide() { currentSlide = (currentSlide % totalSlides) + 1; showSlide(currentSlide); }
        function prevSlide() { currentSlide = (currentSlide === 1) ? totalSlides : currentSlide - 1; showSlide(currentSlide); }
        showSlide(1);
    </script>
</body>
</html>