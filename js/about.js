const referenceModal = document.getElementById("reference-modal");
const openReferences = document.getElementById("open-references");
const closeReferences = document.getElementById("close-references");

openReferences.addEventListener("click", function () {
    referenceModal.classList.add("show");
});

closeReferences.addEventListener("click", function () {
    referenceModal.classList.remove("show");
});

referenceModal.addEventListener("click", function (event) {
    if (event.target === referenceModal) {
        referenceModal.classList.remove("show");
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        referenceModal.classList.remove("show");
    }
});



/* Team photo slideshow */

const teamSlides = document.querySelectorAll('.team-slideshow .team-slide');
const teamDots = document.querySelectorAll('.team-slideshow .slide-dot');
const teamPrev = document.querySelector('.team-slideshow .slide-prev');
const teamNext = document.querySelector('.team-slideshow .slide-next');

if (teamSlides.length > 0) {
    let currentSlide = 0;
    let slideTimer;


    function showTeamSlide(index) {
        currentSlide = (index + teamSlides.length) % teamSlides.length;

        teamSlides.forEach((slide, i) => {
            slide.classList.toggle('active', i === currentSlide);
        });

        teamDots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
            dot.setAttribute('aria-pressed', String(i === currentSlide));
        });
    }


    function startTeamSlideshow() {
        clearInterval(slideTimer);

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        slideTimer = setInterval(() => {
            showTeamSlide(currentSlide + 1);
        }, 4000);
    }

    teamPrev?.addEventListener('click', () => {
        showTeamSlide(currentSlide - 1);
        startTeamSlideshow();
    });

    teamNext?.addEventListener('click', () => {
        showTeamSlide(currentSlide + 1);
        startTeamSlideshow();
    });

    teamDots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            showTeamSlide(i);
            startTeamSlideshow();
        });
    });

    const slideshow = document.querySelector('.team-slideshow');

    slideshow?.addEventListener('mouseenter', () => {
        clearInterval(slideTimer);
    });

    slideshow?.addEventListener('mouseleave', startTeamSlideshow);

    showTeamSlide(0);
    startTeamSlideshow();
}
