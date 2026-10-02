/**
 * FILE MANAGER & STORAGE QUOTA VIEW COMPONENT - BAO-CAO-KHANG-THUOC
 * Quản lý các tập tin dữ liệu đã nạp (Excel, CSV, PDF), giám sát hạn mức bộ nhớ Supabase,
 * cơ chế tự động xóa đợt nhập cũ nhất (FIFO) và kích hoạt Phân tích Chuyên sâu theo từng file.
 */

const FileManagerView = {
  searchQuery: '',
  typeFilter: 'ALL',

  init() {
    this.bindEvents();
    window.addEventListener('tabChanged', (e) => {
      if (e.detail.tab === 'data_files' || e.detail.tab === 'import_history') {
        this.render();
      }
    });

    if (window.StorageQuotaManager) {
      window.StorageQuotaManager.onUsageChange(() => {
        const activeTab = window.Navigation?.currentTab;
        if (activeTab === 'data_files' || activeTab === 'import_history') {
          this.render();
        }
      });
    }
  },

  bindEvents() {
    // Tìm kiếm file
    const searchInput = document.getElementById('search-file-manager');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderTableOnly();
      });
    }

    // Lọc theo định dạng
    const typeSelect = document.getElementById('filter-file-format');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.typeFilter = e.target.value;
        this.renderTableOnly();
      });
    }

    // Toggle tự động dọn dẹp FIFO khi đầy
    const fifoToggle = document.getElementById('toggle-fifo-auto');
    if (fifoToggle) {
      fifoToggle.addEventListener('change', (e) => {
        if (window.StorageQuotaManager) {
          window.StorageQuotaManager.config.autoPurgeEnabled = e.target.checked;
          const status = e.target.checked ? 'Đã BẬT' : 'Đã TẮT';
          window.Toast?.info(`Chế độ FIFO tự động dọn dẹp khi đầy bộ nhớ: ${status}`);
        }
      });
    }

    // Nút kích hoạt dọn dẹp thủ công (Purge Oldest Now)
    const btnManualPurge = document.getElementById('btn-purge-fifo-manual');
    if (btnManualPurge) {
      btnManualPurge.addEventListener('click', async () => {
        if (!confirm('Bạn có chắc chắn muốn dọn dẹp dữ liệu cũ nhất theo cơ chế FIFO để giải phóng dung lượng?')) {
          return;
        }
        btnManualPurge.disabled = true;
        btnManualPurge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang giải phóng...';
        try {
          const res = await window.StorageQuotaManager?.purgeOldestUntilUnderQuota(1000);
          if (res?.purged) {
            window.Toast?.success(`Đã giải phóng thành công ${res.freedCount.toLocaleString()} bản ghi AST!`);
          } else {
            window.Toast?.info('Dung lượng bộ nhớ hiện tại đang ở mức an toàn, chưa cần dọn dẹp.');
          }
          await this.render();
          if (window.App) await window.App.refreshData();
        } catch (err) {
          window.Toast?.error('Lỗi khi dọn dẹp: ' + err.message);
        } finally {
          btnManualPurge.disabled = false;
          btnManualPurge.innerHTML = '<i class="fa-solid fa-broom"></i> Dọn Dẹp FIFO Thủ Công';
        }
      });
    }

    // Nút nạp file mới
    const btnUploadNew = document.getElementById('btn-open-upload-modal');
    if (btnUploadNew) {
      btnUploadNew.addEventListener('click', () => {
        window.Navigation?.navigateTo('import_excel');
      });
    }
  },

  async render() {
    await this.renderQuotaGauge();
    await this.renderTableOnly();
  },

  async renderQuotaGauge() {
    if (!window.StorageQuotaManager) return;
    const usage = await window.StorageQuotaManager.getStorageUsage();

    const curEl = document.getElementById('quota-current-records');
    const maxEl = document.getElementById('quota-max-records');
    const pctEl = document.getElementById('quota-percent-text');
    const barEl = document.getElementById('quota-progress-bar');
    const badgeEl = document.getElementById('quota-status-badge');
    const filesCountEl = document.getElementById('quota-total-files-count');

    if (curEl) curEl.textContent = usage.currentRecords.toLocaleString();
    if (maxEl) maxEl.textContent = usage.maxRecords.toLocaleString();
    if (pctEl) pctEl.textContent = `${usage.percent}%`;
    if (filesCountEl) filesCountEl.textContent = usage.totalFiles;

    if (barEl) {
      barEl.style.width = `${usage.percent}%`;
      barEl.className = 'quota-bar-fill';
      if (usage.percent >= 90) barEl.classList.add('bar-danger');
      else if (usage.percent >= 70) barEl.classList.add('bar-warning');
      else barEl.classList.add('bar-normal');
    }

    if (badgeEl) {
      if (usage.isFull || usage.percent >= 90) {
        badgeEl.className = 'badge-status badge-danger';
        badgeEl.textContent = 'Gần đầy / Kích hoạt FIFO';
      } else if (usage.percent >= 70) {
        badgeEl.className = 'badge-status badge-warning';
        badgeEl.textContent = 'Cảnh báo mức dùng';
      } else {
        badgeEl.className = 'badge-status badge-success';
        badgeEl.textContent = 'Trạng thái Tối ưu';
      }
    }

    const fifoToggle = document.getElementById('toggle-fifo-auto');
    if (fifoToggle) {
      fifoToggle.checked = usage.autoPurgeEnabled;
    }
  },

  async renderTableOnly() {
    const tbody = document.getElementById('table-files-manager-body');
    const countBadge = document.getElementById('files-table-count-badge');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải danh sách file...</td></tr>';

    let files = [];
    if (window.StorageQuotaManager) {
      files = await window.StorageQuotaManager.getAllFilesList();
    } else {
      const demo = window.DemoDataService?.getAll();
      files = (demo?.importJobs || []).map(j => ({
        id: j.id,
        fileName: j.file_name,
        fileType: j.file_type,
        fileSize: j.file_size || 0,
        recordCount: j.record_count || 0,
        createdAt: j.created_at
      }));
    }

    // Lọc theo search và type
    const filtered = files.filter(f => {
      if (this.typeFilter !== 'ALL') {
        const ext = (f.fileType || '').toLowerCase();
        if (this.typeFilter === 'xlsx' && !ext.includes('xls')) return false;
        if (this.typeFilter === 'csv' && !ext.includes('csv')) return false;
        if (this.typeFilter === 'pdf' && !ext.includes('pdf')) return false;
      }
      if (this.searchQuery) {
        return (f.fileName || '').toLowerCase().includes(this.searchQuery);
      }
      return true;
    });

    if (countBadge) {
      countBadge.textContent = `${filtered.length} tập tin`;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 32px; color: var(--text-muted);">
            <i class="fa-regular fa-folder-open" style="font-size: 28px; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
            Chưa có tập tin nào khớp với tiêu chí tìm kiếm. Hãy tải lên file Excel, CSV hoặc PDF để bắt đầu.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = '';
    filtered.forEach((file, index) => {
      const tr = document.createElement('tr');
      const isPdf = (file.fileType === 'pdf' || file.fileName.endsWith('.pdf'));
      const isCsv = (file.fileType === 'csv' || file.fileName.endsWith('.csv'));
      const iconClass = isPdf ? 'fa-solid fa-file-pdf icon-pdf' : (isCsv ? 'fa-solid fa-file-csv icon-csv' : 'fa-solid fa-file-excel icon-excel');
      const typeBadgeClass = isPdf ? 'badge-type-pdf' : (isCsv ? 'badge-type-csv' : 'badge-type-excel');
      const typeLabel = isPdf ? 'PDF' : (isCsv ? 'CSV' : 'EXCEL');

      const sizeStr = file.fileSize > 0 
        ? (file.fileSize > 1024 * 1024 ? (file.fileSize / (1024 * 1024)).toFixed(1) + ' MB' : Math.round(file.fileSize / 1024) + ' KB')
        : 'Tiêu chuẩn';

      const dateStr = file.createdAt ? new Date(file.createdAt).toLocaleString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }) : '--';

      const isCurrentActive = (window.App?.state?.filters?.file === file.fileName);

      tr.className = isCurrentActive ? 'file-row-active' : '';
      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted); font-size: 12px;">${index + 1}</td>
        <td>
          <div class="file-name-cell">
            <i class="${iconClass}"></i>
            <div class="file-meta-col">
              <span class="file-title-text" title="${file.fileName}">${file.fileName}</span>
              ${isCurrentActive ? '<span class="badge-active-filter"><i class="fa-solid fa-check"></i> Đang phân tích</span>' : ''}
            </div>
          </div>
        </td>
        <td style="text-align: center;">
          <span class="badge-file-type ${typeBadgeClass}">${typeLabel}</span>
        </td>
        <td style="text-align: center; font-size: 12px; color: var(--text-muted);">${sizeStr}</td>
        <td style="text-align: center; font-weight: 700; color: var(--primary);">
          ${(file.recordCount || 0).toLocaleString()} <span style="font-size: 11px; font-weight: 400; color: var(--text-muted);">AST</span>
        </td>
        <td style="font-size: 12px; color: var(--text-muted);">${dateStr}</td>
        <td style="text-align: center;">
          <div style="display: flex; flex-direction: column; gap: 3px; align-items: center;">
            <span class="badge-status badge-success">
              <i class="fa-solid fa-database"></i> Database
            </span>
            <a href="https://drive.google.com/drive/folders/1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: #16a34a; text-decoration: none; display: inline-flex; align-items: center; gap: 3px; font-weight: 600;" title="Mở thư mục 5. Webapp Actigrivity trên Google Drive">
              <i class="fa-brands fa-google-drive"></i> 5. Actigrivity
            </a>
          </div>
        </td>
        <td>
          <div class="file-actions-btn-group">
            <button class="btn-action-analyze" data-file="${file.fileName}" title="Phân tích chuyên sâu cho file này trên Dashboard">
              <i class="fa-solid fa-microscope"></i> Phân Tích
            </button>
            <button class="btn-action-abg" data-file="${file.fileName}" title="Xem Antibiogram của riêng file này">
              <i class="fa-solid fa-table-list"></i> Antibiogram
            </button>
            <button class="btn-action-delete" data-file="${file.fileName}" title="Xóa file và giải phóng bộ nhớ Supabase">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Gắn sự kiện cho các nút hành động
    this.bindRowActions();
  },

  bindRowActions() {
    // 1. Phân tích chuyên sâu
    document.querySelectorAll('.btn-action-analyze').forEach(btn => {
      btn.addEventListener('click', () => {
        const fileName = btn.getAttribute('data-file');
        if (fileName && window.App) {
          window.App.selectFileForAnalysis(fileName);
        }
      });
    });

    // 2. Xem Antibiogram theo file
    document.querySelectorAll('.btn-action-abg').forEach(btn => {
      btn.addEventListener('click', () => {
        const fileName = btn.getAttribute('data-file');
        if (fileName && window.App) {
          window.App.state.filters.file = fileName;
          const fileSelect = document.getElementById('filter-file');
          if (fileSelect) fileSelect.value = fileName;
          window.Navigation?.navigateTo('analytics_antibiogram');
          window.Toast?.info(`Đang xem Antibiogram dữ liệu file "${fileName}"`);
        }
      });
    });

    // 3. Xóa file & giải phóng bộ nhớ
    document.querySelectorAll('.btn-action-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const fileName = btn.getAttribute('data-file');
        if (!fileName) return;

        if (confirm(`Bạn có chắc chắn muốn xóa file "${fileName}"?\n\nToàn bộ kết quả AST và nuôi cấy gắn liền với file này sẽ bị xóa vĩnh viễn khỏi Supabase để giải phóng dung lượng lưu trữ.`)) {
          btn.disabled = true;
          btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
          try {
            if (window.StorageQuotaManager) {
              await window.StorageQuotaManager.deleteFile(fileName);
            }
            // Nếu file đang được chọn làm bộ lọc phân tích, reset về ALL
            if (window.App && window.App.state.filters.file === fileName) {
              window.App.state.filters.file = 'ALL';
              const fileSelect = document.getElementById('filter-file');
              if (fileSelect) fileSelect.value = 'ALL';
              await window.App.refreshData();
            }
            await this.render();
          } catch (err) {
            window.Toast?.error('Lỗi khi xóa file: ' + err.message);
          }
        }
      });
    });
  }
};

if (typeof window !== 'undefined') {
  window.FileManagerView = FileManagerView;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FileManagerView };
}
