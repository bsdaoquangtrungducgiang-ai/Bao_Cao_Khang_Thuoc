/**
 * ANTIBIOGRAM VIEW COMPONENT - BAO-CAO-KHANG-THUOC / PT KHÁNG THUỐC
 * Báo cáo Antibiogram tương tác động theo mục XIX & XX
 * Hỗ trợ chọn 1 hoặc nhiều Vi khuẩn, 1 hoặc nhiều Loại bệnh phẩm (hoặc tất cả),
 * Bổ sung lọc theo Khoa phòng và Giới tính (mặc định: Tất cả)
 */

const AntibiogramView = {
  currentChart: null,

  // Bộ lọc hiện tại
  state: {
    selectedOrganisms: new Set(['Escherichia coli']),
    selectedSpecimens: new Set(['ALL']),
    selectedDepartments: new Set(['ALL']),
    selectedGender: 'ALL',
    selectedYear: '2026',
    availableOrganisms: [],
    availableSpecimens: [],
    availableDepartments: []
  },

  init() {
    this.bindEvents();
    window.addEventListener('tabChanged', (e) => {
      if (e.detail.tab === 'analytics_antibiogram') {
        this.populateDropdowns();
        this.renderAntibiogram();
      }
    });
  },

  bindEvents() {
    // 1. Cài đặt các menu Multi-Select
    this.setupMultiSelectComponent({
      key: 'selectedOrganisms',
      btnId: 'btn-ms-organism',
      menuId: 'menu-ms-organism',
      searchId: 'search-ms-organism',
      listId: 'list-ms-organism',
      labelId: 'label-ms-organism',
      badgeId: 'badge-ms-organism',
      btnAllId: 'btn-ms-org-all',
      btnClearId: 'btn-ms-org-clear',
      allOptionText: 'Tất cả vi khuẩn',
      defaultItem: 'Escherichia coli'
    });

    this.setupMultiSelectComponent({
      key: 'selectedSpecimens',
      btnId: 'btn-ms-specimen',
      menuId: 'menu-ms-specimen',
      searchId: 'search-ms-specimen',
      listId: 'list-ms-specimen',
      labelId: 'label-ms-specimen',
      badgeId: 'badge-ms-specimen',
      btnAllId: 'btn-ms-spec-all',
      btnClearId: 'btn-ms-spec-clear',
      allOptionText: 'Tất cả bệnh phẩm',
      defaultItem: 'ALL'
    });

    this.setupMultiSelectComponent({
      key: 'selectedDepartments',
      btnId: 'btn-ms-department',
      menuId: 'menu-ms-department',
      searchId: 'search-ms-department',
      listId: 'list-ms-department',
      labelId: 'label-ms-department',
      badgeId: 'badge-ms-department',
      btnAllId: 'btn-ms-dept-all',
      btnClearId: 'btn-ms-dept-clear',
      allOptionText: 'Tất cả khoa phòng',
      defaultItem: 'ALL'
    });

    // 2. Lựa chọn Giới tính (mặc định: Tất cả)
    const genderSelect = document.getElementById('abg-select-gender');
    if (genderSelect) {
      genderSelect.addEventListener('change', (e) => {
        this.state.selectedGender = e.target.value;
        this.renderAntibiogram();
      });
    }

    // 3. Lựa chọn Năm
    const yearSelect = document.getElementById('abg-select-year');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this.state.selectedYear = e.target.value;
        this.renderAntibiogram();
      });
    }

    // 4. Nút Đặt lại bộ lọc (Reset)
    const btnReset = document.getElementById('btn-reset-abg-filters');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.resetFilters());
    }

    // 5. Nút xuất Excel Antibiogram
    const btnExportExcel = document.getElementById('btn-export-abg-excel');
    if (btnExportExcel) {
      btnExportExcel.addEventListener('click', () => this.exportExcel());
    }

    // 6. Nút in ấn Antibiogram
    const btnPrint = document.getElementById('btn-print-abg');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => window.print());
    }

    // 7. Đóng dropdown khi click bên ngoài
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.custom-multiselect')) {
        document.querySelectorAll('.ms-dropdown-menu').forEach(menu => {
          menu.style.display = 'none';
        });
        document.querySelectorAll('.ms-trigger-btn').forEach(btn => {
          btn.classList.remove('active');
        });
      }
    });

    // 8. Đóng dropdown khi nhấn Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.ms-dropdown-menu').forEach(menu => {
          menu.style.display = 'none';
        });
        document.querySelectorAll('.ms-trigger-btn').forEach(btn => {
          btn.classList.remove('active');
        });
      }
    });
  },

  /**
   * Cài đặt logic Multi-Select tương tác
   */
  setupMultiSelectComponent(config) {
    const btn = document.getElementById(config.btnId);
    const menu = document.getElementById(config.menuId);
    const search = document.getElementById(config.searchId);
    const btnAll = document.getElementById(config.btnAllId);
    const btnClear = document.getElementById(config.btnClearId);

    if (btn && menu) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.style.display !== 'none';
        // Đóng các menu khác
        document.querySelectorAll('.ms-dropdown-menu').forEach(m => {
          if (m !== menu) m.style.display = 'none';
        });
        document.querySelectorAll('.ms-trigger-btn').forEach(b => {
          if (b !== btn) b.classList.remove('active');
        });

        menu.style.display = isOpen ? 'none' : 'flex';
        btn.classList.toggle('active', !isOpen);
        if (!isOpen && search) {
          setTimeout(() => search.focus(), 50);
        }
      });
    }

    if (search) {
      search.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const list = document.getElementById(config.listId);
        if (list) {
          const items = list.querySelectorAll('.ms-option-item');
          items.forEach(item => {
            const name = (item.getAttribute('data-value') || '').toLowerCase();
            item.style.display = name.includes(query) ? 'flex' : 'none';
          });
        }
      });
    }

    if (btnAll) {
      btnAll.addEventListener('click', () => {
        this.state[config.key].clear();
        this.state[config.key].add('ALL');
        this.updateMultiSelectUI(config);
        this.renderAntibiogram();
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.state[config.key].clear();
        this.updateMultiSelectUI(config);
        this.renderAntibiogram();
      });
    }
  },

  /**
   * Đặt lại bộ lọc Antibiogram về mặc định
   */
  resetFilters() {
    this.state.selectedOrganisms = new Set(this.state.availableOrganisms.includes('Escherichia coli') ? ['Escherichia coli'] : (this.state.availableOrganisms.slice(0, 1) || ['ALL']));
    this.state.selectedSpecimens = new Set(['ALL']);
    this.state.selectedDepartments = new Set(['ALL']);
    this.state.selectedGender = 'ALL';
    this.state.selectedYear = '2026';

    const genderSelect = document.getElementById('abg-select-gender');
    if (genderSelect) genderSelect.value = 'ALL';

    const yearSelect = document.getElementById('abg-select-year');
    if (yearSelect) yearSelect.value = '2026';

    this.renderMultiSelectOptions('selectedOrganisms', 'list-ms-organism', this.state.availableOrganisms, 'Tất cả vi khuẩn');
    this.renderMultiSelectOptions('selectedSpecimens', 'list-ms-specimen', this.state.availableSpecimens, 'Tất cả bệnh phẩm');
    this.renderMultiSelectOptions('selectedDepartments', 'list-ms-department', this.state.availableDepartments, 'Tất cả khoa phòng');

    this.updateMultiSelectUI({
      key: 'selectedOrganisms',
      labelId: 'label-ms-organism',
      badgeId: 'badge-ms-organism',
      allOptionText: 'Tất cả vi khuẩn'
    });
    this.updateMultiSelectUI({
      key: 'selectedSpecimens',
      labelId: 'label-ms-specimen',
      badgeId: 'badge-ms-specimen',
      allOptionText: 'Tất cả bệnh phẩm'
    });
    this.updateMultiSelectUI({
      key: 'selectedDepartments',
      labelId: 'label-ms-department',
      badgeId: 'badge-ms-department',
      allOptionText: 'Tất cả khoa phòng'
    });

    window.Toast?.info('Đã đặt lại bộ lọc Antibiogram về mặc định');
    this.renderAntibiogram();
  },

  /**
   * Nạp danh sách tùy chọn cho các bộ lọc từ dữ liệu hiện hành
   */
  populateDropdowns() {
    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    if (!data) return;

    const astList = window.App?.getActiveAstRecords ? window.App.getActiveAstRecords() : (data.astResults || []);

    // 1. Vi khuẩn
    const orgCounts = {};
    astList.forEach(a => {
      const o = a.organism_name;
      if (o) orgCounts[o] = (orgCounts[o] || 0) + 1;
    });
    if (Object.keys(orgCounts).length === 0 && data.cultures) {
      data.cultures.forEach(c => {
        if (c.organism_name) orgCounts[c.organism_name] = (orgCounts[c.organism_name] || 0) + 1;
      });
    }
    const sortedOrgs = Object.entries(orgCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    this.state.availableOrganisms = sortedOrgs.map(o => o.name);

    // Mặc định chọn E. coli nếu chưa có lựa chọn
    if (this.state.selectedOrganisms.size === 0 || (this.state.selectedOrganisms.has('Escherichia coli') && !this.state.availableOrganisms.includes('Escherichia coli') && this.state.availableOrganisms.length > 0)) {
      this.state.selectedOrganisms = new Set([this.state.availableOrganisms[0]]);
    }

    // 2. Bệnh phẩm
    const specCounts = {};
    astList.forEach(a => {
      const s = a.specimen_type;
      if (s) specCounts[s] = (specCounts[s] || 0) + 1;
    });
    if (Object.keys(specCounts).length === 0 && data.specimens) {
      data.specimens.forEach(s => {
        if (s.specimen_type) specCounts[s.specimen_type] = (specCounts[s.specimen_type] || 0) + 1;
      });
    }
    const sortedSpecs = Object.entries(specCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    this.state.availableSpecimens = sortedSpecs.map(s => s.name);

    // 3. Khoa phòng
    const deptCounts = {};
    const patMap = new Map();
    (data.patients || []).forEach(p => {
      if (p.patient_code && p.department) patMap.set(p.patient_code, p.department);
      if (p.id && p.department) patMap.set(p.id, p.department);
    });

    astList.forEach(a => {
      const d = a.department || a.requesting_department || patMap.get(a.patient_code) || patMap.get(a.patient_id);
      if (d) deptCounts[d] = (deptCounts[d] || 0) + 1;
    });
    if (Object.keys(deptCounts).length === 0 && data.specimens) {
      data.specimens.forEach(s => {
        if (s.requesting_department) deptCounts[s.requesting_department] = (deptCounts[s.requesting_department] || 0) + 1;
      });
    }
    const sortedDepts = Object.entries(deptCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    this.state.availableDepartments = sortedDepts.map(d => d.name);

    // Render checkbox options
    this.renderMultiSelectOptions('selectedOrganisms', 'list-ms-organism', sortedOrgs, 'Tất cả vi khuẩn');
    this.renderMultiSelectOptions('selectedSpecimens', 'list-ms-specimen', sortedSpecs, 'Tất cả bệnh phẩm');
    this.renderMultiSelectOptions('selectedDepartments', 'list-ms-department', sortedDepts, 'Tất cả khoa phòng');

    // Cập nhật text hiển thị trên nút trigger
    this.updateMultiSelectUI({
      key: 'selectedOrganisms',
      labelId: 'label-ms-organism',
      badgeId: 'badge-ms-organism',
      allOptionText: 'Tất cả vi khuẩn'
    });
    this.updateMultiSelectUI({
      key: 'selectedSpecimens',
      labelId: 'label-ms-specimen',
      badgeId: 'badge-ms-specimen',
      allOptionText: 'Tất cả bệnh phẩm'
    });
    this.updateMultiSelectUI({
      key: 'selectedDepartments',
      labelId: 'label-ms-department',
      badgeId: 'badge-ms-department',
      allOptionText: 'Tất cả khoa phòng'
    });
  },

  /**
   * Render danh sách checkbox bên trong menu dropdown
   */
  renderMultiSelectOptions(stateKey, containerId, items = [], allText = 'Tất cả') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const selectedSet = this.state[stateKey];
    const isAll = selectedSet.has('ALL') || selectedSet.size === 0;

    // Item "Tất cả"
    const allItemDiv = document.createElement('div');
    allItemDiv.className = `ms-option-item ${isAll ? 'selected' : ''}`;
    allItemDiv.setAttribute('data-value', 'ALL');
    allItemDiv.innerHTML = `
      <input type="checkbox" id="${containerId}-opt-all" ${isAll ? 'checked' : ''} />
      <label for="${containerId}-opt-all" class="ms-option-name" style="cursor: pointer; font-weight: 600;">
        ${allText}
      </label>
    `;

    allItemDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedSet.clear();
      selectedSet.add('ALL');
      this.refreshCheckboxesInList(containerId, stateKey, allText);
      this.renderAntibiogram();
    });
    container.appendChild(allItemDiv);

    // Từng item riêng lẻ
    items.forEach((itemObj, idx) => {
      const name = typeof itemObj === 'string' ? itemObj : itemObj.name;
      const count = typeof itemObj === 'object' ? itemObj.count : null;
      const isChecked = !isAll && selectedSet.has(name);

      const div = document.createElement('div');
      div.className = `ms-option-item ${isChecked ? 'selected' : ''}`;
      div.setAttribute('data-value', name);

      const countBadge = count !== null ? `<span class="ms-option-count">${count}</span>` : '';
      div.innerHTML = `
        <input type="checkbox" id="${containerId}-opt-${idx}" ${isChecked ? 'checked' : ''} />
        <label for="${containerId}-opt-${idx}" class="ms-option-name" style="cursor: pointer;">
          ${name}
        </label>
        ${countBadge}
      `;

      div.addEventListener('click', (e) => {
        e.stopPropagation();
        if (selectedSet.has('ALL')) {
          selectedSet.clear();
        }

        if (selectedSet.has(name)) {
          selectedSet.delete(name);
        } else {
          selectedSet.add(name);
        }

        // Nếu bỏ chọn hết thì quay về ALL
        if (selectedSet.size === 0) {
          selectedSet.add('ALL');
        }

        this.refreshCheckboxesInList(containerId, stateKey, allText);
        this.renderAntibiogram();
      });

      container.appendChild(div);
    });
  },

  /**
   * Cập nhật trạng thái hiển thị của các checkbox và trigger button
   */
  refreshCheckboxesInList(containerId, stateKey, allText) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const selectedSet = this.state[stateKey];
    const isAll = selectedSet.has('ALL') || selectedSet.size === 0;

    const items = container.querySelectorAll('.ms-option-item');
    items.forEach(item => {
      const val = item.getAttribute('data-value');
      const chk = item.querySelector('input[type="checkbox"]');
      if (val === 'ALL') {
        if (chk) chk.checked = isAll;
        item.classList.toggle('selected', isAll);
      } else {
        const checked = !isAll && selectedSet.has(val);
        if (chk) chk.checked = checked;
        item.classList.toggle('selected', checked);
      }
    });

    // Cập nhật text trên nút
    const configMap = {
      selectedOrganisms: { labelId: 'label-ms-organism', badgeId: 'badge-ms-organism', allOptionText: 'Tất cả vi khuẩn' },
      selectedSpecimens: { labelId: 'label-ms-specimen', badgeId: 'badge-ms-specimen', allOptionText: 'Tất cả bệnh phẩm' },
      selectedDepartments: { labelId: 'label-ms-department', badgeId: 'badge-ms-department', allOptionText: 'Tất cả khoa phòng' }
    };
    if (configMap[stateKey]) {
      this.updateMultiSelectUI({
        key: stateKey,
        ...configMap[stateKey]
      });
    }
  },

  /**
   * Cập nhật nhãn và huy hiệu số lượng trên trigger button
   */
  updateMultiSelectUI(config) {
    const labelEl = document.getElementById(config.labelId);
    const badgeEl = document.getElementById(config.badgeId);
    if (!labelEl) return;

    const selectedSet = this.state[config.key];
    const isAll = selectedSet.has('ALL') || selectedSet.size === 0;

    if (isAll) {
      labelEl.textContent = config.allOptionText;
      if (badgeEl) badgeEl.style.display = 'none';
    } else {
      const arr = Array.from(selectedSet);
      if (arr.length === 1) {
        labelEl.textContent = arr[0];
        if (badgeEl) badgeEl.style.display = 'none';
      } else if (arr.length === 2) {
        labelEl.textContent = `${arr[0]}, ${arr[1]}`;
        if (badgeEl) {
          badgeEl.textContent = '2';
          badgeEl.style.display = 'inline-block';
        }
      } else {
        labelEl.textContent = `${arr[0]}, ${arr[1]}...`;
        if (badgeEl) {
          badgeEl.textContent = String(arr.length);
          badgeEl.style.display = 'inline-block';
        }
      }
    }

    // Đồng bộ vào select ẩn nếu có
    if (config.key === 'selectedOrganisms') {
      const sel = document.getElementById('abg-select-organism');
      if (sel) sel.value = isAll ? 'ALL' : Array.from(selectedSet)[0];
    } else if (config.key === 'selectedSpecimens') {
      const sel = document.getElementById('abg-select-specimen');
      if (sel) sel.value = isAll ? 'ALL' : Array.from(selectedSet)[0];
    }
  },

  /**
   * Thực hiện phân tích và vẽ bảng Antibiogram
   */
  renderAntibiogram() {
    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    if (!data) return;

    // Lấy tiêu chí lọc
    const orgs = (this.state.selectedOrganisms.has('ALL') || this.state.selectedOrganisms.size === 0)
      ? 'ALL' 
      : Array.from(this.state.selectedOrganisms);

    const specs = (this.state.selectedSpecimens.has('ALL') || this.state.selectedSpecimens.size === 0)
      ? 'ALL' 
      : Array.from(this.state.selectedSpecimens);

    const depts = (this.state.selectedDepartments.has('ALL') || this.state.selectedDepartments.size === 0)
      ? 'ALL' 
      : Array.from(this.state.selectedDepartments);

    const gender = this.state.selectedGender || 'ALL';
    const year = this.state.selectedYear || '2026';
    const activeFile = window.App?.state?.filters?.file;

    // Cập nhật tiêu đề báo cáo
    const titleEl = document.getElementById('abg-report-title');
    const badgesEl = document.getElementById('abg-active-filter-badges');

    let orgTitleText = 'Tất cả vi khuẩn';
    if (Array.isArray(orgs)) {
      if (orgs.length === 1) orgTitleText = orgs[0];
      else orgTitleText = `${orgs[0]} và ${orgs.length - 1} vi khuẩn khác (${orgs.length} chủng)`;
    }

    let specTitleText = 'Tất cả bệnh phẩm';
    if (Array.isArray(specs)) {
      if (specs.length === 1) specTitleText = specs[0];
      else specTitleText = `${specs.join(', ')} (${specs.length} loại)`;
    }

    const yearText = (year && year !== 'ALL') ? `(${year})` : '(Toàn thời gian)';
    if (titleEl) {
      titleEl.textContent = `Antibiogram: ${orgTitleText} — ${specTitleText} ${yearText}`;
    }

    // Hiển thị huy hiệu tiêu chí lọc đang tác dụng
    if (badgesEl) {
      badgesEl.innerHTML = '';
      if (Array.isArray(depts)) {
        badgesEl.innerHTML += `<span class="abg-filter-badge"><i class="fa-solid fa-hospital-user"></i> Khoa: ${depts.join(', ')}</span>`;
      }
      if (gender && gender !== 'ALL') {
        badgesEl.innerHTML += `<span class="abg-filter-badge"><i class="fa-solid fa-venus-mars"></i> Giới tính: ${gender === 'Nam' ? 'Nam' : 'Nữ'}</span>`;
      }
      if (activeFile && activeFile !== 'ALL') {
        badgesEl.innerHTML += `<span class="abg-filter-badge" style="background:#ecfdf5; color:#065f46; border-color:#a7f3d0;"><i class="fa-solid fa-file"></i> Nguồn: ${activeFile}</span>`;
      }
    }

    // Lấy tập dữ liệu AST (lọc theo file nếu người dùng đã chọn file)
    const astList = window.App?.getActiveAstRecords ? window.App.getActiveAstRecords() : (data.astResults || []);

    // Sinh bảng Antibiogram qua AnalyticsService đa tiêu chí
    const rows = window.AnalyticsService.generateAntibiogram(astList, orgs, specs, depts, gender, year);
    this.renderTable(rows);
    this.renderChart(rows);
  },

  renderTable(rows = []) {
    const tbody = document.getElementById('table-abg-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 24px; color: var(--text-muted);">Không có dữ liệu kháng sinh đồ cho các tiêu chí lọc đã chọn</td></tr>';
      return;
    }

    rows.forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted);">${idx + 1}</td>
        <td><strong>${r.code}</strong></td>
        <td>${r.name || r.code}</td>
        <td style="text-align: center; font-weight: 700; color: var(--color-s);">${r.sRate}% <span style="font-size: 10.5px; color: var(--text-muted);">(${r.sCount})</span></td>
        <td style="text-align: center; font-weight: 700; color: var(--color-i);">${r.iRate}% <span style="font-size: 10.5px; color: var(--text-muted);">(${r.iCount})</span></td>
        <td style="text-align: center; font-weight: 700; color: var(--color-r);">${r.rRate}% <span style="font-size: 10.5px; color: var(--text-muted);">(${r.rCount})</span></td>
        <td style="text-align: center; font-weight: 700;">${r.total}</td>
        <td>
          <div style="display:flex; height: 6px; border-radius: 3px; overflow: hidden; background: #e2e8f0;">
            <div style="width: ${r.sRate}%; background: var(--color-s);"></div>
            <div style="width: ${r.iRate}%; background: var(--color-i);"></div>
            <div style="width: ${r.rRate}%; background: var(--color-r);"></div>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  renderChart(rows = []) {
    const ctx = document.getElementById('chart-abg-bars')?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;

    if (this.currentChart) {
      this.currentChart.destroy();
    }

    const labels = rows.map(r => r.code);
    const sRates = rows.map(r => r.sRate);
    const iRates = rows.map(r => r.iRate);
    const rRates = rows.map(r => r.rRate);

    this.currentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Kháng (R%)', data: rRates, backgroundColor: '#ef4444' },
          { label: 'Trung gian (I%)', data: iRates, backgroundColor: '#f59e0b' },
          { label: 'Nhạy (S%)', data: sRates, backgroundColor: '#10b981' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { stacked: true, max: 100, ticks: { callback: v => v + '%' } },
          y: { stacked: true }
        },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%`
            }
          }
        }
      }
    });
  },

  /**
   * Xuất Antibiogram ra Excel đầy đủ tiêu chí lọc
   */
  exportExcel() {
    const orgs = (this.state.selectedOrganisms.has('ALL') || this.state.selectedOrganisms.size === 0)
      ? 'ALL' 
      : Array.from(this.state.selectedOrganisms);
    const specs = (this.state.selectedSpecimens.has('ALL') || this.state.selectedSpecimens.size === 0)
      ? 'ALL' 
      : Array.from(this.state.selectedSpecimens);
    const depts = (this.state.selectedDepartments.has('ALL') || this.state.selectedDepartments.size === 0)
      ? 'ALL' 
      : Array.from(this.state.selectedDepartments);
    const gender = this.state.selectedGender || 'ALL';
    const year = this.state.selectedYear || '2026';

    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    const astList = window.App?.getActiveAstRecords ? window.App.getActiveAstRecords() : (data.astResults || []);
    const rows = window.AnalyticsService.generateAntibiogram(astList, orgs, specs, depts, gender, year);

    if (rows.length === 0) {
      window.Toast?.info('Không có dữ liệu để xuất file!');
      return;
    }

    const excelRows = rows.map(r => ({
      'Mã kháng sinh': r.code,
      'Tên kháng sinh': r.name,
      'Số lượng Nhạy (S)': r.sCount,
      'Tỷ lệ Nhạy (%S)': r.sRate,
      'Số lượng Trung gian (I)': r.iCount,
      'Tỷ lệ Trung gian (%I)': r.iRate,
      'Số lượng Kháng (R)': r.rCount,
      'Tỷ lệ Kháng (%R)': r.rRate,
      'Tổng số mẫu thử': r.total
    }));

    if (typeof XLSX === 'undefined') {
      window.Toast?.error('Thư viện XLSX chưa tải!');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Antibiogram');

    const orgPrefix = Array.isArray(orgs) ? orgs.join('_').substring(0, 25) : 'TatCaViKhuan';
    const specPrefix = Array.isArray(specs) ? specs.join('_').substring(0, 20) : 'TatCaBenhPham';
    const fileName = `Antibiogram_${orgPrefix}_${specPrefix}_${year}.xlsx`;

    XLSX.writeFile(wb, fileName);
    window.Toast?.success('Đã xuất file Antibiogram Excel thành công!');
  }
};

if (typeof window !== 'undefined') {
  window.AntibiogramView = AntibiogramView;
}
