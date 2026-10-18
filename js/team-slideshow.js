document.querySelectorAll('.team-slideshow').forEach(slideshow => {
    const slides = slideshow.querySelectorAll('.team-slide');
    const dots = slideshow.querySelectorAll('.slide-dot');
    const prev = slideshow.querySelector('.slide-prev');
    const next = slideshow.querySelector('.slide-next');

    if (!slides.length) return;

    let currentSlide = 0;
    let slideTimer;

    function showSlide(index) {
        currentSlide = (index + slides.length) % slides.length;

        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === currentSlide);
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
            dot.setAttribute('aria-pressed', String(i === currentSlide));
        });
    }

    function startSlideshow() {
        clearInterval(slideTimer);

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        slideTimer = setInterval(() => {
            showSlide(currentSlide + 1);
        }, 4000);
    }

    prev?.addEventListener('click', () => {
        showSlide(currentSlide - 1);
        startSlideshow();
    });

    next?.addEventListener('click', () => {
        showSlide(currentSlide + 1);
        startSlideshow();
    });

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            showSlide(i);
            startSlideshow();
        });
    });

    slideshow.addEventListener('mouseenter', () => {
        clearInterval(slideTimer);
    });

    slideshow.addEventListener('mouseleave', () => {
        startSlideshow();
    });

    showSlide(0);
    startSlideshow();
});
