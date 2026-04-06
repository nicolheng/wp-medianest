import '../scss/style.scss'
import * as bootstrap from 'bootstrap'

document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('darkModeToggle');
  
  toggleButton.addEventListener('click', () => {
    const htmlElement = document.documentElement;
    const currentTheme = htmlElement.getAttribute('data-bs-theme');
    
    if (currentTheme === 'dark') {
      htmlElement.setAttribute('data-bs-theme', 'light');
      toggleButton.textContent = 'Enable Dark Mode';
    } else {
      htmlElement.setAttribute('data-bs-theme', 'dark');
      toggleButton.textContent = 'Enable Light Mode';
    }
  });
});