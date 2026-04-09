// js/session.js
async function checkAuthStatus() {
    const authButtons = document.getElementById('auth-buttons');
    const profilePlaceholder = document.getElementById('profile-placeholder');
    const navUsername = document.getElementById('nav-username');
    
    try {
        const res = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include' // ⚠️ Critical: sends cookies to backend
        });
        
        if (res.ok) {
            const data = await res.json();
            if (data.isAuthenticated && data.user) {
                // ✅ User is logged in
                if (authButtons) authButtons.classList.add('d-none');
                if (profilePlaceholder) {
                    profilePlaceholder.classList.remove('d-none');
                    profilePlaceholder.classList.add('d-flex');
                }
                if (navUsername) navUsername.textContent = data.user.username;
            } else {
                // ❌ Not logged in
                if (authButtons) authButtons.classList.remove('d-none');
                if (profilePlaceholder) {
                    profilePlaceholder.classList.add('d-none');
                    profilePlaceholder.classList.remove('d-flex');
                }
            }
        } else {
            // 401: Not authenticated
            if (authButtons) authButtons.classList.remove('d-none');
            if (profilePlaceholder) {
                profilePlaceholder.classList.add('d-none');
                profilePlaceholder.classList.remove('d-flex');
            }
        }
    } catch (err) {
        console.error('Auth check failed:', err);
        // Fallback: show login buttons
        if (authButtons) authButtons.classList.remove('d-none');
        if (profilePlaceholder) {
            profilePlaceholder.classList.add('d-none');
            profilePlaceholder.classList.remove('d-flex');
        }
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', checkAuthStatus);

// Global Logout function
window.handleLogout = async function() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (err) {
        console.error('Logout failed:', err);
    }
    localStorage.removeItem('user'); // Clean up if any leftover
    window.location.href = 'index.html'; // Redirect + triggers navbar refresh
};