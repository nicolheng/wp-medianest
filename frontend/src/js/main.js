import '../scss/style.scss'
import * as bootstrap from 'bootstrap'

// Select the button and the icon inside it
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

themeToggleBtn.addEventListener('click', () => {
  // Read the current theme from the HTML tag (defaults to 'light' if not set)
  const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
  
  // Determine the new theme
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Apply the new theme to the document
  document.documentElement.setAttribute('data-bs-theme', newTheme);
  
  // Swap the icon classes
  if (newTheme === 'dark') {
    themeIcon.classList.replace('bi-sun-fill', 'bi-moon-fill');
  } else {
    themeIcon.classList.replace('bi-moon-fill', 'bi-sun-fill');
  }
});