/**
 * ANTIBIOGRAM VIEW COMPONENT - BAO-CAO-KHANG-THUOC / PT KHÁNG THUỐC
 * Báo cáo Antibiogram tương tác động theo mục XIX & XX
 * Hỗ trợ chọn 1 hoặc nhiều Vi khuẩn, 1 hoặc nhiều Loại bệnh phẩm (hoặc tất cả),
 * Bổ sung lọc theo Khoa phòng và Giới tính (mặc định: Tất cả)
 */

const AntibiogramView = {
  currentChart: null,

  // Bộ lọc hiện tại (Mặc định: Tất cả vi khuẩn, Tất cả bệnh phẩm, Toàn viện, Tất cả 63 kháng sinh)
  state: {
    selectedOrganisms: new Set(['ALL']),
    selectedSpecimens: new Set(['ALL']),
    selectedDepartments: new Set(['ALL']),
    selectedAntibiotics: new Set(['ALL']),
    selectedGender: 'ALL',
    selectedYear: 'ALL',
    availableOrganisms: [],
    availableSpecimens: [],
    availableDepartments: [],
    availableAntibiotics: [],
    chartSortMode: 'default',
    viewMode: 'both',
    lastRows: []
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
      defaultItem: 'ALL'
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
      allOptionText: 'Toàn viện (Tất cả khoa)',
      defaultItem: 'ALL'
    });

    this.setupMultiSelectComponent({
      key: 'selectedAntibiotics',
      btnId: 'btn-ms-antibiotic',
      menuId: 'menu-ms-antibiotic',
      searchId: 'search-ms-antibiotic',
      listId: 'list-ms-antibiotic',
      labelId: 'label-ms-antibiotic',
      badgeId: 'badge-ms-antibiotic',
      btnAllId: 'btn-ms-abx-all',
      btnClearId: 'btn-ms-abx-clear',
      allOptionText: 'Tất cả 63 kháng sinh',
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

    // 7. Chuyển đổi chế độ hiển thị Bảng / Biểu đồ tách biệt
    document.querySelectorAll('.btn-abg-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode') || 'both';
        this.setViewMode(mode);
      });
    });

    // 8. Sắp xếp biểu đồ
    const btnSortDef = document.getElementById('btn-chart-sort-default');
    const btnSortR = document.getElementById('btn-chart-sort-r');
    const btnSortS = document.getElementById('btn-chart-sort-s');
    if (btnSortDef) {
      btnSortDef.addEventListener('click', () => {
        this.state.chartSortMode = 'default';
        this.updateSortButtonsUI('btn-chart-sort-default');
        this.renderChart(this.state.lastRows);
      });
    }
    if (btnSortR) {
      btnSortR.addEventListener('click', () => {
        this.state.chartSortMode = 'r_desc';
        this.updateSortButtonsUI('btn-chart-sort-r');
        this.renderChart(this.state.lastRows);
      });
    }
    if (btnSortS) {
      btnSortS.addEventListener('click', () => {
        this.state.chartSortMode = 's_desc';
        this.updateSortButtonsUI('btn-chart-sort-s');
        this.renderChart(this.state.lastRows);
      });
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
        this.refreshCheckboxesInList(config.listId, config.key, config.allOptionText);
        this.handleFilterChanged(config.key);
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.state[config.key].clear();
        this.refreshCheckboxesInList(config.listId, config.key, config.allOptionText);
        this.handleFilterChanged(config.key);
      });
    }
  },

  /**
   * Xử lý khi người dùng thay đổi 1 bộ lọc (Vi khuẩn, Bệnh phẩm, Khoa phòng, Kháng sinh)
   * Tự động điều chỉnh các bộ lọc còn lại nếu có xung đột để luôn phân tích được ngay tiêu chí đã chọn
   */
  handleFilterChanged(changedKey) {
    const configMap = {
      selectedOrganisms: { key: 'selectedOrganisms', labelId: 'label-ms-organism', badgeId: 'badge-ms-organism', allOptionText: 'Tất cả vi khuẩn' },
      selectedSpecimens: { key: 'selectedSpecimens', labelId: 'label-ms-specimen', badgeId: 'badge-ms-specimen', allOptionText: 'Tất cả bệnh phẩm' },
      selectedDepartments: { key: 'selectedDepartments', labelId: 'label-ms-department', badgeId: 'badge-ms-department', allOptionText: 'Toàn viện (Tất cả khoa)' },
      selectedAntibiotics: { key: 'selectedAntibiotics', labelId: 'label-ms-antibiotic', badgeId: 'badge-ms-antibiotic', allOptionText: 'Tất cả 63 kháng sinh' }
    };
    if (configMap[changedKey]) {
      this.updateMultiSelectUI(configMap[changedKey]);
    }
    this.renderAntibiogram();
  },

  /**
   * Đặt lại bộ lọc Antibiogram về mặc định (Tất cả vi khuẩn, Tất cả bệnh phẩm, Toàn viện, Tất cả 63 kháng sinh)
   */
  resetFilters() {
    this.state.selectedOrganisms = new Set(['ALL']);
    this.state.selectedSpecimens = new Set(['ALL']);
    this.state.selectedDepartments = new Set(['ALL']);
    this.state.selectedAntibiotics = new Set(['ALL']);
    this.state.selectedGender = 'ALL';
    this.state.selectedYear = 'ALL';

    const genderSelect = document.getElementById('abg-select-gender');
    if (genderSelect) genderSelect.value = 'ALL';

    const yearSelect = document.getElementById('abg-select-year');
    if (yearSelect) yearSelect.value = 'ALL';

    this.renderMultiSelectOptions('selectedOrganisms', 'list-ms-organism', this.state.availableOrganisms, 'Tất cả vi khuẩn');
    this.renderMultiSelectOptions('selectedSpecimens', 'list-ms-specimen', this.state.availableSpecimens, 'Tất cả bệnh phẩm');
    this.renderMultiSelectOptions('selectedDepartments', 'list-ms-department', this.state.availableDepartments, 'Toàn viện (Tất cả khoa)');
    this.renderMultiSelectOptions('selectedAntibiotics', 'list-ms-antibiotic', this.state.availableAntibiotics, 'Tất cả 63 kháng sinh');

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
      allOptionText: 'Toàn viện (Tất cả khoa)'
    });
    this.updateMultiSelectUI({
      key: 'selectedAntibiotics',
      labelId: 'label-ms-antibiotic',
      badgeId: 'badge-ms-antibiotic',
      allOptionText: 'Tất cả 63 kháng sinh'
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

    // Mặc định: Tất cả vi khuẩn
    if (!this.state.selectedOrganisms || this.state.selectedOrganisms.size === 0) {
      this.state.selectedOrganisms = new Set(['ALL']);
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

    // 4. Kháng sinh (Tách đủ 63 kháng sinh chuẩn, không gộp peng hay CTX)
    const catalog = (typeof window !== 'undefined' && window.DataNormalization?.antibioticCatalog) ||
      (typeof DataNormalization !== 'undefined' && DataNormalization.antibioticCatalog) || [];

    const abxCounts = {};
    astList.forEach(a => {
      const code = a.antibiotic_code;
      if (code) abxCounts[code] = (abxCounts[code] || 0) + 1;
    });

    const sortedAbxs = catalog.map(cat => ({
      name: cat.code,
      stt: cat.stt,
      displayName: `${cat.code} — ${cat.name}${cat.indication ? ` (${cat.indication})` : ''}`,
      count: abxCounts[cat.code] || 0
    }));

    Object.keys(abxCounts).forEach(code => {
      if (!catalog.some(c => c.code.toLowerCase() === code.toLowerCase())) {
        sortedAbxs.push({
          name: code,
          stt: 999,
          displayName: code,
          count: abxCounts[code]
        });
      }
    });

    this.state.availableAntibiotics = sortedAbxs;

    // Render checkbox options
    this.renderMultiSelectOptions('selectedOrganisms', 'list-ms-organism', sortedOrgs, 'Tất cả vi khuẩn');
    this.renderMultiSelectOptions('selectedSpecimens', 'list-ms-specimen', sortedSpecs, 'Tất cả bệnh phẩm');
    this.renderMultiSelectOptions('selectedDepartments', 'list-ms-department', sortedDepts, 'Toàn viện (Tất cả khoa)');
    this.renderMultiSelectOptions('selectedAntibiotics', 'list-ms-antibiotic', sortedAbxs, 'Tất cả 63 kháng sinh');

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
      allOptionText: 'Toàn viện (Tất cả khoa)'
    });
    this.updateMultiSelectUI({
      key: 'selectedAntibiotics',
      labelId: 'label-ms-antibiotic',
      badgeId: 'badge-ms-antibiotic',
      allOptionText: 'Tất cả 63 kháng sinh'
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
      <input type="checkbox" id="${containerId}-opt-all" ${isAll ? 'checked' : ''} style="pointer-events: none;" />
      <span class="ms-option-name" style="cursor: pointer; font-weight: 600; pointer-events: none;">
        ${allText}
      </span>
    `;

    allItemDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      selectedSet.clear();
      selectedSet.add('ALL');
      this.refreshCheckboxesInList(containerId, stateKey, allText);
      this.handleFilterChanged(stateKey);
    });
    container.appendChild(allItemDiv);

    // Từng item riêng lẻ
    items.forEach((itemObj, idx) => {
      const name = typeof itemObj === 'string' ? itemObj : itemObj.name;
      const displayName = (typeof itemObj === 'object' && itemObj.displayName) ? itemObj.displayName : name;
      const count = typeof itemObj === 'object' ? itemObj.count : null;
      const isChecked = !isAll && selectedSet.has(name);

      const div = document.createElement('div');
      div.className = `ms-option-item ${isChecked ? 'selected' : ''}`;
      div.setAttribute('data-value', name);

      const countBadge = count !== null ? `<span class="ms-option-count" style="pointer-events: none;">${count}</span>` : '';
      div.innerHTML = `
        <input type="checkbox" id="${containerId}-opt-${idx}" ${isChecked ? 'checked' : ''} style="pointer-events: none;" />
        <span class="ms-option-name" style="cursor: pointer; pointer-events: none;" title="${displayName}">
          ${displayName}
        </span>
        ${countBadge}
      `;

      div.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
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
        this.handleFilterChanged(stateKey);
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
    const isAll = selectedSet.has('ALL');
    const isEmpty = selectedSet.size === 0;

    const items = container.querySelectorAll('.ms-option-item');
    items.forEach(item => {
      const val = item.getAttribute('data-value');
      const chk = item.querySelector('input[type="checkbox"]');
      if (val === 'ALL') {
        if (chk) chk.checked = isAll;
        item.classList.toggle('selected', isAll);
      } else {
        const checked = !isAll && !isEmpty && selectedSet.has(val);
        if (chk) chk.checked = checked;
        item.classList.toggle('selected', checked);
      }
    });

    // Cập nhật text trên nút
    const configMap = {
      selectedOrganisms: { key: 'selectedOrganisms', labelId: 'label-ms-organism', badgeId: 'badge-ms-organism', allOptionText: 'Tất cả vi khuẩn' },
      selectedSpecimens: { key: 'selectedSpecimens', labelId: 'label-ms-specimen', badgeId: 'badge-ms-specimen', allOptionText: 'Tất cả bệnh phẩm' },
      selectedDepartments: { key: 'selectedDepartments', labelId: 'label-ms-department', badgeId: 'badge-ms-department', allOptionText: 'Toàn viện (Tất cả khoa)' },
      selectedAntibiotics: { key: 'selectedAntibiotics', labelId: 'label-ms-antibiotic', badgeId: 'badge-ms-antibiotic', allOptionText: 'Tất cả 63 kháng sinh' }
    };
    if (configMap[stateKey]) {
      this.updateMultiSelectUI(configMap[stateKey]);
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
    const isAll = selectedSet.has('ALL');
    const isEmpty = selectedSet.size === 0;

    let totalAvailable = 0;
    if (config.key === 'selectedOrganisms') totalAvailable = this.state.availableOrganisms?.length || 0;
    else if (config.key === 'selectedSpecimens') totalAvailable = this.state.availableSpecimens?.length || 0;
    else if (config.key === 'selectedDepartments') totalAvailable = this.state.availableDepartments?.length || 0;
    else if (config.key === 'selectedAntibiotics') totalAvailable = this.state.availableAntibiotics?.length || 63;

    if (isEmpty) {
      labelEl.textContent = `Chọn ${config.allOptionText.replace('Tất cả ', '').toLowerCase()}...`;
      if (badgeEl) {
        badgeEl.textContent = '0';
        badgeEl.style.display = 'inline-block';
        badgeEl.style.background = '#94a3b8';
      }
    } else if (isAll) {
      labelEl.textContent = config.allOptionText;
      if (badgeEl) {
        badgeEl.textContent = totalAvailable > 0 ? String(totalAvailable) : 'Tất cả';
        badgeEl.style.display = 'inline-block';
        badgeEl.style.background = '#0284c7';
      }
    } else {
      const arr = Array.from(selectedSet);
      if (arr.length === 1) {
        labelEl.textContent = arr[0];
        if (badgeEl) {
          badgeEl.textContent = '1';
          badgeEl.style.display = 'inline-block';
          badgeEl.style.background = '#0284c7';
        }
      } else if (arr.length === 2) {
        labelEl.textContent = `${arr[0]}, ${arr[1]}`;
        if (badgeEl) {
          badgeEl.textContent = '2';
          badgeEl.style.display = 'inline-block';
          badgeEl.style.background = '#0284c7';
        }
      } else {
        labelEl.textContent = `${arr[0]}, ${arr[1]} (+${arr.length - 2})`;
        if (badgeEl) {
          badgeEl.textContent = String(arr.length);
          badgeEl.style.display = 'inline-block';
          badgeEl.style.background = '#0284c7';
        }
      }
    }

    // Đồng bộ vào select ẩn nếu có
    if (config.key === 'selectedOrganisms') {
      const sel = document.getElementById('abg-select-organism');
      if (sel) sel.value = isAll ? 'ALL' : (isEmpty ? '' : Array.from(selectedSet)[0]);
    } else if (config.key === 'selectedSpecimens') {
      const sel = document.getElementById('abg-select-specimen');
      if (sel) sel.value = isAll ? 'ALL' : (isEmpty ? '' : Array.from(selectedSet)[0]);
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

    const abxs = (this.state.selectedAntibiotics.has('ALL') || this.state.selectedAntibiotics.size === 0)
      ? 'ALL'
      : Array.from(this.state.selectedAntibiotics);

    const gender = this.state.selectedGender || 'ALL';
    const year = this.state.selectedYear || 'ALL';
    const activeFile = window.App?.state?.filters?.file;

    // Cập nhật tiêu đề báo cáo
    const titleEl = document.getElementById('abg-report-title');
    const badgesEl = document.getElementById('abg-active-filter-badges');
    const bannerEl = document.getElementById('abg-adaptive-banner');

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

    let deptTitleText = 'Toàn viện';
    if (Array.isArray(depts)) {
      if (depts.length === 1) deptTitleText = depts[0];
      else deptTitleText = `${depts.join(', ')} (${depts.length} khoa)`;
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
      if (Array.isArray(abxs)) {
        badgesEl.innerHTML += `<span class="abg-filter-badge" style="background:#e0f2fe; color:#0369a1; border-color:#bae6fd;"><i class="fa-solid fa-capsules"></i> Kháng sinh: ${abxs.join(', ')}</span>`;
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

    // Sinh bảng Antibiogram qua AnalyticsService đa tiêu chí (Tách đủ 63 loại kháng sinh)
    let rows = window.AnalyticsService.generateAntibiogram(astList, orgs, specs, depts, gender, year, abxs);

    if (rows.length > 0) {
      if (bannerEl) {
        bannerEl.style.display = 'none';
        bannerEl.innerHTML = '';
      }
      this.renderTable(rows);
      this.renderChart(rows);
      return;
    }

    // Xử lý thông minh khi tổ hợp trả về 0 kết quả
    if (bannerEl) {
      const hasSpecificOrg = orgs !== 'ALL' && Array.isArray(orgs) && orgs.length > 0;
      const hasSpecificDept = depts !== 'ALL' && Array.isArray(depts) && depts.length > 0;
      const hasSpecificSpec = specs !== 'ALL' && Array.isArray(specs) && specs.length > 0;

      // 1. Kiểm tra nếu vi khuẩn đã chọn có tại khoa này trên các bệnh phẩm khác
      if (hasSpecificOrg && hasSpecificDept) {
        const orgInDept = window.AnalyticsService.generateAntibiogram(astList, orgs, 'ALL', depts, gender, year);
        if (orgInDept.length > 0) {
          const availSpecs = [];
          (this.state.availableSpecimens || []).forEach(sp => {
            if (window.AnalyticsService.generateAntibiogram(astList, orgs, sp, depts, gender, year).length > 0) {
              availSpecs.push(sp);
            }
          });

          let quickBtns = availSpecs.slice(0, 3).map(sp => 
            `<button type="button" class="btn btn-sm btn-primary abg-quick-spec" data-spec="${sp}" style="font-size: 12px; padding: 4px 10px; cursor: pointer; border-radius: 4px; background: #0284c7; color: #fff; border: none; margin-right: 6px;">👉 Xem trên "${sp}"</button>`
          ).join('');

          bannerEl.style.display = 'block';
          bannerEl.innerHTML = `
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 12px 16px; border-radius: 8px; font-size: 13px;">
              <div style="font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-circle-info" style="color: #2563eb; font-size: 16px;"></i>
                <span>Tại <strong>${deptTitleText}</strong>, vi khuẩn <strong>${orgTitleText}</strong> không có mẫu trên bệnh phẩm <strong>${specTitleText}</strong>.</span>
              </div>
              <div style="margin-bottom: 8px;">
                💡 Tại khoa này, vi khuẩn được phân lập trên: <strong>${availSpecs.join(', ')}</strong> (${orgInDept.length} kháng sinh thử nghiệm).
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                ${quickBtns}
                <button type="button" id="btn-quick-all-specs" style="font-size: 12px; padding: 4px 10px; cursor: pointer; border-radius: 4px; background: #fff; color: #0284c7; border: 1px solid #0284c7;">👉 Tất cả bệnh phẩm tại khoa</button>
                <button type="button" id="btn-quick-whole-hosp" style="font-size: 12px; padding: 4px 10px; cursor: pointer; border-radius: 4px; background: #fff; color: #475569; border: 1px solid #cbd5e1;">👉 Xem Toàn viện</button>
              </div>
            </div>
          `;

          bannerEl.querySelectorAll('.abg-quick-spec').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const sp = e.target.getAttribute('data-spec');
              this.state.selectedSpecimens.clear();
              this.state.selectedSpecimens.add(sp);
              this.refreshCheckboxesInList('list-ms-specimen', 'selectedSpecimens', 'Tất cả bệnh phẩm');
              this.renderAntibiogram();
            });
          });

          const btnAll = document.getElementById('btn-quick-all-specs');
          if (btnAll) {
            btnAll.addEventListener('click', () => {
              this.state.selectedSpecimens.clear();
              this.state.selectedSpecimens.add('ALL');
              this.refreshCheckboxesInList('list-ms-specimen', 'selectedSpecimens', 'Tất cả bệnh phẩm');
              this.renderAntibiogram();
            });
          }

          const btnHosp = document.getElementById('btn-quick-whole-hosp');
          if (btnHosp) {
            btnHosp.addEventListener('click', () => {
              this.state.selectedDepartments.clear();
              this.state.selectedDepartments.add('ALL');
              this.refreshCheckboxesInList('list-ms-department', 'selectedDepartments', 'Toàn viện (Tất cả khoa)');
              this.renderAntibiogram();
            });
          }

          this.renderTable([]);
          this.renderChart([]);
          return;
        }
      }

      // 2. Nếu vi khuẩn có tại các khoa khác
      if (hasSpecificOrg) {
        const orgAnywhere = window.AnalyticsService.generateAntibiogram(astList, orgs, 'ALL', 'ALL', gender, year);
        if (orgAnywhere.length > 0) {
          bannerEl.style.display = 'block';
          bannerEl.innerHTML = `
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 12px 16px; border-radius: 8px; font-size: 13px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              <div>
                <i class="fa-solid fa-circle-info" style="color: #2563eb; font-size: 16px; margin-right: 8px;"></i>
                <span>Không tìm thấy mẫu <strong>${orgTitleText}</strong> tại tiêu chí đang chọn. Có dữ liệu trên Toàn viện (${orgAnywhere.length} loại kháng sinh).</span>
              </div>
              <button type="button" id="btn-quick-org-all" class="btn btn-sm btn-primary" style="white-space: nowrap; font-size: 12px; padding: 4px 10px; cursor: pointer; border-radius: 4px; background: #0284c7; color: #fff; border: none;">
                👉 Xem ${orgTitleText} trên Toàn viện
              </button>
            </div>
          `;
          const btnAllHosp = document.getElementById('btn-quick-org-all');
          if (btnAllHosp) {
            btnAllHosp.addEventListener('click', () => {
              this.state.selectedDepartments.clear();
              this.state.selectedDepartments.add('ALL');
              this.refreshCheckboxesInList('list-ms-department', 'selectedDepartments', 'Toàn viện (Tất cả khoa)');
              this.state.selectedSpecimens.clear();
              this.state.selectedSpecimens.add('ALL');
              this.refreshCheckboxesInList('list-ms-specimen', 'selectedSpecimens', 'Tất cả bệnh phẩm');
              this.renderAntibiogram();
            });
          }
          this.renderTable([]);
          this.renderChart([]);
          return;
        }
      }

      bannerEl.style.display = 'none';
      bannerEl.innerHTML = '';
    }

    this.state.lastRows = rows;
    this.updateSummaryKPIs(rows);
    this.renderTable(rows);
    this.renderChart(rows);
  },

  setViewMode(mode) {
    this.state.viewMode = mode;
    document.querySelectorAll('.btn-abg-mode').forEach(btn => {
      if (btn.getAttribute('data-mode') === mode) {
        btn.classList.add('active');
        btn.style.background = '#0284c7';
        btn.style.color = '#ffffff';
      } else {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.color = '#475569';
      }
    });

    const secTable = document.getElementById('abg-section-table');
    const secChart = document.getElementById('abg-section-chart');
    if (secTable && secChart) {
      if (mode === 'both') {
        secTable.style.display = 'block';
        secChart.style.display = 'block';
      } else if (mode === 'table') {
        secTable.style.display = 'block';
        secChart.style.display = 'none';
      } else if (mode === 'chart') {
        secTable.style.display = 'none';
        secChart.style.display = 'block';
      }
    }
  },

  updateSortButtonsUI(activeBtnId) {
    ['btn-chart-sort-default', 'btn-chart-sort-r', 'btn-chart-sort-s'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      if (id === activeBtnId) {
        btn.classList.add('active');
        btn.style.background = '#f1f5f9';
        btn.style.borderColor = '#cbd5e1';
        btn.style.color = '#0369a1';
        btn.style.fontWeight = '700';
      } else {
        btn.classList.remove('active');
        btn.style.background = '#ffffff';
        btn.style.borderColor = '#e2e8f0';
        btn.style.color = '#475569';
        btn.style.fontWeight = '500';
      }
    });
  },

  updateSummaryKPIs(rows = []) {
    const totalAbxEl = document.getElementById('kpi-abg-total-abx');
    const maxREl = document.getElementById('kpi-abg-max-r');
    const maxSEl = document.getElementById('kpi-abg-max-s');
    const badgeTextEl = document.getElementById('abg-badge-text');

    if (totalAbxEl) totalAbxEl.textContent = rows.length;
    if (badgeTextEl) badgeTextEl.textContent = `${rows.length} Kháng Sinh`;

    if (rows.length > 0) {
      const sortedByR = [...rows].sort((a, b) => b.rRate - a.rRate);
      const sortedByS = [...rows].sort((a, b) => b.sRate - a.sRate);
      if (maxREl) maxREl.textContent = `${sortedByR[0].code} (${sortedByR[0].rRate}%)`;
      if (maxSEl) maxSEl.textContent = `${sortedByS[0].code} (${sortedByS[0].sRate}%)`;
    } else {
      if (maxREl) maxREl.textContent = '--';
      if (maxSEl) maxSEl.textContent = '--';
    }
  },

  renderTable(rows = []) {
    const tbody = document.getElementById('table-abg-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding: 36px 16px; color: #64748b;">
            <i class="fa-solid fa-filter-circle-xmark" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">Không có dữ liệu kháng sinh đồ cho các tiêu chí lọc đã chọn</div>
            <div style="font-size: 12px; color: #94a3b8;">Thử chọn lại tiêu chí "Tất cả vi khuẩn" hoặc "Toàn viện (Tất cả khoa)" để xem tổng quan.</div>
          </td>
        </tr>
      `;
      return;
    }

    rows.forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted); font-size: 12px;">${r.stt || (idx + 1)}</td>
        <td><strong style="color: #0369a1; font-family: monospace; font-size: 13px;">${r.code}</strong></td>
        <td>
          <div style="font-weight: 600; color: var(--text-main); font-size: 13.5px;">${r.name || r.code}</div>
          ${r.indication ? `<div style="font-size: 11.5px; color: #475569; margin-top: 2px;"><i class="fa-solid fa-notes-medical" style="font-size: 10px; color: #0284c7;"></i> ${r.indication}</div>` : ''}
        </td>
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
      this.currentChart = null;
    }

    if (rows.length === 0) return;

    let chartRows = [...rows];
    if (this.state.chartSortMode === 'r_desc') {
      chartRows.sort((a, b) => b.rRate - a.rRate);
    } else if (this.state.chartSortMode === 's_desc') {
      chartRows.sort((a, b) => b.sRate - a.sRate);
    }

    // Co giãn chiều cao động để bao quát tất cả thông số rõ ràng, không bị dẹp lép
    const innerContainer = document.getElementById('chart-abg-inner');
    if (innerContainer) {
      const calculatedHeight = Math.max(460, chartRows.length * 28 + 60);
      innerContainer.style.height = `${calculatedHeight}px`;
    }

    const labels = chartRows.map(r => r.name ? `${r.code} - ${r.name}` : r.code);
    const sRates = chartRows.map(r => r.sRate);
    const iRates = chartRows.map(r => r.iRate);
    const rRates = chartRows.map(r => r.rRate);

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
          y: { stacked: true, ticks: { font: { size: 12, weight: '600' } } }
        },
        plugins: {
          legend: { position: 'top', labels: { font: { weight: '600' } } },
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
    const abxs = (this.state.selectedAntibiotics.has('ALL') || this.state.selectedAntibiotics.size === 0)
      ? 'ALL'
      : Array.from(this.state.selectedAntibiotics);
    const gender = this.state.selectedGender || 'ALL';
    const year = this.state.selectedYear || 'ALL';

    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    const astList = window.App?.getActiveAstRecords ? window.App.getActiveAstRecords() : (data.astResults || []);
    const rows = window.AnalyticsService.generateAntibiogram(astList, orgs, specs, depts, gender, year, abxs);

    if (rows.length === 0) {
      window.Toast?.info('Không có dữ liệu để xuất file!');
      return;
    }

    const excelRows = rows.map((r, idx) => ({
      'STT': r.stt || (idx + 1),
      'Mã kháng sinh': r.code,
      'Tên kháng sinh': r.name,
      'Phiên giải dùng (Chỉ định điều trị)': r.indication || '',
      'Nhóm kháng sinh': r.group || '',
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
