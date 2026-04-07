import '../scss/style.scss'
import * as bootstrap from 'bootstrap'

document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('darkModeToggle');
  
  toggleButton.addEventListener('click', () => {
    const htmlElement = document.documentElement;
    const currentTheme = htmlElement.getAttribute('data-bs-theme');
    
    if (currentTheme === 'dark') {
        htmlElement.setAttribute('data-bs-theme', 'light');
        // Use innerHTML to keep the icon
        toggleButton.innerHTML = '<i class="bi bi-moon-stars-fill me-2"></i> Dark Mode';
        toggleButton.className = 'btn btn-dark shadow-lg rounded-pill px-3 py-2'; 
      } else {
        htmlElement.setAttribute('data-bs-theme', 'dark');
        // Switch to a sun icon for light mode
        toggleButton.innerHTML = '<i class="bi bi-sun-fill me-2"></i> Light Mode';
        toggleButton.className = 'btn btn-light shadow-lg rounded-pill px-3 py-2';
      }
  });
});