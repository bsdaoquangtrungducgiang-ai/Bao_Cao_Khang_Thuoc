/**
 * MODAL HỘP THOẠI TRỢ LÝ PHÂN TÍCH AI KHÁNG THUỐC (AMR AI ASSISTANT)
 * Tích hợp trực tiếp tại phân hệ Báo Cáo AMR Tự Động
 */

const AIAnalysisModal = {
  chatHistory: [],
  isProcessing: false,

  init() {
    this.bindEvents();
    this.renderInitialWelcome();
  },

  bindEvents() {
    // Nút mở modal trong Báo cáo AMR
    const btnOpen = document.getElementById('btn-open-ai-chat');
    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        this.open();
      });
    }

    // Nút đóng modal
    document.querySelectorAll('.ai-modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        this.close();
      });
    });

    // Bấm ra ngoài overlay để đóng
    const modalEl = document.getElementById('ai-analysis-modal');
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) this.close();
      });
    }

    // Gửi tin nhắn
    const btnSend = document.getElementById('btn-ai-send');
    const inputEl = document.getElementById('ai-chat-input');
    if (btnSend && inputEl) {
      btnSend.addEventListener('click', () => {
        this.handleUserSend();
      });

      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleUserSend();
        }
      });
    }

    // Cài đặt API Key tùy chọn
    const btnToggleSettings = document.getElementById('btn-toggle-ai-settings');
    const settingsBox = document.getElementById('ai-settings-drawer');
    if (btnToggleSettings && settingsBox) {
      btnToggleSettings.addEventListener('click', () => {
        settingsBox.style.display = settingsBox.style.display === 'none' ? 'block' : 'none';
      });
    }

    const btnSaveKey = document.getElementById('btn-save-ai-key');
    const inputKey = document.getElementById('input-ai-api-key');
    if (btnSaveKey && inputKey) {
      if (window.AIAnalysisService?.getApiKey()) {
        inputKey.value = window.AIAnalysisService.getApiKey();
      }
      btnSaveKey.addEventListener('click', () => {
        const key = inputKey.value.trim();
        window.AIAnalysisService?.setApiKey(key, 'gemini');
        if (key) {
          window.Toast?.success('Đã lưu API Key Gemini thành công!');
        } else {
          window.Toast?.info('Đã xóa API Key. Sử dụng chế độ Local Medical Expert.');
        }
        if (settingsBox) settingsBox.style.display = 'none';
      });
    }

    // Quick prompt chips click
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('.ai-quick-chip');
      if (chip) {
        const text = chip.getAttribute('data-prompt') || chip.textContent.trim();
        if (inputEl) {
          inputEl.value = text;
          this.handleUserSend();
        }
      }

      // Copy response button
      const copyBtn = e.target.closest('.btn-copy-ai-answer');
      if (copyBtn) {
        const textToCopy = copyBtn.getAttribute('data-content');
        if (textToCopy && navigator.clipboard) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            window.Toast?.success('Đã sao chép phản hồi của AI!');
          });
        }
      }
    });
  },

  open() {
    const modalEl = document.getElementById('ai-analysis-modal');
    if (modalEl) {
      modalEl.classList.add('active');
      modalEl.style.display = 'flex';
      
      // Cập nhật banner ngữ cảnh file hiện tại
      this.updateContextBanner();

      const inputEl = document.getElementById('ai-chat-input');
      if (inputEl) {
        setTimeout(() => inputEl.focus(), 150);
      }
    }
  },

  close() {
    const modalEl = document.getElementById('ai-analysis-modal');
    if (modalEl) {
      modalEl.classList.remove('active');
      modalEl.style.display = 'none';
    }
  },

  updateContextBanner() {
    const bannerEl = document.getElementById('ai-context-banner');
    if (!bannerEl || !window.AIAnalysisService) return;

    const ctx = window.AIAnalysisService.getCurrentReportContext();
    bannerEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="badge" style="background: rgba(14, 165, 233, 0.15); color: #0284c7; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px;">
            <i class="fa-solid fa-file-medical"></i> ${ctx.fileName}
          </span>
          <span style="font-size: 12px; color: var(--text-muted);">
            (${ctx.totalIsolates} chủng, CRAB: <strong style="color: #e11d48;">${ctx.crabRate}</strong>, MRSA: <strong style="color: #ea580c;">${ctx.mrsaRate}</strong>)
          </span>
        </div>
        <div style="display: flex; gap: 6px; font-size: 11.5px;">
          <span style="color: #15803d; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Tầng 1: 42 Tài liệu CLSI nội bộ</span>
          <span style="color: #64748b;">|</span>
          <span style="color: #0369a1; font-weight: 600;"><i class="fa-solid fa-globe"></i> Tầng 2: Nguồn Y khoa quốc tế</span>
        </div>
      </div>
    `;
  },

  renderInitialWelcome() {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;

    container.innerHTML = `
      <div class="ai-msg ai-msg-assistant" style="background: var(--bg-card, #fff); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
          <span style="background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px;">
            <i class="fa-solid fa-robot"></i>
          </span>
          <div>
            <strong style="font-size: 13.5px; color: var(--text-main);">Trợ Lý AI Phân Tích Kháng Thuốc (AMR Expert AI)</strong>
            <span style="font-size: 11.5px; color: var(--text-muted); display: block;">Hệ thống cố vấn thông minh 2 tầng</span>
          </div>
        </div>

        <div style="font-size: 13.5px; line-height: 1.6; color: var(--text-main);">
          Xin chào quý đồng nghiệp! Tôi đã sẵn sàng hỗ trợ phân tích dữ liệu kháng thuốc, tra cứu cơ chế và tư vấn phác đồ:
          <ul style="margin: 8px 0; padding-left: 20px;">
            <li><strong>Tầng 1 (Ưu tiên số 1):</strong> Trực tiếp tra cứu toàn bộ <strong>42 tài liệu chuyên môn</strong> trong thư mục <code>Tài liệu</code> (CLSI M100 Ed27 - Ed36 / 2026, CLSI M02/M07/M39/M45/M50/M52, Thẻ VITEK AST-N439/N240, Colistin bioMérieux 2025, mCIM, Vi nấm M44, Stanford Guide).</li>
            <li><strong>Tầng 2 (Mở rộng):</strong> Tra cứu hướng dẫn quốc tế chính thống (CLSI, EUCAST, WHO, IDSA, Bộ Y tế).</li>
            <li><strong>Ngữ cảnh lâm sàng:</strong> Tự động tích hợp số liệu của file đang nạp trong Báo Cáo AMR.</li>
          </ul>
        </div>

        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border-color);">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">
            <i class="fa-solid fa-bolt"></i> Gợi ý câu hỏi chuyên môn nhanh:
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            <button class="ai-quick-chip" data-prompt="Phân tích tình hình đa kháng (CRAB, MRSA, ESBL) trong báo cáo hiện tại và khuyến nghị phác đồ?">
              ⚡ Phân tích điểm đỏ đa kháng (CRAB, MRSA, ESBL) file này
            </button>
            <button class="ai-quick-chip" data-prompt="Điểm mới đáng chú ý nhất của CLSI M100 Ed36 (2026) về Aminoglycoside cho Acinetobacter và Aztreonam-avibactam?">
              📘 Cập nhật mới CLSI M100 Ed36 (2026)
            </button>
            <button class="ai-quick-chip" data-prompt="Quy trình thử nghiệm và cảnh báo kháng giả Colistin trên máy VITEK 2 theo bioMérieux 2025?">
              ⚠️ Cảnh báo Colistin kháng giả (bioMérieux 2025)
            </button>
            <button class="ai-quick-chip" data-prompt="Quy trình thực hiện kỹ thuật mCIM và eCIM phát hiện vi khuẩn tiết Carbapenemase?">
              🔬 Quy trình SOP kỹ thuật mCIM
            </button>
            <button class="ai-quick-chip" data-prompt="So sánh sự khác biệt và ưu điểm của thẻ VITEK AST-N439 so với thẻ cũ AST-N240?">
              💳 Thẻ VITEK mới AST-N439 vs N240
            </button>
            <button class="ai-quick-chip" data-prompt="Nguyên tắc xây dựng báo cáo Antibiogram tích lũy bệnh viện theo chuẩn CLSI M39?">
              📊 Nguyên tắc Antibiogram CLSI M39 (n >= 30)
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async handleUserSend() {
    const inputEl = document.getElementById('ai-chat-input');
    if (!inputEl) return;
    const prompt = inputEl.value.trim();
    if (!prompt || this.isProcessing) return;

    inputEl.value = '';
    this.isProcessing = true;

    const container = document.getElementById('ai-chat-messages');

    // 1. Thêm tin nhắn của User vào UI
    const userMsgHtml = `
      <div class="ai-msg ai-msg-user" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border-radius: 12px; padding: 14px 18px; margin-bottom: 14px; margin-left: 15%; align-self: flex-end; box-shadow: 0 2px 6px rgba(2, 132, 199, 0.2);">
        <div style="font-size: 11px; opacity: 0.85; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-user-doctor"></i> Bác sĩ / Cán bộ Vi sinh
        </div>
        <div style="font-size: 13.5px; line-height: 1.5;">${this.escapeHtml(prompt)}</div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', userMsgHtml);

    // 2. Thêm chỉ báo đang phân tích (Thinking loader)
    const loaderId = 'ai-loader-' + Date.now();
    const loaderHtml = `
      <div id="${loaderId}" class="ai-msg ai-msg-assistant" style="background: var(--bg-card, #fff); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 20px; margin-bottom: 14px; margin-right: 15%; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <div style="display: flex; align-items: center; gap: 10px; color: var(--text-muted); font-size: 13px;">
          <i class="fa-solid fa-circle-notch fa-spin" style="color: #8b5cf6;"></i>
          <span>Đang truy xuất kho tri thức 42 tài liệu CLSI & phân tích số liệu báo cáo...</span>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', loaderHtml);
    container.scrollTop = container.scrollHeight;

    // 3. Gọi dịch vụ AI Analysis
    try {
      const response = await window.AIAnalysisService?.analyzeQuestion(prompt);
      const loaderEl = document.getElementById(loaderId);
      if (loaderEl) loaderEl.remove();

      // Format markdown response to HTML
      const formattedHtml = this.formatMarkdown(response?.text || 'Không có phản hồi');

      const assistantMsgHtml = `
        <div class="ai-msg ai-msg-assistant" style="background: var(--bg-card, #fff); border: 1px solid var(--border-color); border-radius: 12px; padding: 18px 22px; margin-bottom: 16px; margin-right: 8%; box-shadow: 0 2px 10px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px;">
                <i class="fa-solid fa-robot"></i>
              </span>
              <strong style="font-size: 13px; color: var(--text-main);">Chuyên Gia Cố Vấn Vi Sinh AMR</strong>
            </div>

            <button class="btn-copy-ai-answer" data-content="${this.escapeAttribute(response?.text || '')}" title="Sao chép nội dung" style="background: none; border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 8px; font-size: 11.5px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px;">
              <i class="fa-regular fa-copy"></i> Sao chép
            </button>
          </div>

          <div class="ai-content-body" style="font-size: 13.5px; line-height: 1.65; color: var(--text-main);">
            ${formattedHtml}
          </div>
        </div>
      `;

      container.insertAdjacentHTML('beforeend', assistantMsgHtml);
      container.scrollTop = container.scrollHeight;
    } catch (err) {
      const loaderEl = document.getElementById(loaderId);
      if (loaderEl) loaderEl.remove();

      const errorHtml = `
        <div class="ai-msg" style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 10px; padding: 12px 16px; margin-bottom: 14px; font-size: 13px;">
          <i class="fa-solid fa-triangle-exclamation"></i> Có lỗi xảy ra trong quá trình phân tích: ${err.message || err}
        </div>
      `;
      container.insertAdjacentHTML('beforeend', errorHtml);
      container.scrollTop = container.scrollHeight;
    } finally {
      this.isProcessing = false;
    }
  },

  formatMarkdown(text) {
    if (!text) return '';
    let html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h4 style="font-size: 14.5px; font-weight: 700; margin: 14px 0 6px 0; color: #0284c7;">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 style="font-size: 15.5px; font-weight: 800; margin: 16px 0 8px 0; color: var(--text-main);">$1</h3>')
      // Bold & Italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Blockquote
      .replace(/^\> (.*$)/gim, '<blockquote style="border-left: 3px solid #0284c7; padding: 6px 12px; margin: 8px 0; background: var(--bg-main, #f8fafc); color: var(--text-muted); font-size: 12.5px; border-radius: 0 6px 6px 0;">$1</blockquote>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code style="background: var(--bg-main, #f1f5f9); color: #0284c7; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: monospace;">$1</code>')
      // Unordered lists
      .replace(/^\s*-\s+(.*$)/gim, '<li style="margin-bottom: 4px;">$1</li>')
      .replace(/(<li.*<\/li>)/s, '<ul style="margin: 6px 0; padding-left: 20px;">$1</ul>')
      // Line breaks
      .replace(/\n\n/g, '<br><br>');

    return html;
  },

  escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  },

  escapeAttribute(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
};

if (typeof window !== 'undefined') {
  window.AIAnalysisModal = AIAnalysisModal;
}
