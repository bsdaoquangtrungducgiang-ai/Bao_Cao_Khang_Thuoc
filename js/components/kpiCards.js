/**
 * KPI CARDS COMPONENT - BAO-CAO-KHANG-THUOC
 * Hiển thị các chỉ số y tế then chốt theo mục XVI & L
 */

const KPICards = {
  render(stats = {}) {
    const elPatients = document.getElementById('kpi-patients');
    const elSpecimens = document.getElementById('kpi-specimens');
    const elCultures = document.getElementById('kpi-cultures');
    const elAst = document.getElementById('kpi-ast');
    const elRateS = document.getElementById('kpi-rate-s');
    const elRateI = document.getElementById('kpi-rate-i');
    const elRateR = document.getElementById('kpi-rate-r');
    const elOrganisms = document.getElementById('kpi-organisms');
    const elAntibiotics = document.getElementById('kpi-antibiotics');

    if (elPatients) {
      elPatients.textContent = (stats.totalPatients || 0).toLocaleString();
      const elSub = document.getElementById('kpi-patients-subtext');
      if (elSub) {
        if (stats.distinctPatients && stats.distinctPatients !== stats.totalPatients) {
          elSub.textContent = `${stats.distinctPatients.toLocaleString()} bệnh nhân duy nhất (PID)`;
        } else {
          elSub.textContent = 'Hồ sơ bệnh nhân nội / ngoại trú';
        }
      }
    }
    if (elSpecimens) elSpecimens.textContent = (stats.totalSpecimens || 0).toLocaleString();
    if (elCultures) elCultures.textContent = (stats.totalCultures || 0).toLocaleString();
    if (elAst) elAst.textContent = (stats.totalAst || 0).toLocaleString();

    if (elRateS) elRateS.textContent = `${stats.sRate ?? 0}%`;
    if (elRateI) elRateI.textContent = `${stats.iRate ?? 0}%`;
    if (elRateR) elRateR.textContent = `${stats.rRate ?? 0}%`;

    if (elOrganisms) elOrganisms.textContent = stats.totalOrganismTypes || 0;
    if (elAntibiotics) elAntibiotics.textContent = stats.totalAntibioticTypes || 0;

    // Cập nhật thanh tỷ lệ S/I/R (Mini stacked bar)
    const barS = document.getElementById('bar-rate-s');
    const barI = document.getElementById('bar-rate-i');
    const barR = document.getElementById('bar-rate-r');

    if (barS) barS.style.width = `${stats.sRate || 0}%`;
    if (barI) barI.style.width = `${stats.iRate || 0}%`;
    if (barR) barR.style.width = `${stats.rRate || 0}%`;
  }
};

if (typeof window !== 'undefined') {
  window.KPICards = KPICards;
}
