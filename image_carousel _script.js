document.querySelectorAll('.news-image-carousel').forEach((carousel) => {
    const images = Array.from(carousel.querySelectorAll('img'));
    const previousButton = carousel.querySelector('.carousel-toggle--previous');
    const nextButton = carousel.querySelector('.carousel-toggle--next');
    let activeIndex = images.findIndex((image) => image.classList.contains('is-active'));
    const imageRadius = parseFloat(window.getComputedStyle(carousel).getPropertyValue('--image-corner-radius')) || 20;
    const transitionDuration = parseFloat(window.getComputedStyle(carousel).getPropertyValue('--carousel-slide-duration')) || 350;
    let touchStart = null;
    let drag = null;
    let transitionTimer;

    if (activeIndex < 0) activeIndex = 0;
    if (!images.length) return;

    const updateHeight = () => {
        const activeImage = images[activeIndex];
        if (activeImage.naturalWidth && activeImage.naturalHeight) {
            carousel.style.height = `${carousel.clientWidth * activeImage.naturalHeight / activeImage.naturalWidth}px`;
        }
    };

    updateHeight();
    images.forEach((image, index) => {
        image.addEventListener('load', () => {
            if (index === activeIndex) updateHeight();
        });
    });
    window.addEventListener('resize', updateHeight);

    const showImage = (requestedIndex) => {
        if (drag) return;
        const direction = requestedIndex > activeIndex ? 'next' : 'previous';
        const width = carousel.clientWidth;
        const previewIndex = (requestedIndex + images.length) % images.length;
        const previewImage = images[previewIndex];

        drag = {
            delta: direction === 'next' ? -width : width,
            previewIndex,
            width
        };
        previewImage.classList.add('is-drag-preview');
        previewImage.style.transform = `translateX(${direction === 'next' ? width : -width}px)`;
        carousel.classList.add('is-dragging');
        carousel.offsetHeight;
        finishDrag(true);
    };

    previousButton?.addEventListener('click', () => showImage(activeIndex - 1));
    nextButton?.addEventListener('click', () => showImage(activeIndex + 1));

    const finishDrag = (shouldAdvance) => {
        if (!drag) return;

        const currentImage = images[activeIndex];
        const previewImage = images[drag.previewIndex];
        const previewIndex = drag.previewIndex;
        const dragWidth = drag.width;
        const direction = drag.delta < 0 ? 'next' : 'previous';
        const shouldCommit = shouldAdvance && previewImage && Math.abs(drag.delta) >= Math.min(80, drag.width * 0.2);
        drag = null;

        if (!previewImage) {
            currentImage.style.transform = '';
            currentImage.style.removeProperty('border-radius');
            carousel.classList.remove('is-dragging');
            touchStart = null;
            return;
        }

        const currentRadius = window.getComputedStyle(currentImage).borderTopLeftRadius;
        const previewRadius = window.getComputedStyle(previewImage).borderTopLeftRadius;
        currentImage.style.setProperty('--starting-image-radius', currentRadius);
        previewImage.style.setProperty('--starting-image-radius', previewRadius);
        currentImage.style.removeProperty('border-radius');
        previewImage.style.removeProperty('border-radius');
        carousel.classList.remove('is-dragging');
        carousel.classList.add('is-settling');
        if (shouldCommit) {
            currentImage.style.transform = `translateX(${direction === 'next' ? -dragWidth : dragWidth}px)`;
            previewImage.style.transform = 'translateX(0)';
            activeIndex = previewIndex;
            updateHeight();
        } else {
            currentImage.style.transform = 'translateX(0)';
            previewImage.style.transform = `translateX(${direction === 'next' ? dragWidth : -dragWidth}px)`;
        }

        window.setTimeout(() => {
            carousel.classList.add('is-finalizing');
            if (shouldCommit) {
                currentImage.classList.remove('is-active');
                currentImage.setAttribute('aria-hidden', 'true');
                previewImage.classList.add('is-active');
                previewImage.removeAttribute('aria-hidden');
            } else {
                previewImage.setAttribute('aria-hidden', 'true');
            }
            previewImage.classList.remove('is-drag-preview');
            images.forEach((image) => {
                image.style.removeProperty('transform');
                image.style.removeProperty('border-radius');
                image.style.removeProperty('--starting-image-radius');
            });
            carousel.offsetHeight;
            carousel.classList.remove('is-settling', 'is-finalizing');
        }, transitionDuration);
        touchStart = null;
    };

    carousel.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'touch' && !event.target.closest('button') && images.length > 1) {
            touchStart = { x: event.clientX, y: event.clientY };
        }
    });

    carousel.addEventListener('pointermove', (event) => {
        if (!touchStart) return;

        const deltaX = event.clientX - touchStart.x;
        const deltaY = event.clientY - touchStart.y;
        if (!drag && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 8) {
            if (Math.abs(deltaX) <= Math.abs(deltaY)) {
                touchStart = null;
                return;
            }

            drag = {
                delta: 0,
                previewIndex: null,
                width: carousel.clientWidth,
                startX: touchStart.x
            };
            carousel.classList.add('is-dragging');
        }
        if (!drag) return;

        drag.delta = Math.max(-drag.width, Math.min(drag.width, deltaX));
        const currentImage = images[activeIndex];
        currentImage.style.transform = `translateX(${drag.delta}px)`;
        const dragRadius = imageRadius * Math.max(0, 1 - Math.abs(drag.delta) / (drag.width * 0.55));
        currentImage.style.borderRadius = `${dragRadius}px`;

        if (drag.delta === 0) {
            currentImage.style.removeProperty('border-radius');
            if (drag.previewIndex !== null) {
                images[drag.previewIndex].classList.remove('is-drag-preview');
                images[drag.previewIndex].style.removeProperty('transform');
                images[drag.previewIndex].style.removeProperty('border-radius');
                drag.previewIndex = null;
            }
            return;
        }

        const direction = drag.delta < 0 ? 'next' : 'previous';
        const previewIndex = (activeIndex + (direction === 'next' ? 1 : -1) + images.length) % images.length;
        if (previewIndex !== drag.previewIndex) {
            if (drag.previewIndex !== null) {
                images[drag.previewIndex].classList.remove('is-drag-preview');
                images[drag.previewIndex].style.removeProperty('transform');
                images[drag.previewIndex].style.removeProperty('border-radius');
            }
            drag.previewIndex = previewIndex;
            images[previewIndex].classList.add('is-drag-preview');
            images[previewIndex].setAttribute('aria-hidden', 'true');
        }

        const previewOffset = direction === 'next' ? drag.width : -drag.width;
        images[previewIndex].style.transform = `translateX(${previewOffset + drag.delta}px)`;
        images[previewIndex].style.borderRadius = `${dragRadius}px`;
    });

    carousel.addEventListener('pointerup', (event) => {
        if (touchStart) finishDrag(true);
    });

    carousel.addEventListener('pointercancel', () => {
        touchStart = null;
        finishDrag(false);
    });
});