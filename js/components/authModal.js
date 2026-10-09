/**
 * AUTH MODAL & LOGIN GATE COMPONENT - BAO-CAO-KHANG-THUOC
 * Xử lý màn hình đăng nhập yêu cầu (Login Gate), phân quyền RBAC và Profile
 */

const AuthModal = {
  init() {
    this.bindEvents();
    this.renderStaffLookupTable();
    this.updateUI();

    // Nếu chưa đăng nhập, hiển thị ngay bảng giao diện yêu cầu đăng nhập
    if (!window.AuthService?.isAuthenticated()) {
      this.showLoginGate();
    }

    window.AuthService?.onAuthStateChange(() => this.updateUI());
  },

  bindEvents() {
    // 1. Submit form đăng nhập từ Login Gate
    const formGate = document.getElementById('form-login-gate');
    if (formGate) {
      formGate.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-gate-username')?.value || '';
        const password = document.getElementById('login-gate-password')?.value || '';
        await this.handleLogin(username, password);
      });
    }

    // 2. Nút toggle ẩn/hiện mật khẩu
    const togglePwBtn = document.getElementById('btn-toggle-gate-pw');
    if (togglePwBtn) {
      togglePwBtn.addEventListener('click', () => {
        const pwInput = document.getElementById('login-gate-password');
        const eyeIcon = document.getElementById('icon-gate-pw-eye');
        if (pwInput) {
          const isPassword = pwInput.type === 'password';
          pwInput.type = isPassword ? 'text' : 'password';
          if (eyeIcon) {
            eyeIcon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
          }
        }
      });
    }

    // 3. Các nút chọn nhanh tài khoản kiểm thử 1-Click
    const btnQuickAdmin = document.getElementById('btn-gate-quick-admin');
    if (btnQuickAdmin) {
      btnQuickAdmin.addEventListener('click', () => {
        this.fillAndLogin('bsdaoquangtrung@gmail.com', 'Admin');
      });
    }

    const btnQuickUser = document.getElementById('btn-gate-quick-user');
    if (btnQuickUser) {
      btnQuickUser.addEventListener('click', () => {
        this.fillAndLogin('vutrangbvdg@gmail.com', 'User');
      });
    }

    const btnQuickGuest = document.getElementById('btn-gate-quick-guest');
    if (btnQuickGuest) {
      btnQuickGuest.addEventListener('click', () => {
        this.fillAndLogin('User', 'User');
      });
    }

    // 4. Mở rộng / thu gọn danh sách tra cứu 12 nhân viên
    const btnToggleLookup = document.getElementById('btn-toggle-staff-lookup');
    if (btnToggleLookup) {
      btnToggleLookup.addEventListener('click', () => {
        const container = document.getElementById('staff-lookup-container');
        if (container) {
          const isHidden = container.style.display === 'none';
          container.style.display = isHidden ? 'block' : 'none';
          btnToggleLookup.innerHTML = isHidden
            ? '<i class="fa-solid fa-chevron-up"></i> Thu gọn danh sách nhân sự'
            : '<i class="fa-solid fa-address-book"></i> Tra cứu Gmail cả 12 nhân sự Khoa Vi sinh';
        }
      });
    }

    // 5. Nút mở Profile khi bấm vào Avatar ở header
    const profileBtn = document.getElementById('btn-user-profile');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        if (window.AuthService?.isAuthenticated()) {
          this.openProfileModal();
        } else {
          this.showLoginGate();
        }
      });
    }

    // 6. Nút Đăng xuất nhanh ở Header & Modal
    const handleLogout = async () => {
      await window.AuthService?.logout();
      window.Toast?.info('Đã đăng xuất khỏi hệ thống');
      this.closeProfileModal();
      // Nếu đang ở trang Hệ thống, chuyển về Dashboard
      const currentTab = window.Navigation?.currentTab;
      if (['catalogs', 'users', 'audit_logs', 'settings'].includes(currentTab)) {
        window.Navigation?.navigateTo('dashboard');
      }
      this.showLoginGate();
    };

    document.getElementById('btn-quick-logout')?.addEventListener('click', handleLogout);
    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);

    // 7. Đóng modal profile
    document.querySelectorAll('#modal-auth .modal-close, #modal-auth.modal-backdrop').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) this.closeProfileModal();
      });
    });

    // 8. Chuyển đổi vai trò nhanh trong Profile modal
    document.querySelectorAll('.btn-role-switch').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.getAttribute('data-role');
        window.AuthService?.setDemoRole(role);
        window.Toast?.success(`Đã chuyển vai trò: ${role.toUpperCase()}`);
        this.closeProfileModal();
      });
    });
  },

  async handleLogin(username, password) {
    const errorBox = document.getElementById('login-gate-error');
    const errorText = document.getElementById('login-gate-error-text');

    try {
      if (errorBox) errorBox.style.display = 'none';

      const res = await window.AuthService.login(username, password);
      const profile = res.profile || window.AuthService.getProfile();
      const role = window.AuthService.getRole();

      window.Toast?.success(`Chào mừng ${profile.full_name || profile.email} (${role.toUpperCase()})!`);
      this.hideLoginGate();

      // Cập nhật phân quyền và điều hướng an toàn
      this.updateUI();

      // Nếu tab hiện tại là hệ thống mà user không phải admin, trở về dashboard
      if (role !== 'admin' && ['catalogs', 'users', 'audit_logs', 'settings'].includes(window.Navigation?.currentTab)) {
        window.Navigation?.navigateTo('dashboard');
      }
    } catch (err) {
      if (errorBox && errorText) {
        errorText.textContent = err.message || 'Sai thông tin đăng nhập!';
        errorBox.style.display = 'flex';
      }
      window.Toast?.error(err.message || 'Đăng nhập thất bại!');
    }
  },

  async fillAndLogin(username, password) {
    const uInput = document.getElementById('login-gate-username');
    const pInput = document.getElementById('login-gate-password');
    if (uInput) uInput.value = username;
    if (pInput) pInput.value = password;
    await this.handleLogin(username, password);
  },

  renderStaffLookupTable() {
    const tbody = document.getElementById('staff-lookup-tbody');
    if (!tbody) return;

    const staffList = window.AuthService?.getUserList() || [];
    tbody.innerHTML = '';

    staffList.forEach(s => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #f1f5f9';
      const roleText = s.role === 'admin' ? 'Admin' : 'User';
      const roleColor = s.role === 'admin' ? '#dc2626' : '#0284c7';
      const pwHint = s.role === 'admin' ? 'Admin' : 'User';

      tr.innerHTML = `
        <td style="padding: 5px; text-align: center; font-weight: 600;">${s.stt}</td>
        <td style="padding: 5px;"><strong>${s.full_name}</strong> <small style="color: #64748b;">(${s.title})</small></td>
        <td style="padding: 5px; font-family: monospace; color: #0f172a;">${s.email}</td>
        <td style="padding: 5px; text-align: center;"><span style="color: ${roleColor}; font-weight: 700;">${roleText}</span></td>
        <td style="padding: 5px; text-align: center;">
          <button type="button" class="btn-select-staff-row" data-email="${s.email}" data-pw="${pwHint}" style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
            Chọn
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-select-staff-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.getAttribute('data-email');
        const pw = btn.getAttribute('data-pw');
        this.fillAndLogin(email, pw);
      });
    });
  },

  updateUI() {
    const profile = window.AuthService?.getProfile();
    const role = window.AuthService?.getRole() || 'viewer';
    const isAuth = window.AuthService?.isAuthenticated();

    // 1. Header Display
    const nameEl = document.getElementById('user-display-name');
    const roleBadgeEl = document.getElementById('user-display-role');
    const avatarEl = document.getElementById('user-display-avatar');
    const quickLogoutBtn = document.getElementById('btn-quick-logout');

    if (nameEl) {
      nameEl.textContent = isAuth ? (profile?.full_name || profile?.email || 'Người dùng') : 'Chưa đăng nhập';
    }
    if (roleBadgeEl) {
      if (isAuth) {
        roleBadgeEl.textContent = role.toUpperCase();
        roleBadgeEl.className = `role-badge role-${role}`;
      } else {
        roleBadgeEl.textContent = 'LOGIN';
        roleBadgeEl.className = 'role-badge role-viewer';
      }
    }
    if (avatarEl) {
      if (role === 'admin') {
        avatarEl.innerHTML = '<i class="fa-solid fa-user-doctor"></i>';
      } else {
        avatarEl.innerHTML = '<i class="fa-solid fa-user"></i>';
      }
    }
    if (quickLogoutBtn) {
      quickLogoutBtn.style.display = isAuth ? 'inline-flex' : 'none';
    }

    // 2. Profile Modal Elements
    const modalNameEl = document.getElementById('auth-modal-name');
    const modalEmailEl = document.getElementById('auth-modal-email');
    const modalRoleEl = document.getElementById('auth-modal-role');
    const modalPermText = document.getElementById('auth-modal-permission-text');

    if (modalNameEl) modalNameEl.textContent = profile?.full_name || 'Khách';
    if (modalEmailEl) modalEmailEl.textContent = profile?.email || 'User';
    if (modalRoleEl) {
      modalRoleEl.textContent = role.toUpperCase();
      modalRoleEl.className = `role-badge role-${role}`;
    }
    if (modalPermText) {
      if (role === 'admin') {
        modalPermText.textContent = 'Tài khoản Quản trị viên (Admin) được toàn quyền truy cập mọi tính năng và cấu hình trường Hệ thống.';
      } else {
        modalPermText.textContent = 'Tài khoản Nhân viên / Khách được khai thác dữ liệu, kháng sinh đồ và báo cáo; Trường Hệ thống được bảo vệ và ẩn.';
      }
    }

    // 3. Phân quyền trên Sidebar và UI (data-permission="admin")
    document.querySelectorAll('[data-permission]').forEach(el => {
      const required = el.getAttribute('data-permission').split(',').map(s => s.trim());
      if (isAuth && window.AuthService.hasRole(required)) {
        el.classList.remove('permission-hidden');
      } else {
        el.classList.add('permission-hidden');
      }
    });
  },

  showLoginGate() {
    const modal = document.getElementById('modal-login-gate');
    if (modal) {
      modal.classList.add('open');
      const errorBox = document.getElementById('login-gate-error');
      if (errorBox) errorBox.style.display = 'none';
      setTimeout(() => {
        document.getElementById('login-gate-username')?.focus();
      }, 100);
    }
  },

  hideLoginGate() {
    document.getElementById('modal-login-gate')?.classList.remove('open');
  },

  openProfileModal() {
    document.getElementById('modal-auth')?.classList.add('open');
  },

  closeProfileModal() {
    document.getElementById('modal-auth')?.classList.remove('open');
  },

  // Backward compatibility
  openModal() {
    if (window.AuthService?.isAuthenticated()) {
      this.openProfileModal();
    } else {
      this.showLoginGate();
    }
  },

  closeModal() {
    this.closeProfileModal();
    this.hideLoginGate();
  }
};

if (typeof window !== 'undefined') {
  window.AuthModal = AuthModal;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthModal };
}
