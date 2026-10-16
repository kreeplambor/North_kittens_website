document.querySelectorAll('.news-image-carousel').forEach((carousel) => {
    const images = Array.from(carousel.querySelectorAll('img'));
    const previousButton = carousel.querySelector('.carousel-toggle--previous');
    const nextButton = carousel.querySelector('.carousel-toggle--next');
    let activeIndex = 0;
    let touchStartX = null;

    const showImage = (index) => {
        images[activeIndex].classList.remove('is-active');
        images[activeIndex].setAttribute('aria-hidden', 'true');
        activeIndex = (index + images.length) % images.length;
        images[activeIndex].classList.add('is-active');
        images[activeIndex].removeAttribute('aria-hidden');
    };

    previousButton.addEventListener('click', () => showImage(activeIndex - 1));
    nextButton.addEventListener('click', () => showImage(activeIndex + 1));

    carousel.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'touch' && !event.target.closest('button')) {
            touchStartX = event.clientX;
        }
    });

    carousel.addEventListener('pointerup', (event) => {
        if (touchStartX === null) return;

        const swipeDistance = event.clientX - touchStartX;
        touchStartX = null;

        if (Math.abs(swipeDistance) > 40) {
            showImage(activeIndex + (swipeDistance < 0 ? 1 : -1));
        }
    });

    carousel.addEventListener('pointercancel', () => {
        touchStartX = null;
    });
});