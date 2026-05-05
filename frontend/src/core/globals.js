import '../scss/style.scss';
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;

document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    const updateButtonUI = (theme) => {
        if (!themeToggleBtn || !themeIcon ) return;
        themeIcon.classList.remove('bi-moon-stars-fill', 'bi-sun-fill');
        if (theme === 'dark') {
            themeIcon.classList.add('bi-sun-fill');
        } else {
            themeIcon.classList.add('bi-moon-stars-fill');
        }
    };

    const getPreferredTheme = () => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) return storedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const initialTheme = getPreferredTheme();
    htmlElement.setAttribute('data-bs-theme', initialTheme);
    updateButtonUI(initialTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateButtonUI(newTheme);
        });
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            const systemTheme = e.matches ? 'dark' : 'light';
            htmlElement.setAttribute('data-bs-theme', systemTheme);
            updateButtonUI(systemTheme);
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const libraryLink = document.getElementById("nav-library");
    if (libraryLink) {
        libraryLink.addEventListener('click', (e) => {
            if (!window.currentUser) {
                e.preventDefault();
                const modalEl = document.getElementById('auth-modal');
                if (modalEl) {
                    const authModal = new bootstrap.Modal(modalEl);
                    authModal.show();
                } else {
                    console.warn("Auth Modal not found on this page.");
                    alert("Please login to access your library.");
                }
            }
        });
    }
});