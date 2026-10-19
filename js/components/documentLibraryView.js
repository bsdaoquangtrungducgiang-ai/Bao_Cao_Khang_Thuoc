/**
 * THƯ VIỆN TÀI LIỆU CHUYÊN MÔN & TIÊU CHUẨN CLSI - BAO-CAO-KHANG-THUOC
 * Giao diện tra cứu, phân loại và quản lý 42 tài liệu chuyên môn Vi sinh & AMR
 */

const DocumentLibraryView = {
  activeCategory: 'ALL',
  searchQuery: '',
  activeFormat: 'ALL',

  init() {
    this.renderStats();
    this.bindEvents();
    this.renderDocuments();
  },

  renderStats() {
    const data = window.DocumentLibraryData;
    if (!data) return;

    const totalDocs = data.documents.length;
    const totalCats = data.categories.length;
    const formatCounts = data.documents.reduce((acc, d) => {
      acc[d.format] = (acc[d.format] || 0) + 1;
      return acc;
    }, {});

    const elTotal = document.getElementById('doc-stat-total');
    if (elTotal) elTotal.textContent = `${totalDocs} Tài liệu`;

    const elCats = document.getElementById('doc-stat-cats');
    if (elCats) elCats.textContent = `${totalCats} Chuyên mục`;

    const elFormats = document.getElementById('doc-stat-formats');
    if (elFormats) {
      elFormats.textContent = `PDF: ${formatCounts['PDF'] || 0} | Excel: ${formatCounts['XLSX'] || 0} | PPTX: ${formatCounts['PPTX'] || 0} | Word: ${formatCounts['DOCX'] || 0}`;
    }
  },

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('doc-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderDocuments();
      });
    }

    // Category filter pills
    document.querySelectorAll('.doc-cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.doc-cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeCategory = pill.getAttribute('data-cat') || 'ALL';
        this.renderDocuments();
      });
    });

    // Format filter dropdown
    const formatSelect = document.getElementById('doc-format-select');
    if (formatSelect) {
      formatSelect.addEventListener('change', (e) => {
        this.activeFormat = e.target.value;
        this.renderDocuments();
      });
    }

    // Global copy handler
    document.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.btn-copy-doc-path');
      if (copyBtn) {
        const path = copyBtn.getAttribute('data-path');
        if (path && navigator.clipboard) {
          navigator.clipboard.writeText(path).then(() => {
            window.Toast?.success(`Đã sao chép đường dẫn: ${path}`);
          }).catch(() => {
            window.Toast?.info(`Đường dẫn tài liệu: ${path}`);
          });
        }
      }
    });
  },

  getFormatBadge(fmt) {
    const styles = {
      'PDF': { bg: '#fee2e2', text: '#b91c1c', icon: 'fa-file-pdf' },
      'XLSX': { bg: '#dcfce7', text: '#15803d', icon: 'fa-file-excel' },
      'PPTX': { bg: '#ffedd5', text: '#c2410c', icon: 'fa-file-powerpoint' },
      'DOCX': { bg: '#dbeafe', text: '#1d4ed8', icon: 'fa-file-word' },
      'PNG': { bg: '#f3e8ff', text: '#7e22ce', icon: 'fa-file-image' }
    };
    const s = styles[fmt] || { bg: '#f1f5f9', text: '#475569', icon: 'fa-file' };
    return `<span class="badge" style="background:${s.bg}; color:${s.text}; font-weight:700; font-size:11px; padding:3px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:4px;">
      <i class="fa-solid ${s.icon}"></i> ${fmt}
    </span>`;
  },

  renderDocuments() {
    const container = document.getElementById('doc-library-list');
    if (!container) return;

    const data = window.DocumentLibraryData;
    if (!data) {
      container.innerHTML = '<div style="padding:20px; color:var(--text-muted);">Đang tải danh mục tài liệu...</div>';
      return;
    }

    let filtered = data.documents.filter(doc => {
      // Filter by category
      if (this.activeCategory !== 'ALL' && doc.cat_id !== this.activeCategory) {
        return false;
      }
      // Filter by format
      if (this.activeFormat !== 'ALL' && doc.format !== this.activeFormat) {
        return false;
      }
      // Filter by search query
      if (this.searchQuery) {
        const matchTitle = doc.title.toLowerCase().includes(this.searchQuery);
        const matchCat = doc.cat_name.toLowerCase().includes(this.searchQuery);
        const matchDesc = doc.desc.toLowerCase().includes(this.searchQuery);
        const matchTags = doc.tags.some(t => t.toLowerCase().includes(this.searchQuery));
        if (!matchTitle && !matchCat && !matchDesc && !matchTags) {
          return false;
        }
      }
      return true;
    });

    const resultCountEl = document.getElementById('doc-result-count');
    if (resultCountEl) {
      resultCountEl.textContent = `Hiển thị ${filtered.length} / ${data.documents.length} tài liệu`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 48px 16px; background:var(--bg-card); border-radius:12px; border:1px dashed var(--border-color); grid-column:1/-1;">
          <i class="fa-solid fa-folder-open" style="font-size: 36px; color: var(--text-muted); margin-bottom: 12px;"></i>
          <h4 style="margin: 0 0 6px 0; color: var(--text-main);">Không tìm thấy tài liệu phù hợp</h4>
          <p style="margin: 0; color: var(--text-muted); font-size: 13px;">Hãy thử đổi từ khóa tìm kiếm hoặc bấm chọn "Tất cả chuyên mục".</p>
        </div>
      `;
      return;
    }

    // Render cards
    container.innerHTML = filtered.map(doc => {
      const tagsHtml = doc.tags.map(t => `<span style="background:var(--bg-tag, #f1f5f9); color:var(--text-muted); padding:2px 7px; border-radius:4px; font-size:11px;">#${t}</span>`).join(' ');
      return `
        <div class="doc-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s, box-shadow 0.2s;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 10px;">
              <div>${this.getFormatBadge(doc.format)}</div>
              <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 500;">
                <i class="fa-solid fa-hard-drive"></i> ${doc.size_mb} MB
              </span>
            </div>
            
            <h4 style="font-size: 14px; font-weight: 600; line-height: 1.45; margin: 0 0 8px 0; color: var(--text-main);" title="${doc.title}">
              ${doc.title}
            </h4>

            <div style="font-size: 12px; color: var(--primary); font-weight: 500; margin-bottom: 8px; display: flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-layer-group"></i> ${doc.cat_name}
            </div>

            <p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.5; margin: 0 0 12px 0;">
              ${doc.desc}
            </p>
          </div>

          <div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px;">
              ${tagsHtml}
            </div>

            <div style="background: var(--bg-main, #f8fafc); border-radius: 6px; padding: 8px 10px; font-size: 11.5px; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center; gap: 8px;">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: monospace;">
                📁 ${doc.path}
              </span>
              <button class="btn-copy-doc-path" data-path="${doc.path}" title="Sao chép đường dẫn file" style="background: none; border: none; cursor: pointer; color: var(--primary); font-size: 13px; padding: 2px 4px;">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
};

if (typeof window !== 'undefined') {
  window.DocumentLibraryView = DocumentLibraryView;
}
