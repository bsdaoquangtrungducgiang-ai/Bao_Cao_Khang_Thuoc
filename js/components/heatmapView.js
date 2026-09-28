/**
 * HEATMAP VIEW COMPONENT - BAO-CAO-KHANG-THUOC
 * Ma trận Heatmap Kháng kháng sinh đa chiều theo mục XXI
 */

const HeatmapView = {
  currentFilter: 'ALL',

  init() {
    this.bindEvents();
    window.addEventListener('tabChanged', (e) => {
      if (e.detail.tab === 'analytics_heatmap') {
        this.renderHeatmap();
      }
    });
  },

  bindEvents() {
    const filterSelect = document.getElementById('heatmap-filter-group');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.renderHeatmap();
      });
    }

    const btnExport = document.getElementById('btn-export-heatmap');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportHeatmap());
    }
  },

  renderHeatmap() {
    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    if (!data) return;

    let targetOrgs = [
      'Escherichia coli',
      'Klebsiella pneumoniae',
      'Pseudomonas aeruginosa',
      'Acinetobacter baumannii',
      'Staphylococcus aureus',
      'Enterococcus faecalis',
      'Streptococcus pneumoniae'
    ];

    if (this.currentFilter === 'negative') {
      targetOrgs = ['Escherichia coli', 'Klebsiella pneumoniae', 'Pseudomonas aeruginosa', 'Acinetobacter baumannii'];
    } else if (this.currentFilter === 'positive') {
      targetOrgs = ['Staphylococcus aureus', 'Enterococcus faecalis', 'Streptococcus pneumoniae'];
    }

    const targetAbxs = ['AMP', 'AMC', 'TZP', 'CTX', 'CRO', 'CAZ', 'FEP', 'MEM', 'IPM', 'CIP', 'LEV', 'GEN', 'AMK', 'SXT', 'VAN'];

    const result = window.AnalyticsService.generateHeatmap(data.astResults || [], targetOrgs, targetAbxs);

    const thead = document.getElementById('table-heatmap-head');
    const tbody = document.getElementById('table-heatmap-body');
    if (!thead || !tbody) return;

    // 1. Render Header
    thead.innerHTML = '';
    const trHead = document.createElement('tr');
    trHead.innerHTML = '<th style="position: sticky; left: 0; background: #f1f5f9; z-index: 20; min-width: 220px;">Vi khuẩn phân lập</th>';
    result.antibiotics.forEach(abx => {
      const th = document.createElement('th');
      th.style.textAlign = 'center';
      th.style.minWidth = '65px';
      th.textContent = abx;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // 2. Render Rows
    tbody.innerHTML = '';
    result.matrix.forEach(row => {
      const tr = document.createElement('tr');
      const tdName = document.createElement('td');
      tdName.style.position = 'sticky';
      tdName.style.left = '0';
      tdName.style.background = '#ffffff';
      tdName.style.fontWeight = '600';
      tdName.style.zIndex = '15';
      tdName.textContent = row.organism;
      tr.appendChild(tdName);

      result.antibiotics.forEach(abx => {
        const td = document.createElement('td');
        td.style.textAlign = 'center';
        const cell = row.cells[abx];

        if (!cell || cell.count === 0) {
          td.textContent = '-';
          td.style.color = '#94a3b8';
          td.style.background = '#f8fafc';
        } else {
          const r = cell.rRate;
          td.textContent = `${r}%`;
          td.title = `${row.organism} vs ${abx}: ${r}% Kháng (Tổng số mẫu: ${cell.count})`;

          // Phối màu Heatmap y tế chuẩn
          if (r < 20) {
            td.style.backgroundColor = '#d1fae5'; // Xanh lá
            td.style.color = '#065f46';
            td.style.fontWeight = '600';
          } else if (r <= 50) {
            td.style.backgroundColor = '#fef3c7'; // Vàng cam
            td.style.color = '#92400e';
            td.style.fontWeight = '600';
          } else {
            td.style.backgroundColor = '#fee2e2'; // Đỏ
            td.style.color = '#991b1b';
            td.style.fontWeight = '700';
          }
        }
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  },

  exportHeatmap() {
    const table = document.getElementById('table-heatmap');
    if (!table) return;
    const wb = XLSX.utils.table_to_book(table, { sheet: 'Heatmap_AMR' });
    XLSX.writeFile(wb, `Heatmap_Khang_Thuoc_${new Date().toISOString().split('T')[0]}.xlsx`);
    window.Toast.success('Đã xuất file Heatmap Excel thành công!');
  }
};

if (typeof window !== 'undefined') {
  window.HeatmapView = HeatmapView;
}
