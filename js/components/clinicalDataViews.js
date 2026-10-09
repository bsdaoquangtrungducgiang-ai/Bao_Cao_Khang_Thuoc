/**
 * CLINICAL DATA VIEWS COMPONENT - BAO-CAO-KHANG-THUOC
 * Quản lý các màn hình dữ liệu xét nghiệm: Bệnh nhân, Bệnh phẩm, Nuôi cấy, Kháng sinh đồ
 * Hỗ trợ tìm kiếm thời gian thực (Mục XL) và phân trang
 */

const ClinicalDataViews = {
  currentTab: 'patients',
  searchQuery: '',
  itemsPerPage: 15,
  currentPage: 1,

  init() {
    this.bindSearchEvents();
    window.addEventListener('tabChanged', (e) => {
      const tab = e.detail.tab;
      if (['data_patients', 'data_specimens', 'data_cultures', 'data_ast'].includes(tab)) {
        this.currentTab = tab.replace('data_', '');
        this.currentPage = 1;
        this.renderCurrentView();
      }
    });
  },

  bindSearchEvents() {
    ['patients', 'specimens', 'cultures', 'ast'].forEach(type => {
      const input = document.getElementById(`search-${type}`);
      if (input) {
        input.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.toLowerCase().trim();
          this.currentPage = 1;
          this.renderCurrentView();
        });
      }
    });
  },

  renderCurrentView() {
    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    if (!data) return;

    const activeFile = window.App?.state?.filters?.file;
    let patients = data.patients || [];
    let specimens = data.specimens || [];
    let cultures = data.cultures || [];
    let astList = window.App?.getActiveAstRecords ? window.App.getActiveAstRecords() : (data.astResults || []);

    if (activeFile && activeFile !== 'ALL') {
      const activePatientCodes = new Set(astList.map(a => a.patient_code || a.patient_id).filter(Boolean));
      const activeCultureIds = new Set(astList.map(a => a.culture_id).filter(Boolean));

      patients = patients.filter(p => activePatientCodes.has(p.patient_code) || p.file_name === activeFile);
      specimens = specimens.filter(s => activePatientCodes.has(s.patient_code) || s.file_name === activeFile);
      cultures = cultures.filter(c => activeCultureIds.has(c.id) || activePatientCodes.has(c.patient_code) || c.file_name === activeFile);
    }

    if (this.currentTab === 'patients') this.renderPatients(patients);
    else if (this.currentTab === 'specimens') this.renderSpecimens(specimens);
    else if (this.currentTab === 'cultures') this.renderCultures(cultures);
    else if (this.currentTab === 'ast') this.renderAST(astList);
  },

  // 1. BẢNG BỆNH NHÂN (PATIENTS)
  renderPatients(list = []) {
    const tbody = document.getElementById('table-patients-body');
    const countEl = document.getElementById('count-patients');
    if (!tbody) return;

    const filtered = list.filter(p => {
      if (!this.searchQuery) return true;
      return (
        p.patient_code?.toLowerCase().includes(this.searchQuery) ||
        p.patient_name?.toLowerCase().includes(this.searchQuery) ||
        p.department?.toLowerCase().includes(this.searchQuery)
      );
    });

    if (countEl) countEl.textContent = `${filtered.length} bệnh nhân`;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const paged = filtered.slice(start, start + this.itemsPerPage);

    tbody.innerHTML = '';
    if (paged.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--text-muted);">Không tìm thấy bệnh nhân nào</td></tr>';
      return;
    }

    paged.forEach((p, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted);">${start + idx + 1}</td>
        <td><strong>${p.patient_code}</strong></td>
        <td>${p.patient_name || '-'}</td>
        <td style="text-align: center;">${p.age ?? '-'}</td>
        <td style="text-align: center;"><span class="badge-tag">${p.sex || '-'}</span></td>
        <td>${p.department || '-'}</td>
        <td><span class="badge-status ${p.inpatient_outpatient === 'ICU' ? 'badge-r' : 'badge-s'}">${p.inpatient_outpatient || 'Nội trú'}</span></td>
      `;
      tbody.appendChild(tr);
    });

    this.renderPagination('patients', filtered.length);
  },

  // 2. BẢNG BỆNH PHẨM (SPECIMENS)
  renderSpecimens(list = []) {
    const tbody = document.getElementById('table-specimens-body');
    const countEl = document.getElementById('count-specimens');
    if (!tbody) return;

    const filtered = list.filter(s => {
      if (!this.searchQuery) return true;
      return (
        s.specimen_code?.toLowerCase().includes(this.searchQuery) ||
        s.specimen_type?.toLowerCase().includes(this.searchQuery) ||
        s.patient_code?.toLowerCase().includes(this.searchQuery) ||
        s.requesting_department?.toLowerCase().includes(this.searchQuery)
      );
    });

    if (countEl) countEl.textContent = `${filtered.length} mẫu bệnh phẩm`;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const paged = filtered.slice(start, start + this.itemsPerPage);

    tbody.innerHTML = '';
    if (paged.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--text-muted);">Không tìm thấy bệnh phẩm nào</td></tr>';
      return;
    }

    paged.forEach((s, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted);">${start + idx + 1}</td>
        <td><strong>${s.specimen_code || '-'}</strong></td>
        <td><span class="badge-tag">${s.specimen_type}</span></td>
        <td>${s.patient_code || '-'}</td>
        <td>${s.collection_date || '-'}</td>
        <td>${s.requesting_department || '-'}</td>
      `;
      tbody.appendChild(tr);
    });

    this.renderPagination('specimens', filtered.length);
  },

  // 3. BẢNG NUÔI CẤY & ĐỊNH DANH (CULTURES)
  renderCultures(list = []) {
    const tbody = document.getElementById('table-cultures-body');
    const countEl = document.getElementById('count-cultures');
    if (!tbody) return;

    const filtered = list.filter(c => {
      if (!this.searchQuery) return true;
      return (
        c.organism_name?.toLowerCase().includes(this.searchQuery) ||
        c.organism_code?.toLowerCase().includes(this.searchQuery) ||
        c.patient_code?.toLowerCase().includes(this.searchQuery)
      );
    });

    if (countEl) countEl.textContent = `${filtered.length} chủng phân lập`;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const paged = filtered.slice(start, start + this.itemsPerPage);

    tbody.innerHTML = '';
    if (paged.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--text-muted);">Không tìm thấy vi khuẩn nào</td></tr>';
      return;
    }

    paged.forEach((c, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted);">${start + idx + 1}</td>
        <td><strong>${c.organism_name}</strong></td>
        <td><code>${c.organism_code || '-'}</code></td>
        <td><span class="badge-status ${c.gram_stain === 'positive' ? 'badge-i' : 'badge-s'}">${c.gram_stain === 'positive' ? 'Gram dương' : 'Gram âm'}</span></td>
        <td>${c.patient_code || '-'}</td>
        <td>${c.culture_date || '-'}</td>
        <td><span class="value-chip">${c.colony_count || '> 10^5 CFU/mL'}</span></td>
      `;
      tbody.appendChild(tr);
    });

    this.renderPagination('cultures', filtered.length);
  },

  // 4. BẢNG KHÁNG SINH ĐỒ (AST RESULTS)
  renderAST(list = []) {
    const tbody = document.getElementById('table-ast-body');
    const countEl = document.getElementById('count-ast');
    if (!tbody) return;

    const filterInterp = document.getElementById('filter-ast-interp')?.value || 'ALL';

    const filtered = list.filter(a => {
      if (filterInterp !== 'ALL' && a.interpretation !== filterInterp) return false;
      if (!this.searchQuery) return true;
      return (
        a.organism_name?.toLowerCase().includes(this.searchQuery) ||
        a.antibiotic_code?.toLowerCase().includes(this.searchQuery) ||
        a.patient_code?.toLowerCase().includes(this.searchQuery) ||
        a.specimen_type?.toLowerCase().includes(this.searchQuery)
      );
    });

    if (countEl) countEl.textContent = `${filtered.length} kết quả AST`;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const paged = filtered.slice(start, start + this.itemsPerPage);

    tbody.innerHTML = '';
    if (paged.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px; color: var(--text-muted);">Không tìm thấy kết quả kháng sinh đồ nào</td></tr>';
      return;
    }

    paged.forEach((a, idx) => {
      const tr = document.createElement('tr');
      const interp = a.normalized_result || a.interpretation || 'NA';
      let badgeClass = 'badge-na';
      if (interp === 'S') badgeClass = 'badge-s';
      else if (interp === 'I') badgeClass = 'badge-i';
      else if (interp === 'R') badgeClass = 'badge-r';

      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted);">${start + idx + 1}</td>
        <td><strong>${a.patient_code || '-'}</strong></td>
        <td><span class="badge-tag">${a.specimen_type || '-'}</span></td>
        <td>${a.organism_name || '-'}</td>
        <td><strong>${a.antibiotic_code || '-'}</strong></td>
        <td><span class="badge-status ${badgeClass}">${interp}</span></td>
        <td><span class="value-chip">${a.mic ? a.mic + ' µg/mL' : '-'}</span></td>
        <td><span class="guideline-chip">${a.guideline || 'CLSI'}</span></td>
      `;
      tbody.appendChild(tr);
    });

    this.renderPagination('ast', filtered.length);
  },

  renderPagination(type, totalItems) {
    const container = document.getElementById(`pagination-${type}`);
    if (!container) return;

    const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; font-size:12px; color:var(--text-muted); padding-top: 10px;">
        <div>Trang <strong>${this.currentPage}</strong> / <strong>${totalPages}</strong> (Hiển thị ${this.itemsPerPage} dòng/trang)</div>
        <div style="display:flex; gap:6px;">
          <button class="btn-page-nav" ${this.currentPage <= 1 ? 'disabled' : ''} onclick="window.ClinicalDataViews.changePage(-1)">
            <i class="fa-solid fa-chevron-left"></i> Trước
          </button>
          <button class="btn-page-nav" ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="window.ClinicalDataViews.changePage(1)">
            Sau <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    `;
  },

  changePage(delta) {
    this.currentPage += delta;
    if (this.currentPage < 1) this.currentPage = 1;
    this.renderCurrentView();
  }
};

if (typeof window !== 'undefined') {
  window.ClinicalDataViews = ClinicalDataViews;
}
