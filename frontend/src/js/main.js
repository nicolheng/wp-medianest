import '../scss/style.scss'
import * as bootstrap from 'bootstrap'

document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    // 1. Helper function to update the button's look
    const updateButtonUI = (theme) => {
        if (!themeToggleBtn || !themeIcon) return;

        if (theme === 'dark') {
            // Set Sun icon for Dark Mode (to indicate switching to light)
            themeIcon.className = 'bi bi-sun-fill fs-5';
            
            themeToggleBtn.classList.add('btn-light');
            themeToggleBtn.classList.remove('btn-outline-secondary', 'btn-dark');
        } else {
            // Set Moon icon for Light Mode (to indicate switching to dark)
            themeIcon.className = 'bi bi-moon-stars-fill fs-5';
            
            themeToggleBtn.classList.add('btn-outline-secondary');
            themeToggleBtn.classList.remove('btn-light', 'btn-dark');
        }
    };

    // 2. The Theme Detective
    const getPreferredTheme = () => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) return storedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // 3. Initialize
    const initialTheme = getPreferredTheme();
    htmlElement.setAttribute('data-bs-theme', initialTheme);
    updateButtonUI(initialTheme);

    // 4. Manual Toggle
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            htmlElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateButtonUI(newTheme);
        });
    }

    // 5. System Change Listener
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            const systemTheme = e.matches ? 'dark' : 'light';
            htmlElement.setAttribute('data-bs-theme', systemTheme);
            updateButtonUI(systemTheme);
        }
    });
});