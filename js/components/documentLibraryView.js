/**
 * THƯ VIỆN TÀI LIỆU CHUYÊN MÔN & TIÊU CHUẨN CLSI - BAO-CAO-KHANG-THUOC
 * Giao diện tra cứu, phân loại, quản lý và XEM TRỰC TIẾP 42 tài liệu chuyên môn Vi sinh & AMR
 */

const DocumentLibraryView = {
  activeCategory: 'ALL',
  searchQuery: '',
  activeFormat: 'ALL',
  currentPreviewDoc: null,

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

    // Global click handler: Xem trực tiếp & Copy path
    document.addEventListener('click', (e) => {
      // 1. Nút Xem Trực Tiếp
      const previewBtn = e.target.closest('.btn-preview-doc');
      if (previewBtn) {
        e.preventDefault();
        const docId = previewBtn.getAttribute('data-id');
        const doc = window.DocumentLibraryData?.documents?.find(d => d.id === docId);
        if (doc) {
          this.openPreview(doc);
        } else {
          // Fallback nếu không có id
          const path = previewBtn.getAttribute('data-rawpath');
          const title = previewBtn.getAttribute('data-title');
          const format = previewBtn.getAttribute('data-format');
          const size = previewBtn.getAttribute('data-size');
          const cat = previewBtn.getAttribute('data-cat');
          this.openPreview({ path, title, format, size_mb: size, cat_name: cat });
        }
      }

      // 2. Nút Sao chép đường dẫn
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

      // 3. Đóng modal xem trực tiếp
      if (e.target.closest('.doc-modal-close') || e.target.id === 'doc-preview-modal') {
        this.closePreview();
      }
    });

    // Phím Escape đóng modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closePreview();
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
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">
              ${tagsHtml}
            </div>

            <div style="background: var(--bg-main, #f8fafc); border-radius: 6px; padding: 6px 10px; font-size: 11px; color: var(--text-muted); margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: monospace;">
              📁 ${doc.path}
            </div>

            <!-- Nút Hành Động: Xem Trực Tiếp & Copy Đường Dẫn -->
            <div style="display: flex; gap: 8px;">
              <button class="btn-preview-doc" data-id="${doc.id}" data-path="${encodeURI(doc.path)}" data-rawpath="${doc.path}" data-format="${doc.format}" data-title="${this.escapeAttribute(doc.title)}" data-size="${doc.size_mb}" data-cat="${this.escapeAttribute(doc.cat_name)}" style="flex: 1; height: 34px; border-radius: 6px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #fff; border: none; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 5px rgba(2, 132, 199, 0.25); transition: all 0.15s;">
                <i class="fa-solid fa-eye"></i> Xem Trực Tiếp
              </button>
              <button class="btn-copy-doc-path" data-path="${doc.path}" title="Sao chép đường dẫn file trên máy Mac" style="width: 36px; height: 34px; border-radius: 6px; background: var(--bg-main, #f1f5f9); border: 1px solid var(--border-color); color: var(--text-muted); cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; transition: all 0.15s;">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ==================== TÍNH NĂNG XEM TRỰC TIẾP TÀI LIỆU ====================
  openPreview(doc) {
    this.currentPreviewDoc = doc;
    const modal = document.getElementById('doc-preview-modal');
    if (!modal) return;

    modal.classList.add('open');
    modal.classList.add('active');
    modal.style.display = 'flex';

    // Cập nhật Header
    const titleEl = document.getElementById('doc-preview-title');
    if (titleEl) titleEl.textContent = doc.title;

    const metaEl = document.getElementById('doc-preview-meta');
    if (metaEl) {
      metaEl.textContent = `${doc.format} • ${doc.size_mb} MB • ${doc.cat_name || 'Tài liệu vi sinh'}`;
    }

    const iconEl = document.getElementById('doc-preview-icon');
    if (iconEl) {
      const icons = {
        'PDF': 'fa-file-pdf',
        'XLSX': 'fa-file-excel',
        'PPTX': 'fa-file-powerpoint',
        'DOCX': 'fa-file-word',
        'PNG': 'fa-file-image'
      };
      iconEl.innerHTML = `<i class="fa-solid ${icons[doc.format] || 'fa-file'}"></i>`;
    }

    // Cập nhật liên kết Tải về & Mở ngoài
    const openExtBtn = document.getElementById('doc-preview-open-ext');
    if (openExtBtn) {
      openExtBtn.href = encodeURI(doc.path);
    }

    const downloadBtn = document.getElementById('doc-preview-download');
    if (downloadBtn) {
      downloadBtn.href = encodeURI(doc.path);
      downloadBtn.setAttribute('download', doc.title);
    }

    // Render Preview Body dựa theo định dạng file
    const bodyEl = document.getElementById('doc-preview-body');
    if (!bodyEl) return;

    bodyEl.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 14px;">
        <i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Đang tải tài liệu...
      </div>
    `;

    const encodedPath = encodeURI(doc.path);

    if (doc.format === 'PDF') {
      // 1. Xem trực tiếp PDF bằng iframe trình duyệt
      bodyEl.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; background: #525659;">
          <div style="background: #1e293b; color: #cbd5e1; padding: 6px 16px; font-size: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <span><i class="fa-solid fa-circle-info" style="color: #38bdf8;"></i> Đang đọc tài liệu PDF qua trình xem tích hợp</span>
            <span style="font-size: 11.5px; color: #94a3b8;">${doc.size_mb} MB</span>
          </div>
          <iframe src="${encodedPath}" style="width: 100%; flex: 1; border: none; background: #fff;" title="${doc.title}"></iframe>
        </div>
      `;
    } else if (doc.format === 'PNG') {
      // 2. Xem trực tiếp Ảnh Infographic
      bodyEl.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 24px; overflow: auto; background: #0f172a;">
          <img src="${encodedPath}" alt="${doc.title}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
        </div>
      `;
    } else if (doc.format === 'XLSX') {
      // 3. Xem trực tiếp Bảng tính Excel bằng SheetJS
      this.renderExcelPreview(encodedPath, doc, bodyEl);
    } else {
      // 4. Xem tài liệu Word (.docx) & PowerPoint (.pptx)
      this.renderOfficeDocumentPreview(encodedPath, doc, bodyEl);
    }
  },

  async renderExcelPreview(encodedPath, doc, container) {
    try {
      if (typeof XLSX !== 'undefined') {
        const response = await fetch(encodedPath);
        if (!response.ok) throw new Error('Không thể tải file qua HTTP, chuyển sang bản tóm tắt cấu trúc');
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        const sheetNames = workbook.SheetNames || [];
        const firstSheetName = sheetNames[0] || '';
        const worksheet = workbook.Sheets[firstSheetName];
        const htmlTable = XLSX.utils.sheet_to_html(worksheet, { id: 'excel-preview-table' });

        const tabsHtml = sheetNames.map((s, idx) => `
          <button class="excel-sheet-tab ${idx === 0 ? 'active' : ''}" data-sheet="${s}" style="padding: 6px 14px; border: none; background: ${idx === 0 ? '#0284c7' : 'rgba(255,255,255,0.1)'}; color: #fff; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
            <i class="fa-solid fa-table"></i> ${s}
          </button>
        `).join(' ');

        container.innerHTML = `
          <div style="width: 100%; height: 100%; display: flex; flex-direction: column; background: #ffffff;">
            <!-- Sheet Tabs Header -->
            <div style="background: #0f172a; padding: 8px 16px; display: flex; gap: 8px; align-items: center; border-bottom: 1px solid #e2e8f0; overflow-x: auto;">
              <span style="font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-right: 4px;">Trang tính:</span>
              ${tabsHtml}
            </div>
            
            <!-- Table Container -->
            <div id="excel-sheet-content" style="flex: 1; overflow: auto; padding: 16px; font-size: 12.5px;">
              ${htmlTable}
            </div>
          </div>
        `;

        // Bind sheet tabs click
        container.querySelectorAll('.excel-sheet-tab').forEach(btn => {
          btn.addEventListener('click', () => {
            container.querySelectorAll('.excel-sheet-tab').forEach(b => {
              b.style.background = 'rgba(255,255,255,0.1)';
            });
            btn.style.background = '#0284c7';
            const sheet = btn.getAttribute('data-sheet');
            const ws = workbook.Sheets[sheet];
            const contentEl = container.querySelector('#excel-sheet-content');
            if (contentEl && ws) {
              contentEl.innerHTML = XLSX.utils.sheet_to_html(ws, { id: 'excel-preview-table' });
            }
          });
        });
        return;
      }
    } catch (e) {
      console.warn('[DocumentLibraryView] Direct Excel parse fallback:', e);
    }

    // Fallback nếu chạy local file protocol hoặc SheetJS không parse được
    container.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 30px; background: #0f172a;">
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 28px; max-width: 600px; text-align: center; color: #fff;">
          <div style="width: 56px; height: 56px; border-radius: 12px; background: rgba(34, 197, 94, 0.2); color: #4ade80; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 16px;">
            <i class="fa-solid fa-file-excel"></i>
          </div>
          <h3 style="margin: 0 0 8px 0; font-size: 17px; font-weight: 700; color: #f8fafc;">${doc.title}</h3>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0 0 20px 0;">
            ${doc.desc}
          </p>
          <div style="background: #0f172a; padding: 12px 16px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #38bdf8; margin-bottom: 20px; text-align: left; overflow: hidden; text-overflow: ellipsis;">
            📁 Đường dẫn: ${doc.path}
          </div>
          <div style="display: flex; justify-content: center; gap: 10px;">
            <a href="${encodedPath}" class="btn-setup-action" download="${doc.title}" style="background: #16a34a; color: #fff; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-download"></i> Tải Về Mở Bằng Excel
            </a>
          </div>
        </div>
      </div>
    `;
  },

  renderOfficeDocumentPreview(encodedPath, doc, container) {
    const isDocx = doc.format === 'DOCX';
    const iconClass = isDocx ? 'fa-file-word' : 'fa-file-powerpoint';
    const iconBg = isDocx ? 'rgba(59, 130, 246, 0.2)' : 'rgba(249, 115, 22, 0.2)';
    const iconColor = isDocx ? '#60a5fa' : '#fb923c';
    const appName = isDocx ? 'Microsoft Word' : 'Microsoft PowerPoint';

    container.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 30px; background: #0f172a;">
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; max-width: 640px; text-align: center; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="width: 60px; height: 60px; border-radius: 14px; background: ${iconBg}; color: ${iconColor}; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px;">
            <i class="fa-solid ${iconClass}"></i>
          </div>
          
          <h3 style="margin: 0 0 10px 0; font-size: 17px; font-weight: 700; color: #f8fafc;">${doc.title}</h3>
          
          <div style="font-size: 12.5px; color: #38bdf8; font-weight: 600; margin-bottom: 12px;">
            <i class="fa-solid fa-layer-group"></i> ${doc.cat_name} &bull; ${doc.size_mb} MB
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px 18px; text-align: left; font-size: 13px; color: #cbd5e1; line-height: 1.6; margin-bottom: 20px;">
            <strong style="color: #f8fafc; display: block; margin-bottom: 4px;">Nội dung chuyên môn chính:</strong>
            ${doc.desc}
          </div>

          <div style="background: #0f172a; padding: 10px 14px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #94a3b8; margin-bottom: 22px; text-align: left; overflow: hidden; text-overflow: ellipsis;">
            📁 Vị trí tệp: ${doc.path}
          </div>

          <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <a href="${encodedPath}" class="btn-setup-action" download="${doc.title}" style="background: ${isDocx ? '#2563eb' : '#ea580c'}; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-download"></i> Tải Về Mở Bằng ${appName}
            </a>
            <a href="${encodedPath}" target="_blank" class="btn-setup-action" style="background: rgba(255,255,255,0.1); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.2); padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Mở Trong Trình Duyệt
            </a>
          </div>
        </div>
      </div>
    `;
  },

  closePreview() {
    this.currentPreviewDoc = null;
    const modal = document.getElementById('doc-preview-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.classList.remove('active');
      modal.style.display = 'none';

      // Giải phóng iframe để ngừng tải tài nguyên
      const bodyEl = document.getElementById('doc-preview-body');
      if (bodyEl) bodyEl.innerHTML = '';
    }
  },

  escapeAttribute(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
};

if (typeof window !== 'undefined') {
  window.DocumentLibraryView = DocumentLibraryView;
}
