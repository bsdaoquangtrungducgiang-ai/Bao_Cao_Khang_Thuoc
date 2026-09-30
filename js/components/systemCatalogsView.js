/**
 * SYSTEM CATALOGS, AUDIT & SETTINGS COMPONENT - BAO-CAO-KHANG-THUOC
 * Quản lý Danh mục (Mục LVI), Lịch sử Import (Mục XXXIII), Audit Log (Mục XXXV) và Settings
 */

const SystemCatalogsView = {
  init() {
    this.bindEvents();
    window.addEventListener('tabChanged', (e) => {
      const tab = e.detail.tab;
      if (tab === 'import_history') this.renderImportHistory();
      else if (tab === 'catalogs') this.renderCatalogs();
      else if (tab === 'users') this.renderUsers();
      else if (tab === 'audit_logs') this.renderAuditLogs();
      else if (tab === 'settings') this.renderSettings();
    });
  },

  bindEvents() {
    // Lưu cài đặt kết nối Supabase
    const formSettings = document.getElementById('form-settings-connection');
    if (formSettings) {
      formSettings.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = document.getElementById('settings-supabase-url').value.trim();
        const key = document.getElementById('settings-supabase-key').value.trim();

        if (url) localStorage.setItem('CUSTOM_SUPABASE_URL', url);
        if (key) localStorage.setItem('CUSTOM_SUPABASE_KEY', key);

        window.Toast.success('Đã lưu cấu hình kết nối Supabase mới! Vui lòng tải lại trang.');
        setTimeout(() => window.location.reload(), 1200);
      });
    }

    // Reset về kết nối mặc định
    const btnResetConn = document.getElementById('btn-reset-default-conn');
    if (btnResetConn) {
      btnResetConn.addEventListener('click', () => {
        localStorage.removeItem('CUSTOM_SUPABASE_URL');
        localStorage.removeItem('CUSTOM_SUPABASE_KEY');
        window.Toast.info('Đã khôi phục thông tin kết nối Supabase mặc định ban đầu.');
        setTimeout(() => window.location.reload(), 1000);
      });
    }
  },

  // 1. LỊCH SỬ IMPORT (Section XXXIII)
  renderImportHistory() {
    const tbody = document.getElementById('table-import-history-body');
    if (!tbody) return;

    // Lấy danh sách từ demo + audit logs
    const historyList = [
      {
        fileName: 'Du_Lieu_Vi_Sinh_Thang_09_2026.xlsx',
        fileType: 'xlsx',
        date: '2026-09-28 14:30',
        uploader: 'TS.BS. Nguyễn Văn An',
        total: 1000,
        success: 970,
        warning: 20,
        errors: 10,
        status: 'completed'
      },
      {
        fileName: 'Khang_Sinh_Do_ICU_Tuan_38.csv',
        fileType: 'csv',
        date: '2026-09-27 09:15',
        uploader: 'ThS. Trần Thị Mai',
        total: 150,
        success: 150,
        warning: 0,
        errors: 0,
        status: 'completed'
      }
    ];

    tbody.innerHTML = '';
    historyList.forEach((h, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${h.fileName}</strong></td>
        <td><code>.${h.fileType}</code></td>
        <td>${h.date}</td>
        <td>${h.uploader}</td>
        <td style="text-align: center; font-weight: 700;">${h.total}</td>
        <td style="text-align: center; color: var(--color-s); font-weight: 700;">${h.success}</td>
        <td style="text-align: center; color: var(--color-r); font-weight: 700;">${h.errors}</td>
        <td style="text-align: center;"><span class="badge-status badge-s">Thành công</span></td>
      `;
      tbody.appendChild(tr);
    });
  },

  // 2. DANH MỤC HỆ THỐNG (Section LVI: Không hardcode)
  renderCatalogs() {
    const orgTbody = document.getElementById('table-catalog-org-body');
    const abxTbody = document.getElementById('table-catalog-abx-body');

    const demo = window.DemoDataService?.getAll();
    if (!demo) return;

    if (orgTbody) {
      orgTbody.innerHTML = '';
      (demo.organisms || []).forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${o.organism_name}</strong></td>
          <td><code>${o.organism_code}</code></td>
          <td>${o.vietnamese_name || '-'}</td>
          <td><span class="badge-status ${o.gram_stain === 'positive' ? 'badge-i' : 'badge-s'}">${o.gram_stain === 'positive' ? 'Gram dương' : 'Gram âm'}</span></td>
          <td>${o.family || '-'}</td>
        `;
        orgTbody.appendChild(tr);
      });
    }

    if (abxTbody) {
      const allAbx = (demo.antibiotics && demo.antibiotics.length > 0) 
        ? demo.antibiotics 
        : (window.DataNormalization?.antibioticCatalog || []);

      const renderAbxList = (list) => {
        abxTbody.innerHTML = '';
        if (list.length === 0) {
          abxTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">Không tìm thấy kháng sinh phù hợp</td></tr>';
          return;
        }
        list.forEach((a, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="text-align: center; font-weight: 600; color: var(--text-muted);">${a.stt || (idx + 1)}</td>
            <td><code><strong>${a.antibiotic_code || a.code}</strong></code></td>
            <td><strong>${a.antibiotic_name || a.name}</strong></td>
            <td><span style="font-size: 12.5px; color: #334155;">${a.indication || '-'}</span></td>
            <td><span class="badge-tag">${a.antibiotic_group || a.group || '-'}</span></td>
          `;
          abxTbody.appendChild(tr);
        });
      };

      renderAbxList(allAbx);

      const searchInput = document.getElementById('search-catalog-abx');
      if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = 'true';
        searchInput.addEventListener('input', (e) => {
          const q = (e.target.value || '').trim().toLowerCase();
          if (!q) {
            renderAbxList(allAbx);
            return;
          }
          const filtered = allAbx.filter(a => {
            const code = (a.antibiotic_code || a.code || '').toLowerCase();
            const name = (a.antibiotic_name || a.name || '').toLowerCase();
            const ind = (a.indication || '').toLowerCase();
            const grp = (a.antibiotic_group || a.group || '').toLowerCase();
            return code.includes(q) || name.includes(q) || ind.includes(q) || grp.includes(q);
          });
          renderAbxList(filtered);
        });
      }
    }
  },

  // 3. QUẢN LÝ NGƯỜI DÙNG & VAI TRÒ (Section II)
  renderUsers() {
    const tbody = document.getElementById('table-users-body');
    if (!tbody) return;

    const users = Object.values(window.AuthService?.demoUsers || {});
    tbody.innerHTML = '';

    users.forEach((u, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${u.full_name}</strong></td>
        <td>${u.email}</td>
        <td>${u.department}</td>
        <td style="text-align: center;"><span class="role-badge role-${u.role}">${u.role.toUpperCase()}</span></td>
        <td style="text-align: center;"><span class="badge-status badge-s">Đang hoạt động</span></td>
      `;
      tbody.appendChild(tr);
    });
  },

  // 4. NHẬT KÝ KIỂM TOÁN AUDIT LOG (Section XXXV)
  async renderAuditLogs() {
    const tbody = document.getElementById('table-audit-body');
    if (!tbody) return;

    const logs = await window.AuditService.getRecentLogs(30);
    tbody.innerHTML = '';

    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-muted);">Chưa có nhật ký hoạt động nào</td></tr>';
      return;
    }

    logs.forEach((l, idx) => {
      const tr = document.createElement('tr');
      let actionBadge = 'badge-tag';
      if (l.action === 'IMPORT') actionBadge = 'badge-s';
      else if (l.action === 'DELETE') actionBadge = 'badge-r';
      else if (l.action === 'EDIT') actionBadge = 'badge-i';

      tr.innerHTML = `
        <td style="text-align: center;">${idx + 1}</td>
        <td><span class="badge-status ${actionBadge}">${l.action}</span></td>
        <td><code>${l.entity}</code></td>
        <td>${l.user_email || 'Hệ thống'}</td>
        <td>${new Date(l.timestamp).toLocaleTimeString('vi-VN')} - ${new Date(l.timestamp).toLocaleDateString('vi-VN')}</td>
        <td><span style="font-size: 11.5px; color: var(--text-muted);">${JSON.stringify(l.metadata || {})}</span></td>
      `;
      tbody.appendChild(tr);
    });
  },

  // 5. CÀI ĐẶT KẾT NỐI (SETTINGS)
  renderSettings() {
    const { url, key } = window.getActiveSupabaseConfig();
    const inputUrl = document.getElementById('settings-supabase-url');
    const inputKey = document.getElementById('settings-supabase-key');

    if (inputUrl) inputUrl.value = url;
    if (inputKey) inputKey.value = key;
  }
};

if (typeof window !== 'undefined') {
  window.SystemCatalogsView = SystemCatalogsView;
}
