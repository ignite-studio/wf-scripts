"use strict";

(() => {
    // Constants for ARIA attributes
    const ARIA_EXPANDED = "aria-expanded";
    const ARIA_CONTROLS = "aria-controls";
    const ROLE_DIALOG = "dialog";

    // Helper Functions
    const isElementVisible = (element) =>
        !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);

    const toggleAriaExpanded = (trigger, target) => {
        const isVisible = isElementVisible(target);
        trigger.setAttribute(ARIA_EXPANDED, String(isVisible));
        return isVisible;
    };

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    const createFocusTrap = (container) => {
        let focusableElements = [
            ...container.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ),
        ];
        focusableElements = focusableElements.filter(
            (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleFocusTrap = (event) => {
            if (event.key !== "Tab") return;

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        return {
            activate: () => container.addEventListener("keydown", handleFocusTrap),
            deactivate: () => container.removeEventListener("keydown", handleFocusTrap),
        };
    };

    // Main Functions
    const setupToggleButtons = () => {
        const buttons = [...document.querySelectorAll(`[${ARIA_CONTROLS}]`)];
        buttons.forEach((button) => {
            const controlledId = button.getAttribute(ARIA_CONTROLS);
            const controlledElement = document.getElementById(controlledId);

            if (!controlledElement) return;

            // Observe visibility changes and sync ARIA attributes
            const updateVisibility = debounce(
                () => toggleAriaExpanded(button, controlledElement),
                100
            );
            const observer = new MutationObserver(updateVisibility);
            observer.observe(controlledElement, {
                attributes: true,
                attributeFilter: ["style", "class"],
            });

            // Initial synchronization
            updateVisibility();

            // Handle keyboard navigation
            button.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    button.click();
                }
            });
        });
    };

    const setupDialogs = () => {
        const dialogs = [...document.querySelectorAll(`[role="${ROLE_DIALOG}"]`)];
        dialogs.forEach((dialog) => {
            const triggerButton = document.querySelector(
                `[${ARIA_CONTROLS}="${dialog.id}"]`
            );
            if (!triggerButton) return;

            const focusTrap = createFocusTrap(dialog);

            // Toggle dialog visibility and focus trap
            const toggleDialog = (isOpen) => {
                dialog.style.display = isOpen ? "block" : "none";
                if (isOpen) {
                    focusTrap.activate();
                    // Move focus into the dialog
                    const focusable = dialog.querySelector(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    if (focusable) focusable.focus();
                } else {
                    focusTrap.deactivate();
                    triggerButton.focus();
                }
                triggerButton.setAttribute(ARIA_EXPANDED, String(isOpen));
            };

            // Handle Escape key to close the dialog
            dialog.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    toggleDialog(false);
                }
            });

            triggerButton.addEventListener("click", () => {
                const isDialogCurrentlyOpen = isElementVisible(dialog);
                toggleDialog(!isDialogCurrentlyOpen);
            });
        });
    };

    // Initialize Accessibility Enhancements
    const initializeAccessibility = () => {
        setupToggleButtons();
        setupDialogs();
    };

    // Run initialization after DOM content is loaded
    document.addEventListener("DOMContentLoaded", initializeAccessibility);
})();
