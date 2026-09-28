/**
 * AUTH SERVICE - BAO-CAO-KHANG-THUOC
 * Quản lý xác thực người dùng qua Supabase Auth và phân quyền (Admin, Manager, User, Viewer)
 */

const AuthService = {
  currentUser: null,
  currentProfile: null,
  listeners: [],

  // Mặc định tài khoản thử nghiệm khi chạy offline hoặc demo
  demoUsers: {
    admin: {
      id: 'demo-admin-01',
      email: 'admin.visinh@hospital.vn',
      full_name: 'TS.BS. Nguyễn Văn An (Trưởng khoa)',
      role: 'admin',
      department: 'Khoa Vi sinh'
    },
    manager: {
      id: 'demo-mgr-02',
      email: 'manager.visinh@hospital.vn',
      full_name: 'ThS. Trần Thị Mai (Kỹ thuật viên trưởng)',
      role: 'manager',
      department: 'Khoa Vi sinh'
    },
    user: {
      id: 'demo-usr-03',
      email: 'ktv.visinh@hospital.vn',
      full_name: 'CN. Lê Hoàng Long (Kỹ thuật viên)',
      role: 'user',
      department: 'Khoa Vi sinh'
    },
    viewer: {
      id: 'demo-view-04',
      email: 'bacsi.lamsang@hospital.vn',
      full_name: 'BS. Phạm Minh Tuấn (Bác sĩ Lâm sàng)',
      role: 'viewer',
      department: 'Khoa Hồi sức tích cực (ICU)'
    }
  },

  async init() {
    const sb = window.SupabaseManager?.client;
    if (sb) {
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user) {
          this.currentUser = session.user;
          await this.loadUserProfile(session.user.id);
        } else {
          this.restoreDemoSession();
        }

        // Lắng nghe thay đổi auth từ Supabase
        sb.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            this.currentUser = session.user;
            await this.loadUserProfile(session.user.id);
          } else {
            this.currentUser = null;
            this.currentProfile = null;
            this.restoreDemoSession();
          }
          this.notify();
        });
      } catch (err) {
        console.warn('[AuthService] Supabase session error, using demo session:', err);
        this.restoreDemoSession();
      }
    } else {
      this.restoreDemoSession();
    }
  },

  restoreDemoSession() {
    const savedRole = localStorage.getItem('CURRENT_USER_ROLE') || 'admin';
    this.currentProfile = this.demoUsers[savedRole] || this.demoUsers.admin;
    this.currentUser = {
      id: this.currentProfile.id,
      email: this.currentProfile.email
    };
    this.notify();
  },

  async loadUserProfile(userId) {
    const sb = window.SupabaseManager?.client;
    if (!sb) return;
    try {
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        this.currentProfile = data;
      } else {
        // Fallback profile if profile row does not exist yet
        this.currentProfile = {
          id: userId,
          email: this.currentUser?.email || 'user@lab.vn',
          full_name: this.currentUser?.email?.split('@')[0] || 'Nhân viên Lab',
          role: 'user',
          department: 'Khoa Vi sinh'
        };
      }
    } catch (e) {
      console.warn('[AuthService] Load profile error:', e);
    }
  },

  async login(email, password) {
    const sb = window.SupabaseManager?.client;
    if (sb) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.currentUser = data.user;
      await this.loadUserProfile(data.user.id);
      this.notify();
      return data;
    } else {
      // Demo login
      this.setDemoRole('admin');
      return { user: this.currentUser };
    }
  },

  async logout() {
    const sb = window.SupabaseManager?.client;
    if (sb) {
      await sb.auth.signOut();
    }
    this.currentUser = null;
    this.currentProfile = null;
    localStorage.removeItem('CURRENT_USER_ROLE');
    this.restoreDemoSession();
  },

  // Chuyển đổi vai trò demo nhanh phục vụ kiểm thử phân quyền
  setDemoRole(role) {
    if (this.demoUsers[role]) {
      this.currentProfile = this.demoUsers[role];
      this.currentUser = { id: this.currentProfile.id, email: this.currentProfile.email };
      localStorage.setItem('CURRENT_USER_ROLE', role);
      this.notify();
      console.log(`[AuthService] Switched role to: ${role.toUpperCase()}`);
    }
  },

  getRole() {
    return this.currentProfile?.role || 'viewer';
  },

  getUser() {
    return this.currentUser;
  },

  getProfile() {
    return this.currentProfile;
  },

  hasRole(requiredRoles = []) {
    const current = this.getRole();
    if (current === 'admin') return true; // Admin có toàn quyền
    return requiredRoles.includes(current);
  },

  canUpload() {
    return this.hasRole(['admin', 'manager', 'user']);
  },

  canEditData() {
    return this.hasRole(['admin', 'manager']);
  },

  canDeleteData() {
    return this.hasRole(['admin']);
  },

  canManageUsers() {
    return this.hasRole(['admin']);
  },

  onAuthStateChange(fn) {
    this.listeners.push(fn);
  },

  notify() {
    this.listeners.forEach(fn => fn({
      user: this.currentUser,
      profile: this.currentProfile,
      role: this.getRole()
    }));
  }
};

if (typeof window !== 'undefined') {
  window.AuthService = AuthService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthService };
}
