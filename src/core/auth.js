import { API_ROUTES } from '../services/config.js';

document.getElementById('togglePassword')?.addEventListener('click', () => {
    const input = document.getElementById('password');
    const icon = document.getElementById('eyeIcon');
    if (input && icon) {
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        icon.classList.toggle('bi-eye', isHidden);
        icon.classList.toggle('bi-eye-slash', !isHidden);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    const pwHelp = document.getElementById('passwordHelp');

    // show pw and pw check
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const val = passwordInput.value;
            if (pwHelp) val.length > 0 ? pwHelp.classList.remove('d-none') : pwHelp.classList.add('d-none');
            updateRequirement('length-check', val.length >= 6);
            updateRequirement('upper-check', /[A-Z]/.test(val));
        });
    }

    // simplified signup
    window.handleSignup = async function (event) {
        event.preventDefault();
        clearFieldErrors();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;

        // backend handle validation
        handleAuth(`${API_ROUTES.AUTH}/register`, { username, email, password }, "Registration Successful!");
    };

    window.handleLogin = async function (event) {
        event.preventDefault();
        clearFieldErrors();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        handleAuth(`${API_ROUTES.AUTH}/login`, { email, password }, "Welcome back!");
    };
});

function updateRequirement(id, isValid) {
    const el = document.getElementById(id);
    if (!el) return;

    if (isValid) {
        el.classList.replace('text-muted', 'text-success');
        el.style.fontWeight = "bold";
    } else {
        el.classList.replace('text-success', 'text-muted');
        el.style.fontWeight = "normal";
    }
}

function showErrorOnPage(msg) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = msg;
        errorDiv.classList.remove('d-none');
    } else {
        alert(msg);
    }
}

// reusable function to handle the actual 'fetch' call (Mocked for standalone)
async function handleAuth(endpoint, bodyData, successMessage) {
    console.log(`Standalone Auth [${endpoint}]:`, bodyData);
    
    // Simple local validation
    if (endpoint.includes('register')) {
        if (!bodyData.username || !bodyData.email || !bodyData.password) {
            showErrorOnPage("All fields are required.");
            return;
        }
        if (bodyData.password.length < 6) {
            showFieldError('password', "Password must be at least 6 characters.");
            return;
        }
    } else {
        if (!bodyData.email || !bodyData.password) {
            showErrorOnPage("Please enter both email and password.");
            return;
        }
    }

    // Mock successful login: Save user info to localStorage so session.js can pick it up
    const mockUser = {
        username: bodyData.username || bodyData.email.split('@')[0] || 'User',
        email: bodyData.email,
        profilePic: '',
        profile: { bio: 'Standalone User', joinDate: new Date().toISOString() }
    };
    
    localStorage.setItem('medianest_user', JSON.stringify(mockUser));
    
    // Redirect to home page
    window.location.href = "index.html";
}

// shows errors under each input
function showFieldError(field, message) {
    const errorEl = document.getElementById(`${field}Error`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('d-none');
    } else {
        // Fallback to the general error box if specific one isn't found
        showErrorOnPage(message);
    }
}

// clears all errors before a new attempt
function clearFieldErrors() {
    const errorMessages = document.querySelectorAll('.text-danger, #errorMessage');
    errorMessages.forEach(el => {
        el.textContent = '';
        el.classList.add('d-none');
    });
}