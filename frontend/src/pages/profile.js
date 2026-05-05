import '../core/globals.js';
import { initUserSession } from '../core/session.js';

let currentUser = null;

const formatMemberSince = (dateValue) => {
  if (!dateValue) return '—';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const asDisplayName = (user) => {
  return user.profile?.displayName || user.username || 'User';
};

const setText = (id, value) => {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
};

const setValue = (id, value) => {
  const el = document.getElementById(id);
  if (el) el.value = value;
};

const renderProfile = (user) => {
  const username = user.username || 'user';
  const displayName = asDisplayName(user);
  const bio = user.profile?.bio?.trim() || '—';
  const memberSince = formatMemberSince(user.profile?.joinDate || user.createdAt);

  setText('view-name', displayName);
  setText('view-username', `@${username}`);
  setText('view-email', user.email || '—');
  setText('view-bio', bio);
  setText('view-join-date', memberSince);
  setText('sidebar-name', displayName);
  setText('sidebar-username', `@${username}`);

  setValue('edit-name', displayName);
  setValue('edit-username', username);
  setValue('edit-email', user.email || '');
  setValue('edit-bio', user.profile?.bio || '');

  const sidebarAvatarContainer = document.querySelector('.profile-avatar');
  if (sidebarAvatarContainer) {
    const name = user.username || 'User';
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=fadb5f&color=000&bold=true&length=1`;

    sidebarAvatarContainer.innerHTML = `
            <img src="${avatarUrl}" 
                 alt="${name}" 
                 class="rounded-circle shadow" 
                 style="width: 120px; height: 120px; object-fit: cover; border: 4px solid #fadb5f;">
        `;
  }

};

document.addEventListener('DOMContentLoaded', async () => {
  const isAuth = await initUserSession({ requireAuth: true });
  if (!isAuth) return;

  currentUser = window.currentUser;
  renderProfile(currentUser);

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
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      editForm.classList.add('was-validated');
      if (!editForm.checkValidity()) return;

      const data = {
        username: document.getElementById('edit-username').value.trim(),
        email: document.getElementById('edit-email').value.trim(),
        profile: {
          bio: document.getElementById('edit-bio').value.trim(),
        },
      };

      try {
        const response = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        });

        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || 'Unable to update profile.');
        }

        currentUser = payload.user;
        renderProfile(currentUser);
      } catch (err) {
        showToast(err.message || 'Unable to update profile.', 'danger');
        return;
      }

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
        icon.classList.toggle('bi-eye', isPassword);
        icon.classList.toggle('bi-eye-slash', !isPassword);
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
      const data = { action: 'DELETE_ACCOUNT', username: currentUser?.username || '' };
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
