/**
 * AUTH MODAL & PROFILE COMPONENT - BAO-CAO-KHANG-THUOC
 * Xử lý hộp thoại đăng nhập và chuyển đổi vai trò (Role Switcher)
 */

const AuthModal = {
  init() {
    this.bindEvents();
    this.updateUI();
    window.AuthService?.onAuthStateChange(() => this.updateUI());
  },

  bindEvents() {
    // Nút mở modal đăng nhập / profile
    const profileBtn = document.getElementById('btn-user-profile');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        this.openModal();
      });
    }

    // Nút đóng modal
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) this.closeModal();
      });
    });

    // Form đăng nhập
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
          await window.AuthService.login(email, password);
          window.Toast.success('Đăng nhập thành công!');
          this.closeModal();
        } catch (err) {
          window.Toast.error('Đăng nhập thất bại: ' + (err.message || 'Sai thông tin'));
        }
      });
    }

    // Nút đăng xuất
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await window.AuthService.logout();
        window.Toast.info('Đã đăng xuất');
        this.closeModal();
      });
    }

    // Role switcher buttons
    document.querySelectorAll('.btn-role-switch').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.getAttribute('data-role');
        window.AuthService.setDemoRole(role);
        window.Toast.success(`Đã chuyển sang vai trò: ${role.toUpperCase()}`);
        this.closeModal();
      });
    });
  },

  updateUI() {
    const profile = window.AuthService?.getProfile();
    const role = window.AuthService?.getRole() || 'viewer';

    const nameEl = document.getElementById('user-display-name');
    const roleBadgeEl = document.getElementById('user-display-role');

    if (nameEl) nameEl.textContent = profile?.full_name || profile?.email || 'Khách';
    if (roleBadgeEl) {
      roleBadgeEl.textContent = role.toUpperCase();
      roleBadgeEl.className = `role-badge role-${role}`;
    }

    const modalNameEl = document.getElementById('auth-modal-name');
    const modalEmailEl = document.getElementById('auth-modal-email');
    const modalRoleEl = document.getElementById('auth-modal-role');
    if (modalNameEl) modalNameEl.textContent = profile?.full_name || 'Khách';
    if (modalEmailEl) modalEmailEl.textContent = profile?.email || 'Chưa thiết lập';
    if (modalRoleEl) {
      modalRoleEl.textContent = role.toUpperCase();
      modalRoleEl.className = `role-badge role-${role}`;
    }

    // Cập nhật các nút phân quyền trên UI
    document.querySelectorAll('[data-permission]').forEach(el => {
      const required = el.getAttribute('data-permission').split(',');
      if (window.AuthService.hasRole(required)) {
        el.classList.remove('permission-hidden');
      } else {
        el.classList.add('permission-hidden');
      }
    });
  },

  openModal() {
    document.getElementById('modal-auth')?.classList.add('open');
  },

  closeModal() {
    document.getElementById('modal-auth')?.classList.remove('open');
  }
};

if (typeof window !== 'undefined') {
  window.AuthModal = AuthModal;
}
