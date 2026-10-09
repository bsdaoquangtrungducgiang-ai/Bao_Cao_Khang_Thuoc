/**
 * AUTH SERVICE - BAO-CAO-KHANG-THUOC
 * Quản lý xác thực người dùng qua Supabase Auth và phân quyền (Admin, Manager, User, Viewer)
 */

const AuthService = {
  currentUser: null,
  currentProfile: null,
  listeners: [],

  // Danh sách đầy đủ 12 nhân sự khoa Vi sinh - BV Đa khoa Đức Giang (1 Admin duy nhất, 11 User)
  userList: [
    {
      stt: 1,
      id: 'usr-01',
      full_name: 'Đào Quang Trung',
      title: 'BS.CK2',
      email: 'bsdaoquangtrung@gmail.com',
      role: 'admin',
      role_title: 'Admin (Toàn quyền / Quản trị hệ thống)',
      department: 'Khoa Vi sinh',
      status: 'active'
    },
    {
      stt: 2,
      id: 'usr-02',
      full_name: 'Chu Thị Huyền',
      title: 'BS.CKI',
      email: 'huyenct1992@gmail.com',
      role: 'user',
      role_title: 'User (Bác sĩ điều trị)',
      department: 'Khoa Vi sinh',
      status: 'active'
    },
    {
      stt: 3,
      id: 'usr-03',
      full_name: 'Vũ Thị Thu Trang',
      title: 'CN.XN',
      email: 'vutrangbvdg@gmail.com',
      role: 'user',
      role_title: 'User (Cử nhân Xét nghiệm)',
      department: 'Khoa Vi sinh',
      status: 'active'
    },
    {
      stt: 4,
      id: 'usr-04',
      full_name: 'Nguyễn Ngọc Linh',
      title: 'CN.XN',
      email: 'linh30011987@gmail.com',
      role: 'user',
      role_title: 'User (Cử nhân Xét nghiệm)',
      department: 'Khoa Vi sinh',
      status: 'active'
    },
    {
      stt: 5,
      id: 'usr-05',
      full_name: 'Đỗ Quốc Hưng',
      title: 'CN.XN',
      email: 'batqua3@gmail.com',
      role: 'user',
      role_title: 'User (Cử nhân Xét nghiệm)',
      department: 'Khoa Vi sinh',
      status: 'active'
    },
    {
      stt: 6,
      id: 'usr-06',
      full_name: 'Trần Thúy Liên',
      title: 'Thạc Sỹ',
      email: 'tranthuyliench22@gmail.com',
      role: 'user',
      role_title: 'User (Thạc sĩ Xét nghiệm)',
      department: 'Khoa Vi sinh',
      status: 'active'
    },
    {
      stt: 7,
      id: 'usr-07',
      full_name: 'Trần Thị Quy',
      title: 'Thạc Sỹ',
      email: 'quycnsh@gmail.com',
      role: 'user',
      role_title: 'User (Thạc sĩ Xét nghiệm)',
      department: 'Khoa Vi sinh',
      status: 'active'
    },
    {
      stt: 8,
      id: 'usr-08',
      full_name: 'Nguyễn Thị Kim Loan',
      title: 'KTV – CĐ',
      email: 'Kimloannguyen18977@gmail.com',
      role: 'user',
      role_title: 'User (Kỹ thuật viên Cao đẳng)',
      department: 'Khoa Vi sinh',
      status: 'active'
    },
    {
      stt: 9,
      id: 'usr-09',
      full_name: 'Nghiêm Thị Làn',
      title: 'KTV – CĐ',
      email: 'chilanhn82@gmail.com',
      role: 'user',
      role_title: 'User (Kỹ thuật viên Cao đẳng)',
      department: 'Khoa Vi sinh',
      status: 'active'
    },
    {
      stt: 10,
      id: 'usr-10',
      full_name: 'Trần Thanh Bình',
      title: 'KTV – CĐ',
      email: 'T.bjnho2@gmail.com',
      role: 'user',
      role_title: 'User (Kỹ thuật viên Cao đẳng)',
      department: 'Khoa Vi sinh',
      status: 'active'
    },
    {
      stt: 11,
      id: 'usr-11',
      full_name: 'Nguyễn Duy Dũng',
      title: 'KTV – CĐ',
      email: 'nguyendungyk87@gmail.com',
      role: 'user',
      role_title: 'User (Kỹ thuật viên Cao đẳng)',
      department: 'Khoa Vi sinh',
      status: 'active'
    },
    {
      stt: 12,
      id: 'usr-12',
      full_name: 'Nguyễn Thị Lan',
      title: 'Hộ Lý',
      email: 'nhim01011983@gmail.com',
      role: 'user',
      role_title: 'User (Hộ lý)',
      department: 'Khoa Vi sinh',
      status: 'active'
    }
  ],

  // Mặc định tài khoản thử nghiệm khi chạy offline hoặc demo (theo 4 vai trò chính)
  demoUsers: {
    admin: {
      id: 'usr-01',
      email: 'bsdaoquangtrung@gmail.com',
      full_name: 'BS.CK2. Đào Quang Trung (Lãnh đạo / Trưởng khoa)',
      title: 'BS.CK2',
      role: 'admin',
      department: 'Khoa Vi sinh'
    },
    manager: {
      id: 'usr-02',
      email: 'huyenct1992@gmail.com',
      full_name: 'BS.CKI. Chu Thị Huyền (Bác sĩ điều trị)',
      title: 'BS.CKI',
      role: 'manager',
      department: 'Khoa Vi sinh'
    },
    user: {
      id: 'usr-03',
      email: 'vutrangbvdg@gmail.com',
      full_name: 'CN.XN. Vũ Thị Thu Trang (Cử nhân Xét nghiệm)',
      title: 'CN.XN',
      role: 'user',
      department: 'Khoa Vi sinh'
    },
    viewer: {
      id: 'usr-12',
      email: 'nhim01011983@gmail.com',
      full_name: 'Nguyễn Thị Lan (Hộ lý)',
      title: 'Hộ Lý',
      role: 'viewer',
      department: 'Khoa Vi sinh'
    }
  },

  getUserList() {
    return this.userList;
  },

  isAuthenticated() {
    return !!(this.currentUser && this.currentProfile);
  },

  async init() {
    const saved = localStorage.getItem('AUTH_LOGGED_IN_USER');
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        if (profile && profile.email) {
          this.currentProfile = profile;
          this.currentUser = { id: profile.id, email: profile.email };
          this.notify();
          return;
        }
      } catch (err) {
        console.warn('[AuthService] Parse saved session error:', err);
      }
    }

    const sb = window.SupabaseManager?.client;
    if (sb) {
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user) {
          this.currentUser = session.user;
          await this.loadUserProfile(session.user.id);
          this.notify();
          return;
        }
      } catch (err) {
        console.warn('[AuthService] Supabase session check error:', err);
      }
    }

    // Mặc định chưa đăng nhập
    this.currentUser = null;
    this.currentProfile = null;
    this.notify();
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

  login(usernameOrEmail, password) {
    if (!usernameOrEmail || !password) {
      throw new Error('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!');
    }

    const u = String(usernameOrEmail).trim().toLowerCase();
    const p = String(password).trim().toLowerCase();

    // 1. Tài khoản KHÁCH (User / User)
    if (u === 'user' || u === 'khach' || u === 'guest') {
      if (p === 'user') {
        const guestProfile = {
          stt: 0,
          id: 'usr-guest',
          full_name: 'Khách Trải Nghiệm (Guest)',
          title: 'Khách',
          email: 'User',
          role: 'user',
          role_title: 'User (Khách vãng lai)',
          department: 'Khách tham quan',
          status: 'active'
        };
        this.currentUser = { id: guestProfile.id, email: guestProfile.email };
        this.currentProfile = guestProfile;
        localStorage.setItem('AUTH_LOGGED_IN_USER', JSON.stringify(guestProfile));
        localStorage.setItem('CURRENT_USER_ROLE', 'user');
        this.notify();
        return Promise.resolve({ user: this.currentUser, profile: this.currentProfile });
      } else {
        throw new Error('Mật khẩu tài khoản Khách không đúng! Vui lòng nhập mật khẩu là "User".');
      }
    }

    // 2. Tài khoản ADMIN DUY NHẤT: bsdaoquangtrung@gmail.com
    if (u === 'bsdaoquangtrung@gmail.com' || u === 'admin') {
      if (p === 'admin' || p === 'amind') {
        const adminProfile = this.userList.find(x => x.stt === 1) || this.demoUsers.admin;
        this.currentUser = { id: adminProfile.id, email: adminProfile.email };
        this.currentProfile = adminProfile;
        localStorage.setItem('AUTH_LOGGED_IN_USER', JSON.stringify(adminProfile));
        localStorage.setItem('CURRENT_USER_ROLE', 'admin');
        this.notify();
        return Promise.resolve({ user: this.currentUser, profile: this.currentProfile });
      } else {
        throw new Error('Mật khẩu Quản trị viên không chính xác! Mật khẩu cho tài khoản Admin là "Admin".');
      }
    }

    // 3. Tài khoản NHÂN VIÊN Y TẾ (11 nhân viên còn lại, mật khẩu là "User")
    const matchedStaff = this.userList.find(x => (x.email || '').trim().toLowerCase() === u);
    if (matchedStaff) {
      if (p === 'user') {
        this.currentUser = { id: matchedStaff.id, email: matchedStaff.email };
        this.currentProfile = matchedStaff;
        localStorage.setItem('AUTH_LOGGED_IN_USER', JSON.stringify(matchedStaff));
        localStorage.setItem('CURRENT_USER_ROLE', 'user');
        this.notify();
        return Promise.resolve({ user: this.currentUser, profile: this.currentProfile });
      } else {
        throw new Error(`Mật khẩu không chính xác! Mật khẩu cho nhân sự (${matchedStaff.full_name}) là vai trò: "User".`);
      }
    }

    // 4. Fallback với Supabase Auth nếu có cấu hình
    const sb = window.SupabaseManager?.client;
    if (sb) {
      return sb.auth.signInWithPassword({ email: usernameOrEmail, password }).then(({ data, error }) => {
        if (error) throw error;
        this.currentUser = data.user;
        return this.loadUserProfile(data.user.id).then(() => {
          localStorage.setItem('AUTH_LOGGED_IN_USER', JSON.stringify(this.currentProfile));
          localStorage.setItem('CURRENT_USER_ROLE', this.getRole());
          this.notify();
          return data;
        });
      });
    }

    throw new Error('Tên đăng nhập không tồn tại! Vui lòng nhập Gmail trong danh sách nhân viên hoặc tài khoản "User".');
  },

  async logout() {
    const sb = window.SupabaseManager?.client;
    if (sb) {
      try { await sb.auth.signOut(); } catch (e) {}
    }
    this.currentUser = null;
    this.currentProfile = null;
    localStorage.removeItem('AUTH_LOGGED_IN_USER');
    localStorage.removeItem('CURRENT_USER_ROLE');
    this.notify();
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
