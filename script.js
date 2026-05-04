document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const curtain = document.getElementById('curtain-wrapper');
    const leftCurtain = document.querySelector('.left-curtain');
    const rightCurtain = document.querySelector('.right-curtain');
    const curtainText = document.querySelector('.curtain-text');
    const roleModal = document.getElementById('role-modal');
    const roleModalPanel = document.querySelector('.role-modal-panel');
    const roleModalImage = document.getElementById('role-modal-image');
    const roleModalImageSecondary = document.getElementById('role-modal-image-secondary');
    const roleModalCopy = document.getElementById('role-modal-copy');
    const roleModalClose = document.getElementById('role-modal-close');
    const roleCards = document.querySelectorAll('.role-card');
    const archetypesTrack = document.getElementById('archetypes-track');
    const archetypesPrev = document.getElementById('archetypes-prev');
    const archetypesNext = document.getElementById('archetypes-next');
    let closeModalTimer = null;
    let curtainProgress = 0;

    if (!curtain || !leftCurtain || !rightCurtain || !curtainText) {
        return;
    }

    body.classList.add('pre-opening');
    window.scrollTo(0, 0);

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const syncCurtain = () => {
        leftCurtain.style.transform = `translateX(${-100 * curtainProgress}%)`;
        rightCurtain.style.transform = `translateX(${100 * curtainProgress}%)`;
        curtainText.style.opacity = String(1 - curtainProgress * 1.35);
        curtain.style.visibility = 'visible';

        if (curtainProgress < 1) {
            body.classList.add('pre-opening');
        } else {
            body.classList.remove('pre-opening');
        }
    };

    const updateCurtainProgress = (deltaY) => {
        const step = deltaY / 700;
        curtainProgress = clamp(curtainProgress + step, 0, 1);
        syncCurtain();
    };

    const blockedKeys = new Set(['ArrowDown', 'PageDown', ' ', 'Spacebar']);
    const reverseKeys = new Set(['ArrowUp', 'PageUp']);

    window.addEventListener('wheel', (event) => {
        const atTop = window.scrollY <= 0;
        const shouldControlCurtain =
            curtainProgress < 1 ||
            (curtainProgress > 0 && atTop && event.deltaY < 0);

        if (!shouldControlCurtain) {
            return;
        }

        event.preventDefault();
        updateCurtainProgress(event.deltaY);
    }, { passive: false });

    window.addEventListener('touchmove', (event) => {
        if (curtainProgress === 1) {
            return;
        }

        event.preventDefault();
    }, { passive: false });

    window.addEventListener('keydown', (event) => {
        const atTop = window.scrollY <= 0;
        const isForwardKey = blockedKeys.has(event.key);
        const isReverseKey = reverseKeys.has(event.key);
        const shouldControlCurtain =
            (curtainProgress < 1 && isForwardKey) ||
            (curtainProgress > 0 && atTop && isReverseKey);

        if (!shouldControlCurtain) {
            return;
        }

        event.preventDefault();

        if (isForwardKey) {
            updateCurtainProgress(140);
        } else if (isReverseKey) {
            updateCurtainProgress(-140);
        }
    });
    syncCurtain();

    if (!roleModal || !roleModalPanel || !roleModalImage || !roleModalImageSecondary || !roleModalCopy || !roleModalClose || roleCards.length === 0) {
        return;
    }

    const closeRoleModal = () => {
        if (!roleModal.classList.contains('is-visible')) {
            return;
        }

        roleModal.classList.remove('is-visible');
        roleModal.classList.add('is-closing');

        if (closeModalTimer) {
            window.clearTimeout(closeModalTimer);
        }

        closeModalTimer = window.setTimeout(() => {
            roleModal.classList.remove('is-closing');
            roleModal.setAttribute('aria-hidden', 'true');
            body.classList.remove('modal-open');
            closeModalTimer = null;
        }, 620);
    };

    roleCards.forEach((card) => {
        card.addEventListener('click', () => {
            const cardImage = card.querySelector('.role-image');

            roleModalCopy.textContent = card.dataset.roleDescription || '';
            roleModalImage.src = cardImage?.src || '';
            roleModalImage.alt = cardImage?.alt || '';
            roleModalImageSecondary.src = card.dataset.roleModalImageSecondary || 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
            roleModalImageSecondary.alt = card.dataset.roleModalImageSecondaryAlt || '';

            const sourceRect = (cardImage || card).getBoundingClientRect();
            const panelRect = roleModalPanel.getBoundingClientRect();
            const sourceCenterX = sourceRect.left + (sourceRect.width / 2);
            const sourceCenterY = sourceRect.top + (sourceRect.height / 2);
            const panelCenterX = panelRect.left + (panelRect.width / 2);
            const panelCenterY = panelRect.top + (panelRect.height / 2);
            const scaleX = sourceRect.width / panelRect.width;
            const scaleY = sourceRect.height / panelRect.height;
            const scale = Math.min(scaleX, scaleY);
            const deltaX = sourceCenterX - panelCenterX;
            const deltaY = sourceCenterY - panelCenterY;

            roleModalPanel.style.setProperty('--modal-from-x', `${deltaX}px`);
            roleModalPanel.style.setProperty('--modal-from-y', `${deltaY}px`);
            roleModalPanel.style.setProperty('--modal-from-scale', `${scale}`);

            if (closeModalTimer) {
                window.clearTimeout(closeModalTimer);
                closeModalTimer = null;
            }

            roleModal.classList.remove('is-closing');
            roleModal.setAttribute('aria-hidden', 'false');
            body.classList.add('modal-open');

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    roleModal.classList.add('is-visible');
                });
            });
        });
    });

    roleModalClose.addEventListener('click', closeRoleModal);

    roleModal.addEventListener('click', (event) => {
        if (event.target === roleModal) {
            closeRoleModal();
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && roleModal.classList.contains('is-visible')) {
            closeRoleModal();
        }
    });

    if (archetypesTrack && archetypesPrev && archetypesNext) {
        const originalArchetypeCards = Array.from(archetypesTrack.querySelectorAll('.archetype-card'));
        const archetypesCount = originalArchetypeCards.length;
        let currentArchetypeIndex = archetypesCount > 1 ? 1 : 0;
        let isAdjustingCarousel = false;

        if (archetypesCount > 1) {
            const firstClone = originalArchetypeCards[0].cloneNode(true);
            const lastClone = originalArchetypeCards[archetypesCount - 1].cloneNode(true);

            firstClone.setAttribute('aria-hidden', 'true');
            lastClone.setAttribute('aria-hidden', 'true');

            archetypesTrack.insertBefore(lastClone, originalArchetypeCards[0]);
            archetypesTrack.appendChild(firstClone);
        }

        const syncArchetypesCarousel = () => {
            archetypesTrack.style.transform = `translateX(-${currentArchetypeIndex * 100}%)`;
            archetypesPrev.disabled = archetypesCount <= 1;
            archetypesNext.disabled = archetypesCount <= 1;
        };

        archetypesPrev.addEventListener('click', () => {
            if (archetypesCount <= 1 || isAdjustingCarousel) {
                return;
            }

            currentArchetypeIndex -= 1;
            syncArchetypesCarousel();
        });

        archetypesNext.addEventListener('click', () => {
            if (archetypesCount <= 1 || isAdjustingCarousel) {
                return;
            }

            currentArchetypeIndex += 1;
            syncArchetypesCarousel();
        });

        archetypesTrack.addEventListener('transitionend', () => {
            if (archetypesCount <= 1) {
                return;
            }

            if (currentArchetypeIndex === 0) {
                isAdjustingCarousel = true;
                archetypesTrack.style.transition = 'none';
                currentArchetypeIndex = archetypesCount;
                syncArchetypesCarousel();

                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => {
                        archetypesTrack.style.transition = '';
                        isAdjustingCarousel = false;
                    });
                });
            } else if (currentArchetypeIndex === archetypesCount + 1) {
                isAdjustingCarousel = true;
                archetypesTrack.style.transition = 'none';
                currentArchetypeIndex = 1;
                syncArchetypesCarousel();

                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => {
                        archetypesTrack.style.transition = '';
                        isAdjustingCarousel = false;
                    });
                });
            }
        });

        syncArchetypesCarousel();
    }
});
