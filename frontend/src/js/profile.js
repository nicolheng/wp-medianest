import '../scss/style.scss';
import * as bootstrap from 'bootstrap';

// ─── Mock User Data ────────────────────────────────────────────────────────────
const currentUser = {
  name: 'Alex Rivera',
  username: 'alexrivera',
  email: 'alex.rivera@example.com',
  bio: 'Movie buff, bookworm, and music enthusiast. Always hunting for the next great story.',
  joinDate: 'January 12, 2024',
};

// ─── Theme Toggle (mirrors main.js logic) ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  const updateButtonUI = (theme) => {
    if (!themeToggleBtn || !themeIcon) return;
    themeIcon.classList.remove('bi-moon-stars-fill', 'bi-sun-fill');
    themeIcon.classList.add(theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars-fill');
  };

  const getPreferredTheme = () => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const initialTheme = getPreferredTheme();
  htmlEl.setAttribute('data-bs-theme', initialTheme);
  updateButtonUI(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const newTheme = htmlEl.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
      htmlEl.setAttribute('data-bs-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateButtonUI(newTheme);
    });
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const sys = e.matches ? 'dark' : 'light';
      htmlEl.setAttribute('data-bs-theme', sys);
      updateButtonUI(sys);
    }
  });

  // ─── Populate Profile View ─────────────────────────────────────────────────
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('view-name', currentUser.name);
  set('view-username', `@${currentUser.username}`);
  set('view-email', currentUser.email);
  set('view-bio', currentUser.bio || '—');
  set('view-join-date', currentUser.joinDate);
  set('sidebar-name', currentUser.name);
  set('sidebar-username', `@${currentUser.username}`);

  // Pre-fill edit modal fields
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };
  setVal('edit-name', currentUser.name);
  setVal('edit-email', currentUser.email);
  setVal('edit-bio', currentUser.bio);

  // ─── Sidebar Nav Active State ──────────────────────────────────────────────
  document.querySelectorAll('.profile-nav-link[data-section]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.profile-nav-link').forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
      const target = document.getElementById(link.dataset.section);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ─── Edit Profile Modal ────────────────────────────────────────────────────
  const editForm = document.getElementById('edit-profile-form');
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      editForm.classList.add('was-validated');
      if (!editForm.checkValidity()) return;

      const data = {
        name: document.getElementById('edit-name').value.trim(),
        email: document.getElementById('edit-email').value.trim(),
        bio: document.getElementById('edit-bio').value.trim(),
      };

      // Update mock state & UI
      Object.assign(currentUser, data);
      set('view-name', data.name);
      set('view-email', data.email);
      set('view-bio', data.bio || '—');
      set('sidebar-name', data.name);

      console.log('[MediaNest] Edit Profile →', JSON.stringify(data, null, 2));

      const modalEl = document.getElementById('editProfileModal');
      bootstrap.Modal.getInstance(modalEl)?.hide();
      editForm.classList.remove('was-validated');
      showToast('Profile updated successfully!', 'success');
    });
  }

  // Reset validation when modal is hidden
  document.getElementById('editProfileModal')?.addEventListener('hidden.bs.modal', () => {
    editForm?.classList.remove('was-validated');
  });

  // ─── Change Password Modal ─────────────────────────────────────────────────
  const pwdForm = document.getElementById('change-pwd-form');
  if (pwdForm) {
    pwdForm.addEventListener('submit', (e) => {
      e.preventDefault();
      pwdForm.classList.add('was-validated');
      if (!pwdForm.checkValidity()) return;

      const currentPwd = document.getElementById('current-pwd').value;
      const newPwd = document.getElementById('new-pwd').value;
      const confirmPwd = document.getElementById('confirm-pwd').value;

      const confirmInput = document.getElementById('confirm-pwd');
      if (newPwd !== confirmPwd) {
        confirmInput.setCustomValidity('Passwords do not match.');
        pwdForm.classList.add('was-validated');
        return;
      }
      confirmInput.setCustomValidity('');

      const data = { currentPassword: currentPwd, newPassword: newPwd };
      console.log('[MediaNest] Change Password →', JSON.stringify(data, null, 2));

      const modalEl = document.getElementById('changePasswordModal');
      bootstrap.Modal.getInstance(modalEl)?.hide();
      pwdForm.reset();
      pwdForm.classList.remove('was-validated');
      showToast('Password changed successfully!', 'success');
    });

    // Clear confirm mismatch error on re-type
    document.getElementById('confirm-pwd')?.addEventListener('input', () => {
      document.getElementById('confirm-pwd').setCustomValidity('');
    });
  }

  document.getElementById('changePasswordModal')?.addEventListener('hidden.bs.modal', () => {
    pwdForm?.reset();
    pwdForm?.classList.remove('was-validated');
  });

  // ─── Show / Hide Password Toggles ─────────────────────────────────────────
  document.querySelectorAll('.btn-show-pwd').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.toggle('bi-eye', !isPassword);
        icon.classList.toggle('bi-eye-slash', isPassword);
      }
    });
  });

  // ─── Delete Account Modal ──────────────────────────────────────────────────
  const deleteInput = document.getElementById('delete-confirm-input');
  const deleteBtn = document.getElementById('confirm-delete-btn');

  if (deleteInput && deleteBtn) {
    deleteInput.addEventListener('input', () => {
      deleteBtn.disabled = deleteInput.value !== 'DELETE';
    });

    deleteBtn.addEventListener('click', () => {
      const data = { action: 'DELETE_ACCOUNT', username: currentUser.username };
      console.log('[MediaNest] Delete Account →', JSON.stringify(data, null, 2));

      const modalEl = document.getElementById('deleteAccountModal');
      bootstrap.Modal.getInstance(modalEl)?.hide();
      showToast('Account deletion requested. Goodbye! 👋', 'danger');
    });
  }

  // Reset delete input when modal is hidden
  document.getElementById('deleteAccountModal')?.addEventListener('hidden.bs.modal', () => {
    if (deleteInput) deleteInput.value = '';
    if (deleteBtn) deleteBtn.disabled = true;
  });
});

// ─── Toast Helper ──────────────────────────────────────────────────────────────
function showToast(message, variant = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const id = `toast-${Date.now()}`;
  const toastEl = document.createElement('div');
  toastEl.id = id;
  toastEl.className = `toast align-items-center text-bg-${variant} border-0`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body fw-semibold">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;

  container.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}
