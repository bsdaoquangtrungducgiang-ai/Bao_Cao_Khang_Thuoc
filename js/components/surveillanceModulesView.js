/**
 * SURVEILLANCE MODULES VIEW COMPONENT - BAO-CAO-KHANG-THUOC
 * Xử lý các màn hình chuyên sâu: MDR/XDR, ESBL, Carbapenem, MRSA, Dịch tễ học, Kháng theo khoa
 */

const SurveillanceModulesView = {
  charts: {},

  getAstList(data) {
    return window.App?.getActiveAstRecords ? window.App.getActiveAstRecords() : (data?.astResults || []);
  },

  init() {
    window.addEventListener('tabChanged', (e) => {
      const tab = e.detail.tab;
      if (tab === 'analytics_mdr') this.renderMDR();
      else if (tab === 'analytics_esbl') this.renderESBL();
      else if (tab === 'analytics_carbapenem') this.renderCarbapenem();
      else if (tab === 'analytics_mrsa') this.renderMRSA();
      else if (tab === 'analytics_epi') this.renderEpidemiology();
      else if (tab === 'analytics_resistance') this.renderResistanceByDept();
    });
  },

  // 1. GIÁM SÁT VI KHUẨN ĐA KHÁNG MDR / XDR / PDR (Section XXIV)
  renderMDR() {
    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    if (!data) return;

    const astList = this.getAstList(data);
    const res = window.SpecializedAMRService.analyzeMDR(astList, data.cultures || []);

    document.getElementById('mdr-stat-total').textContent = res.totalIsolates;
    document.getElementById('mdr-stat-count').textContent = res.mdrCount;
    document.getElementById('mdr-stat-rate').textContent = `${res.mdrRate}%`;
    document.getElementById('xdr-stat-count').textContent = res.xdrCount;
    document.getElementById('pdr-stat-count').textContent = res.pdrCount;

    // Render bảng các chủng vi khuẩn phân loại MDR/XDR
    const tbody = document.getElementById('table-mdr-body');
    if (tbody) {
      tbody.innerHTML = '';
      res.isolates.slice(0, 30).forEach((c, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="text-align: center; color: var(--text-muted);">${idx + 1}</td>
          <td><strong>${c.organism_name}</strong></td>
          <td>${c.patient_code}</td>
          <td><span class="badge-tag">${c.specimen_type || '-'}</span></td>
          <td style="text-align: center;"><span class="badge-status ${c.badgeClass}">${c.classification}</span></td>
          <td style="text-align: center;"><strong>${c.resistantCount}</strong> / ${c.testedCount} nhóm</td>
          <td>${c.tested_date || '-'}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  },

  // 2. GIÁM SÁT VI KHUẨN TIẾT MEN ESBL (Section XXV)
  renderESBL() {
    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    if (!data) return;

    const res = window.SpecializedAMRService.analyzeESBL(this.getAstList(data));

    document.getElementById('esbl-stat-total').textContent = res.totalCultures;
    document.getElementById('esbl-stat-count').textContent = res.esblCount;
    document.getElementById('esbl-stat-rate').textContent = `${res.esblRate}%`;

    const ctx = document.getElementById('chart-esbl-donut')?.getContext('2d');
    if (ctx && typeof Chart !== 'undefined') {
      if (this.charts.esbl) this.charts.esbl.destroy();
      this.charts.esbl = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Nghi ngờ ESBL (+) Dương tính', 'ESBL (-) Âm tính'],
          datasets: [{
            data: [res.esblCount, res.nonEsblCount],
            backgroundColor: ['#dc2626', '#10b981'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          cutout: '70%'
        }
      });
    }
  },

  // 3. GIÁM SÁT KHÁNG CARBAPENEM (Section XXVI - CRE, CRAB, CRPA)
  renderCarbapenem() {
    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    if (!data) return;

    const res = window.SpecializedAMRService.analyzeCarbapenemResistance(this.getAstList(data));
    const tbody = document.getElementById('table-carbapenem-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    for (const org in res) {
      const mem = res[org]['MEM'] || { rRate: 0, sRate: 0, denominator: 0 };
      const ipm = res[org]['IPM'] || { rRate: 0, sRate: 0, denominator: 0 };
      const etp = res[org]['ETP'] || { rRate: 0, sRate: 0, denominator: 0 };

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${org}</strong></td>
        <td style="text-align: center; font-weight: 700; color: ${mem.rRate > 20 ? 'var(--color-r)' : 'var(--color-s)'};">
          ${mem.rRate}% <span style="font-size: 11px; color: var(--text-muted);">(${mem.denominator} mẫu)</span>
        </td>
        <td style="text-align: center; font-weight: 700; color: ${ipm.rRate > 20 ? 'var(--color-r)' : 'var(--color-s)'};">
          ${ipm.rRate}% <span style="font-size: 11px; color: var(--text-muted);">(${ipm.denominator} mẫu)</span>
        </td>
        <td style="text-align: center; font-weight: 700; color: ${etp.rRate > 20 ? 'var(--color-r)' : 'var(--color-s)'};">
          ${etp.rRate}% <span style="font-size: 11px; color: var(--text-muted);">(${etp.denominator} mẫu)</span>
        </td>
      `;
      tbody.appendChild(tr);
    }
  },

  // 4. GIÁM SÁT MRSA (Section XXVII)
  renderMRSA() {
    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    if (!data) return;

    const res = window.SpecializedAMRService.analyzeMRSA(this.getAstList(data));

    document.getElementById('mrsa-stat-total').textContent = res.totalStaph;
    document.getElementById('mrsa-stat-count').textContent = res.mrsaCount;
    document.getElementById('mrsa-stat-rate').textContent = `${res.mrsaRate}%`;
    document.getElementById('mssa-stat-count').textContent = res.mssaCount;

    const ctx = document.getElementById('chart-mrsa-donut')?.getContext('2d');
    if (ctx && typeof Chart !== 'undefined') {
      if (this.charts.mrsa) this.charts.mrsa.destroy();
      this.charts.mrsa = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['MRSA (Kháng Methicillin)', 'MSSA (Nhạy Methicillin)'],
          datasets: [{
            data: [res.mrsaCount, res.mssaCount],
            backgroundColor: ['#ef4444', '#10b981'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          cutout: '70%'
        }
      });
    }
  },

  // 5. DỊCH TỄ HỌC VI SINH (Section XVIII)
  renderEpidemiology() {
    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    if (!data) return;

    const f = window.App?.state?.filters;
    let cultures = data.cultures || [];
    let specimens = data.specimens || [];
    if (f && f.file && f.file !== 'ALL') {
      cultures = cultures.filter(c => c.file_name === f.file || c.import_job_id === f.file);
      specimens = specimens.filter(s => s.file_name === f.file || s.import_job_id === f.file);
    }

    const orgDist = window.AnalyticsService.getOrganismDistribution(cultures);
    const specDist = window.AnalyticsService.getSpecimenDistribution(specimens);

    const ctxOrg = document.getElementById('chart-epi-org')?.getContext('2d');
    if (ctxOrg && typeof Chart !== 'undefined') {
      if (this.charts.epiOrg) this.charts.epiOrg.destroy();
      this.charts.epiOrg = new Chart(ctxOrg, {
        type: 'bar',
        data: {
          labels: orgDist.slice(0, 8).map(d => d.name),
          datasets: [{
            label: 'Số mẫu phân lập',
            data: orgDist.slice(0, 8).map(d => d.count),
            backgroundColor: '#0284c7'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y'
        }
      });
    }

    const ctxSpec = document.getElementById('chart-epi-spec')?.getContext('2d');
    if (ctxSpec && typeof Chart !== 'undefined') {
      if (this.charts.epiSpec) this.charts.epiSpec.destroy();
      this.charts.epiSpec = new Chart(ctxSpec, {
        type: 'pie',
        data: {
          labels: specDist.slice(0, 6).map(d => d.type),
          datasets: [{
            data: specDist.slice(0, 6).map(d => d.count),
            backgroundColor: ['#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#cbd5e1']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }
  },

  // 6. PHÂN TÍCH KHÁNG THEO KHOA PHÒNG (Section XXIII)
  renderResistanceByDept() {
    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    if (!data) return;

    const res = window.AnalyticsService.getResistanceByDepartment(
      this.getAstList(data),
      data.specimens || [],
      'Escherichia coli',
      'CRO'
    );

    const tbody = document.getElementById('table-dept-res-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    res.forEach((d, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted);">${idx + 1}</td>
        <td><strong>${d.department}</strong></td>
        <td style="text-align: center; font-weight: 700; color: var(--color-r);">${d.rRate}%</td>
        <td style="text-align: center; font-weight: 700; color: var(--color-i);">${d.iRate}%</td>
        <td style="text-align: center; font-weight: 700; color: var(--color-s);">${d.sRate}%</td>
        <td style="text-align: center; font-weight: 600;">${d.total}</td>
      `;
      tbody.appendChild(tr);
    });
  }
};

if (typeof window !== 'undefined') {
  window.SurveillanceModulesView = SurveillanceModulesView;
}
