import '../scss/style.scss'
import * as bootstrap from 'bootstrap'

document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const toggleText = document.getElementById('toggleText');

    // 1. Helper function to update the button's look (Icon, Text, Color)
    const updateButtonUI = (theme) => {
        if (!themeToggleBtn || !themeIcon || !toggleText) return;

        if (theme === 'dark') {
            themeIcon.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
            toggleText.textContent = 'Light Mode';
            themeToggleBtn.classList.replace('btn-dark', 'btn-light');
        } else {
            themeIcon.classList.replace('bi-sun-fill', 'bi-moon-stars-fill');
            toggleText.textContent = 'Dark Mode';
            themeToggleBtn.classList.replace('btn-light', 'btn-dark');
        }
    };

    // 2. The Theme Detective (System -> Manual -> Storage)
    const getPreferredTheme = () => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) return storedTheme;

        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // 3. Initialize the site on load
    const initialTheme = getPreferredTheme();
    htmlElement.setAttribute('data-bs-theme', initialTheme);
    updateButtonUI(initialTheme); // Sync the button to match the initial theme!

    // 4. Handle the Manual Toggle Click
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            htmlElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme); // Save preference!
            updateButtonUI(newTheme);
        });
    }

    // 5. Listen for System-Level Changes (e.g. Sunset)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // Only auto-update if the user hasn't manually picked a theme
        if (!localStorage.getItem('theme')) {
            const systemTheme = e.matches ? 'dark' : 'light';
            htmlElement.setAttribute('data-bs-theme', systemTheme);
            updateButtonUI(systemTheme);
        }
    });
});