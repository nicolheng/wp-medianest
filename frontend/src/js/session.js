function checkAuthStatus() {
    const userData = localStorage.getItem('user');
    const authButtons = document.getElementById('auth-buttons');
    const profilePlaceholder = document.getElementById('profile-placeholder');
    const navUsername = document.getElementById('nav-username');

    if (userData) {
        const user = JSON.parse(userData);
        
        // 1. Hide Login/Signup, Show Profile Icon
        if (authButtons) authButtons.classList.add('d-none');
        if (profilePlaceholder) {
            profilePlaceholder.classList.remove('d-none');
            profilePlaceholder.classList.add('d-flex');
        }

        // 2. Set the username in the dropdown
        if (navUsername) navUsername.textContent = user.username;
    } else {
        // Logged out: Show Login/Signup, Hide Profile Icon
        if (authButtons) authButtons.classList.remove('d-none');
        if (profilePlaceholder) {
            profilePlaceholder.classList.add('d-none');
            profilePlaceholder.classList.remove('d-flex');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Run this on every page load
    checkAuthStatus();
});

// Global Logout function
window.handleLogout = function() {
    localStorage.removeItem('user'); // Clear "session"
    window.location.href = 'index.html'; // Go home
};