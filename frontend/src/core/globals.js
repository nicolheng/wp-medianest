import '../scss/style.scss';
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;

document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;

    htmlElement.setAttribute('data-bs-theme', 'dark');

    localStorage.setItem('theme', 'dark');
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