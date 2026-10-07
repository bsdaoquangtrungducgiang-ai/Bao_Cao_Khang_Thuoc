/**
 * AUTH SERVICE - BAO-CAO-KHANG-THUOC
 * Quản lý xác thực người dùng qua Supabase Auth và phân quyền (Admin, Manager, User, Viewer)
 */

const AuthService = {
  currentUser: null,
  currentProfile: null,
  listeners: [],

  // Danh sách đầy đủ 12 nhân sự khoa Vi sinh - BV Đa khoa Đức Giang
  userList: [
    {
      stt: 1,
      id: 'usr-01',
      full_name: 'Đào Quang Trung',
      title: 'BS.CK2',
      email: 'bsdaoquangtrung@gmail.com',
      role: 'admin',
      role_title: 'Admin (Toàn quyền)',
      department: 'Khoa Vi sinh',
      status: 'active'
    },
    {
      stt: 2,
      id: 'usr-02',
      full_name: 'Chu Thị Huyền',
      title: 'BS.CKI',
      email: 'huyenct1992@gmail.com',
      role: 'manager',
      role_title: 'Manager (Bác sĩ điều trị / Quản lý)',
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
      role: 'manager',
      role_title: 'Manager (Thạc sĩ Xét nghiệm)',
      department: 'Khoa Vi sinh',
      status: 'active'
    },
    {
      stt: 7,
      id: 'usr-07',
      full_name: 'Trần Thị Quy',
      title: 'Thạc Sỹ',
      email: 'quycnsh@gmail.com',
      role: 'manager',
      role_title: 'Manager (Thạc sĩ Xét nghiệm)',
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
      role: 'viewer',
      role_title: 'Viewer (Hộ lý / Chỉ xem)',
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
