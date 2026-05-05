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
        handleAuth('/api/auth/register', { username, email, password }, "Registration Successful!");
    };

    window.handleLogin = async function (event) {
        event.preventDefault();
        clearFieldErrors();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        handleAuth('/api/auth/login', { email, password }, "Welcome back!");
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

// reusable function to handle the actual 'fetch' call
async function handleAuth(endpoint, bodyData, successMessage) {
    try {
        const response = await fetch(`${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData),
            credentials: 'include'
        });

        // SAFETY CHECK: If response is empty, don't try to parse JSON
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (response.ok && data.success) {
            window.location.href = "index.html";
        } else {
            const rawMessage = String(data.message || 'Registration failed.');
            if (endpoint.includes('register')) {
                if (rawMessage.includes("All fields are required")) {
                    showErrorOnPage(rawMessage);
                } else if (rawMessage.includes("Password must")) {
                    showFieldError('password', rawMessage);
                } else if (rawMessage.includes("Email already exists")) {
                    showFieldError('email', rawMessage);
                } else if (rawMessage.includes("valid email")) {
                    showFieldError('email', 'Please enter a valid email address.');
                } else {
                    showErrorOnPage(rawMessage);
                }
            } else {
                showFieldError('password', 'The username or password is incorrect.');
            }
        }
    } catch (err) {
        console.error("Auth Error:", err);
        if (endpoint.includes('register')) {
            showErrorOnPage('Unable to connect to the registration server. Please make sure the backend is running.');
        } else {
            alert("Server connection failed.");
        }
    }
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