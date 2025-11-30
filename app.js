(function() {
    'use strict';

    const DEBUG = window.location.hash === '#debug';
    
    if (DEBUG) {
        console.log('=== BIRTHDAY APP DEBUG MODE ===');
    }

    const state = {
        currentSlide: 0,
        totalSlides: 4,
        gameScore: 0,
        gameWon: false,
        musicPlaying: false,
        particlesActive: true,
        animationsActive: !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };

    const selectors = {
        intro: document.getElementById('intro'),
        mainContent: document.getElementById('main-content'),
        musicToggle: document.getElementById('music-toggle'),
        musicStatus: document.querySelector('.music-status'),
        bgMusic: document.getElementById('bg-music'),
        carouselTrack: document.querySelector('.carousel-track'),
        carouselPrev: document.querySelector('.carousel-prev'),
        carouselNext: document.querySelector('.carousel-next'),
        carouselDots: document.querySelector('.carousel-dots'),
        messageCards: document.querySelectorAll('.message-card'),
        gameArea: document.getElementById('game-area'),
        gameScore: document.getElementById('game-score'),
        gameReset: document.getElementById('game-reset'),
        gameWin: document.getElementById('game-win'),
        particlesCanvas: document.getElementById('particles'),
        floatingElements: document.querySelectorAll('.heart, .balloon')
    };

    if (DEBUG) {
        const missing = Object.entries(selectors).filter(([key, val]) => {
            if (key === 'messageCards' || key === 'floatingElements') {
                return val.length === 0;
            }
            return !val;
        });
        if (missing.length > 0) {
            console.warn('Missing selectors:', missing.map(([key]) => key));
        } else {
            console.log('All selectors loaded successfully');
        }
    }

    let particlesCtx = null;
    let particlesArray = [];
    let animationFrameId = null;
    let isTabVisible = true;

    document.addEventListener('visibilitychange', () => {
        isTabVisible = !document.hidden;
        if (!isTabVisible && animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        } else if (isTabVisible && state.particlesActive) {
            animateParticles();
        }
    });

    function initIntroAnimation() {
        if (!state.animationsActive) {
            gsap.set(selectors.intro, { display: 'none' });
            gsap.set(selectors.mainContent, { opacity: 1 });
            return;
        }

        const tl = gsap.timeline({
            onComplete: () => {
                selectors.intro.style.display = 'none';
            }
        });

        tl.set(selectors.intro, { display: 'flex' })
          .from('.gift-body', { 
              duration: 0.8, 
              scale: 0, 
              ease: 'back.out(1.7)' 
          })
          .from('.gift-ribbon-v, .gift-ribbon-h', { 
              duration: 0.5, 
              scaleY: 0, 
              stagger: 0.1 
          }, '-=0.4')
          .from('.gift-bow', { 
              duration: 0.5, 
              scale: 0, 
              rotation: 360, 
              ease: 'back.out(1.7)' 
          }, '-=0.2')
          .to('.gift-lid', { 
              duration: 1, 
              rotationX: -120, 
              y: -100, 
              ease: 'power2.inOut', 
              delay: 0.5 
          })
          .to('.gift-body, .gift-ribbon-v, .gift-ribbon-h, .gift-bow', { 
              duration: 0.8, 
              scale: 0, 
              opacity: 0, 
              ease: 'power2.in' 
          }, '-=0.4')
          .to(selectors.intro, { 
              duration: 0.6, 
              opacity: 0, 
              ease: 'power2.inOut' 
          }, '-=0.3')
          .to(selectors.mainContent, { 
              duration: 1, 
              opacity: 1, 
              ease: 'power2.out' 
          }, '-=0.4');

        createIntroSparkles();
    }

    function createIntroSparkles() {
        const container = document.querySelector('.intro-sparkles');
        if (!container) return;

        for (let i = 0; i < 20; i++) {
            const sparkle = document.createElement('div');
            sparkle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: #fbbf24;
                border-radius: 50%;
                box-shadow: 0 0 10px #fbbf24;
                left: ${50 + (Math.random() - 0.5) * 40}%;
                top: ${50 + (Math.random() - 0.5) * 40}%;
            `;
            container.appendChild(sparkle);

            if (state.animationsActive) {
                gsap.to(sparkle, {
                    duration: 1 + Math.random(),
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200,
                    opacity: 0,
                    scale: Math.random() * 2,
                    delay: 1.5 + Math.random() * 0.5,
                    ease: 'power2.out'
                });
            }
        }
    }

    function initParticles() {
        if (!selectors.particlesCanvas) return;

        particlesCtx = selectors.particlesCanvas.getContext('2d');
        resizeCanvas();

        window.addEventListener('resize', resizeCanvas);

        const particleCount = window.innerWidth < 768 ? 50 : 100;
        
        for (let i = 0; i < particleCount; i++) {
            particlesArray.push(new Particle());
        }

        animateParticles();
    }

    function resizeCanvas() {
        if (!selectors.particlesCanvas) return;
        selectors.particlesCanvas.width = window.innerWidth;
        selectors.particlesCanvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.reset();
            this.y = Math.random() * selectors.particlesCanvas.height;
        }

        reset() {
            this.x = Math.random() * selectors.particlesCanvas.width;
            this.y = -10;
            this.size = Math.random() * 3 + 1;
            this.speedY = Math.random() * 1 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.3;
            this.type = Math.random() > 0.7 ? 'star' : 'circle';
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX;

            if (this.y > selectors.particlesCanvas.height) {
                this.reset();
            }

            if (this.x < 0 || this.x > selectors.particlesCanvas.width) {
                this.speedX *= -1;
            }
        }

        draw() {
            particlesCtx.save();
            particlesCtx.globalAlpha = this.opacity;

            if (this.type === 'star') {
                particlesCtx.fillStyle = '#fbbf24';
                particlesCtx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const x = this.x + Math.cos(angle) * this.size;
                    const y = this.y + Math.sin(angle) * this.size;
                    if (i === 0) particlesCtx.moveTo(x, y);
                    else particlesCtx.lineTo(x, y);
                }
                particlesCtx.closePath();
                particlesCtx.fill();
            } else {
                particlesCtx.fillStyle = '#e9d5ff';
                particlesCtx.beginPath();
                particlesCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                particlesCtx.fill();
            }

            particlesCtx.restore();
        }
    }

    function animateParticles() {
        if (!particlesCtx || !isTabVisible || !state.particlesActive) return;

        particlesCtx.clearRect(0, 0, selectors.particlesCanvas.width, selectors.particlesCanvas.height);

        particlesArray.forEach(particle => {
            particle.update();
            particle.draw();
        });

        animationFrameId = requestAnimationFrame(animateParticles);
    }

    function initFloatingElements() {
        if (!state.animationsActive) return;

        selectors.floatingElements.forEach((element, index) => {
            const isHeart = element.classList.contains('heart');
            const duration = 15 + Math.random() * 10;
            const delay = index * 2;

            gsap.set(element, {
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 100,
                rotation: Math.random() * 360
            });

            gsap.to(element, {
                y: -200,
                x: `+=${(Math.random() - 0.5) * 300}`,
                rotation: `+=${Math.random() * 360}`,
                duration: duration,
                delay: delay,
                ease: 'none',
                repeat: -1,
                repeatDelay: Math.random() * 5
            });

            if (isHeart) {
                gsap.to(element, {
                    scale: 1.2,
                    duration: 2,
                    yoyo: true,
                    repeat: -1,
                    ease: 'power1.inOut'
                });
            }
        });
    }

    // ===== UPDATED MUSIC TOGGLE (2:00 - 3:00 PORTION) =====
    function initMusicToggle() {
        if (!selectors.musicToggle || !selectors.bgMusic) return;

        selectors.musicToggle.addEventListener('click', toggleMusic);

        selectors.bgMusic.volume = 0;
        selectors.bgMusic.dataset.startTime = 120; // 2:00 min
        selectors.bgMusic.dataset.endTime = 180;   // 3:00 min
    }

    function toggleMusic() {
        if (!selectors.bgMusic) return;

        const startTime = parseFloat(selectors.bgMusic.dataset.startTime) || 0;
        const endTime = parseFloat(selectors.bgMusic.dataset.endTime) || selectors.bgMusic.duration;

        if (state.musicPlaying) {
            gsap.to(selectors.bgMusic, {
                volume: 0,
                duration: 1,
                onComplete: () => {
                    selectors.bgMusic.pause();
                }
            });
            selectors.musicToggle.classList.remove('playing');
            selectors.musicToggle.setAttribute('aria-pressed', 'false');
            if (selectors.musicStatus) selectors.musicStatus.textContent = 'Play Music';
        } else {
            selectors.bgMusic.currentTime = startTime;

            selectors.bgMusic.play().then(() => {
                gsap.to(selectors.bgMusic, {
                    volume: 0.3,
                    duration: 1
                });

                const checkInterval = setInterval(() => {
                    if (selectors.bgMusic.currentTime >= endTime || selectors.bgMusic.paused) {
                        gsap.to(selectors.bgMusic, {
                            volume: 0,
                            duration: 0.5,
                            onComplete: () => {
                                selectors.bgMusic.pause();
                                clearInterval(checkInterval);
                            }
                        });
                    }
                }, 200);

                selectors.musicToggle.classList.add('playing');
                selectors.musicToggle.setAttribute('aria-pressed', 'true');
                if (selectors.musicStatus) selectors.musicStatus.textContent = 'Pause Music';
            }).catch(() => {
                if (DEBUG) console.log('Music file not found - user should add assets/music.mp3');
            });
        }

        state.musicPlaying = !state.musicPlaying;
    }
    // ===== END MUSIC UPDATE =====

    function initCarousel() {
        if (!selectors.carouselDots) return;

        for (let i = 0; i < state.totalSlides; i++) {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `Message ${i + 1}`);
            dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(i));
            selectors.carouselDots.appendChild(dot);
        }

        if (selectors.carouselPrev) selectors.carouselPrev.addEventListener('click', prevSlide);
        if (selectors.carouselNext) selectors.carouselNext.addEventListener('click', nextSlide);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        });
    }

    function goToSlide(index) {
        if (index < 0 || index >= state.totalSlides) return;

        const oldSlide = selectors.messageCards[state.currentSlide];
        const newSlide = selectors.messageCards[index];
        const dots = selectors.carouselDots.querySelectorAll('.carousel-dot');

        if (state.animationsActive) {
            gsap.to(oldSlide, {
                opacity: 0,
                x: index > state.currentSlide ? -50 : 50,
                duration: 0.4,
                onComplete: () => {
                    oldSlide.classList.remove('active');
                    gsap.set(oldSlide, { x: 0 });
                }
            });

            gsap.fromTo(newSlide,
                { opacity: 0, x: index > state.currentSlide ? 50 : -50 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.4,
                    delay: 0.2,
                    onStart: () => {
                        newSlide.classList.add('active');
                    }
                }
            );
        } else {
            oldSlide.classList.remove('active');
            newSlide.classList.add('active');
        }

        dots[state.currentSlide].classList.remove('active');
        dots[state.currentSlide].setAttribute('aria-selected', 'false');
        dots[index].classList.add('active');
        dots[index].setAttribute('aria-selected', 'true');

        state.currentSlide = index;
    }

    function nextSlide() {
        goToSlide((state.currentSlide + 1) % state.totalSlides);
    }

    function prevSlide() {
        goToSlide((state.currentSlide - 1 + state.totalSlides) % state.totalSlides);
    }

    function initGame() {
        if (!selectors.gameArea) return;

        createBalloons();

        if (selectors.gameReset) selectors.gameReset.addEventListener('click', resetGame);
    }

    function createBalloons() {
        selectors.gameArea.innerHTML = '';
        const colors = ['#ec4899', '#8b5cf6', '#fbbf24', '#f472b6', '#a78bfa'];
        const balloonCount = window.innerWidth < 768 ? 8 : 12;

        for (let i = 0; i < balloonCount; i++) {
            const balloon = document.createElement('div');
            balloon.classList.add('game-balloon');
            balloon.innerHTML = `
                <svg viewBox="0 0 60 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="30" cy="30" rx="20" ry="25" fill="${colors[i % colors.length]}"/>
                    <path d="M30 55 L28 65 L30 70 L32 65 Z" fill="${colors[i % colors.length]}" opacity="0.7"/>
                    <line x1="30" y1="70" x2="30" y2="80" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                </svg>
            `;

            const maxX = selectors.gameArea.offsetWidth - 60;
            const maxY = selectors.gameArea.offsetHeight - 72;

            balloon.style.left = Math.random() * maxX + 'px';
            balloon.style.top = Math.random() * maxY + 'px';

            balloon.addEventListener('click', () => popBalloon(balloon));

            selectors.gameArea.appendChild(balloon);

            if (state.animationsActive) {
                gsap.to(balloon, {
                    y: '-=20',
                    duration: 2 + Math.random() * 2,
                    yoyo: true,
                    repeat: -1,
                    ease: 'power1.inOut'
                });
            }
        }
    }

    function popBalloon(balloon) {
        if (state.gameWon) return;

        state.gameScore++;
        selectors.gameScore.textContent = state.gameScore;

        if (state.animationsActive) {
            gsap.to(balloon, {
                scale: 1.5,
                opacity: 0,
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    balloon.remove();
                    checkGameWin();
                }
            });
        } else {
            balloon.remove();
            checkGameWin();
        }
    }

    function checkGameWin() {
        const remainingBalloons = selectors.gameArea.querySelectorAll('.game-balloon');
        if (remainingBalloons.length === 0 && !state.gameWon) {
            state.gameWon = true;
            showWinMessage();
        }
    }

    function showWinMessage() {
        selectors.gameWin.textContent = '😏Arey Waah Apko toh ye bhi aata hai,Hppp!';
        selectors.gameWin.classList.add('show');

        if (state.animationsActive) {
            gsap.from(selectors.gameWin, {
                scale: 0,
                opacity: 0,
                duration: 0.6,
                ease: 'back.out(1.7)'
            });
        }
    }

    function resetGame() {
        state.gameScore = 0;
        state.gameWon = false;
        selectors.gameScore.textContent = '0';
        selectors.gameWin.classList.remove('show');
        createBalloons();
    }

    function init() {
        if (DEBUG) {
            console.log('Initializing app...');
            console.log('Animations active:', state.animationsActive);
        }

        initIntroAnimation();
        initParticles();
        initFloatingElements();
        initMusicToggle();
        initCarousel();
        initGame();

        if (DEBUG) {
            console.log('App initialized successfully');
        }
    }

    window.addEventListener('DOMContentLoaded', init);

})();
