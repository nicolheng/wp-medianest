import { fetchFullLibrary } from '../services/libraryApi.js';

export async function checkAuthStatus() {
    const authButtons = document.getElementById('auth-buttons');
    const profilePlaceholder = document.getElementById('profile-placeholder');
    const navUsername = document.getElementById('nav-username');

    // 1. Check LocalStorage First (Standalone Mode)
    const localUser = localStorage.getItem('medianest_user');
    if (localUser) {
        try {
            const user = JSON.parse(localUser);
            window.currentUser = user;
            if (authButtons) authButtons.classList.add('d-none');
            if (profilePlaceholder) {
                profilePlaceholder.classList.remove('d-none');
                profilePlaceholder.classList.add('d-flex');
            }
            updateNavProfile(user);
            if (navUsername) navUsername.textContent = user.username;
            return; // Successfully "logged in" locally
        } catch (e) {
            console.error("Failed to parse local user", e);
        }
    }

    try {
        const res = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include' // sends cookies to backend
        });

        if (res.ok) {
            const data = await res.json();
            if (data.isAuthenticated && data.user) {
                window.currentUser = data.user;
                // User is logged in
                if (authButtons) authButtons.classList.add('d-none');
                if (profilePlaceholder) {
                    profilePlaceholder.classList.remove('d-none');
                    profilePlaceholder.classList.add('d-flex');
                }

                updateNavProfile(data.user);

                if (navUsername) navUsername.textContent = data.user.username;
            } else {
                handleNoAuth(authButtons, profilePlaceholder);
            }
        } else {
            handleNoAuth(authButtons, profilePlaceholder);
        }
    } catch (err) {
        console.warn('Backend not detected, using guest session:', err);
        // Standalone mode: Mock a guest user for navigation purposes
        window.currentUser = {
            username: 'Guest',
            email: 'guest@example.com',
            profilePic: '',
            profile: { bio: 'Standalone Frontend Mode', joinDate: new Date().toISOString() }
        };
        
        if (authButtons) authButtons.classList.add('d-none');
        if (profilePlaceholder) {
            profilePlaceholder.classList.remove('d-none');
            profilePlaceholder.classList.add('d-flex');
        }
        updateNavProfile(window.currentUser);
    }
}

function handleNoAuth(authButtons, profilePlaceholder) {
    if (authButtons) authButtons.classList.remove('d-none');
    if (profilePlaceholder) {
        profilePlaceholder.classList.add('d-none');
        profilePlaceholder.classList.remove('d-flex');
    }
}

// Global Logout function
window.handleLogout = async function () {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (err) {
        // Ignore errors in standalone
    }
    window.currentUser = null;
    window.userLibrary = null;
    localStorage.removeItem('medianest_user'); // Clear standalone user
    localStorage.removeItem('user');
    localStorage.removeItem('watchlist');
    localStorage.removeItem('history');
    window.location.href = 'index.html'; // Redirect + triggers navbar refresh
};

const updateNavProfile = (user) => {
    const navPic = document.getElementById('nav-profile-pic');
    const navUsername = document.getElementById('nav-username'); // Standardized name
    const placeholder = document.getElementById('profile-placeholder');

    if (user && placeholder) {
        const icon = placeholder.querySelector('.bi-person-circle');
        if (icon) icon.classList.add('d-none');

        const name = user.username || 'User';
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=fadb5f&color=000&bold=true&length=1`;

        if (navPic) {
            navPic.src = user.profilePic || avatarUrl;
            navPic.classList.remove('d-none');
        }

        if (navUsername) {
            navUsername.textContent = name;
            navUsername.classList.remove('d-none');
        }
        placeholder.classList.remove('d-none');
        placeholder.classList.add('d-flex');
    }
};

export async function initUserSession({ requireAuth = false, redirectUrl = 'login.html' } = {}) {
    await checkAuthStatus();

    if (requireAuth && !window.currentUser) {
        window.location.href = redirectUrl;
        return false;
    }

    if (window.currentUser) {
        try {
            await fetchFullLibrary();
        } catch (err) {
            console.warn("Could not sync library, operating in offline mode.");
        }
    }
    return true;
}