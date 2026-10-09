/**
 * NAVIGATION & ROUTING - BAO-CAO-KHANG-THUOC
 * Điều hướng thanh bên Sidebar theo cấu trúc mục XXXIX
 */

const Navigation = {
  currentTab: 'dashboard',
  tabLabels: {
    'dashboard': 'Dashboard Tổng quan Kháng sinh đồ',
    'import_excel': 'Import Dữ liệu Excel / CSV',
    'import_pdf': 'Import PDF Kết quả Xét nghiệm',
    'import_text': 'Import Văn bản / CSV Paste',
    'data_patients': 'Quản lý Dữ liệu Bệnh nhân',
    'data_specimens': 'Quản lý Mẫu Bệnh phẩm',
    'data_cultures': 'Kết quả Nuôi cấy & Định danh',
    'data_ast': 'Dữ liệu Kháng sinh đồ (AST)',
    'analytics_epi': 'Phân tích Dịch tễ học Vi sinh',
    'analytics_resistance': 'Phân tích Tình hình Kháng thuốc',
    'analytics_antibiogram': 'Báo cáo Kháng sinh đồ (Antibiogram)',
    'analytics_heatmap': 'Heatmap Kháng kháng sinh',
    'analytics_mdr': 'Giám sát Vi khuẩn Đa kháng (MDR/XDR/PDR)',
    'analytics_esbl': 'Giám sát Vi khuẩn Tiết ESBL',
    'analytics_carbapenem': 'Giám sát Kháng Carbapenem (CRE/CRAB/CRPA)',
    'analytics_mrsa': 'Giám sát Tụ cầu vàng Kháng Methicillin (MRSA)',
    'reports': 'Báo cáo Dịch tễ & AMR Tự động',
    'data_files': 'Quản lý File & Hạn mức Bộ nhớ (FIFO)',
    'import_history': 'Lịch sử và Nhật ký Import',
    'catalogs': 'Danh mục Hệ thống (Vi khuẩn, Kháng sinh, Khoa)',
    'users': 'Quản lý Người dùng & Phân quyền',
    'audit_logs': 'Nhật ký Hoạt động (Audit Log)',
    'settings': 'Cấu hình Hệ thống & Kết nối Supabase'
  },

  init() {
    this.bindEvents();
    this.restoreTabFromHash();
  },

  bindEvents() {
    // Menu items click
    document.querySelectorAll('.menu-item[data-tab]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.getAttribute('data-tab');
        this.navigateTo(tab);
      });
    });

    // Submenu toggles
    document.querySelectorAll('.menu-group-header').forEach(header => {
      header.addEventListener('click', () => {
        const group = header.closest('.menu-group');
        group.classList.toggle('expanded');
      });
    });

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('mobile-open');
      });
    }

    // Hash change
    window.addEventListener('hashchange', () => {
      this.restoreTabFromHash();
    });
  },

  restoreTabFromHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash && this.tabLabels[hash]) {
      this.navigateTo(hash, false);
    } else {
      this.navigateTo('dashboard', false);
    }
  },

  navigateTo(tabName, updateHash = true) {
    if (!this.tabLabels[tabName]) tabName = 'dashboard';

    // Bảo vệ phân quyền: Chỉ tài khoản Admin mới được truy cập trường Hệ thống
    const systemTabs = ['catalogs', 'users', 'audit_logs', 'settings'];
    if (systemTabs.includes(tabName) && window.AuthService?.getRole() !== 'admin') {
      window.Toast?.error('Truy cập bị từ chối: Khu vực "Hệ thống" chỉ dành riêng cho Quản trị viên (Admin)!');
      if (this.currentTab !== 'dashboard') {
        this.navigateTo('dashboard', true);
      }
      return;
    }

    this.currentTab = tabName;

    if (updateHash) {
      window.location.hash = tabName;
    }

    // Cập nhật trạng thái active trên sidebar
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.querySelector(`.menu-item[data-tab="${tabName}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
      const parentGroup = activeItem.closest('.menu-group');
      if (parentGroup) parentGroup.classList.add('expanded');
    }

    // Ẩn/Hiện nội dung view tương ứng
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const activePanel = document.getElementById(`view-${tabName}`);
    if (activePanel) {
      activePanel.classList.add('active');
    } else {
      // Nếu view chưa có sẵn, hiển thị panel tổng quát
      const genericPanel = document.getElementById('view-generic');
      if (genericPanel) {
        genericPanel.classList.add('active');
        document.getElementById('generic-title').textContent = this.tabLabels[tabName];
      }
    }

    // Cập nhật header title
    const headerTitle = document.getElementById('header-page-title');
    if (headerTitle) {
      headerTitle.textContent = this.tabLabels[tabName];
    }

    // Đóng sidebar trên mobile
    document.getElementById('sidebar')?.classList.remove('mobile-open');

    // Trigger tab-specific refresh
    window.dispatchEvent(new CustomEvent('tabChanged', { detail: { tab: tabName } }));
  }
};

if (typeof window !== 'undefined') {
  window.Navigation = Navigation;
}
