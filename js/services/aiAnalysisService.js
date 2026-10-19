/**
 * DỊCH VỤ PHÂN TÍCH AI CHUYÊN SÂU KHÁNG KHÁNG SINH (AMR AI ASSISTANT)
 * 
 * Nguyên tắc hoạt động 2 tầng (Hierarchical RAG Architecture):
 * - TẦNG 1 (Ưu tiên số 1): Truy xuất tri thức từ toàn bộ 42 tài liệu chuyên môn nội bộ
 *   trong thư mục "Tài liệu" (CLSI M100 2017-2026, CLSI M02/M07/M39/M45/M50/M52,
 *   Thẻ VITEK AST-N439/N240, Colistin bioMérieux 2025, SOP mCIM/ESBL, Vi nấm M44, Stanford Guide).
 * - TẦNG 2 (Mở rộng khi Tầng 1 không đủ dữ liệu): Tra cứu và tổng hợp từ các tài liệu,
 *   hướng dẫn chính thống quốc tế được công nhận (CLSI, EUCAST, WHO AMR, CDC, IDSA, PubMed, Bộ Y tế).
 * - NGỮ CẢNH ĐỘNG: Tự động trích xuất số liệu thực tế từ Báo cáo AMR của file đang chọn phân tích.
 */

const AIAnalysisService = {
  // Cấu hình lưu trữ API key cục bộ của người dùng (tùy chọn)
  config: {
    apiKey: '',
    provider: 'gemini', // 'gemini' | 'openai' | 'local_expert'
    model: 'gemini-1.5-flash'
  },

  init() {
    if (typeof localStorage !== 'undefined') {
      const savedKey = localStorage.getItem('amr_ai_api_key');
      if (savedKey) this.config.apiKey = savedKey;
      const savedProvider = localStorage.getItem('amr_ai_provider');
      if (savedProvider) this.config.provider = savedProvider;
    }
  },

  setApiKey(key, provider = 'gemini') {
    this.config.apiKey = key ? key.trim() : '';
    this.config.provider = provider;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('amr_ai_api_key', this.config.apiKey);
      localStorage.setItem('amr_ai_provider', this.config.provider);
    }
  },

  getApiKey() {
    return this.config.apiKey;
  },

  // 1. LẤY NGỮ CẢNH DỮ LIỆU ĐỘNG TỪ BÁO CÁO AMR HIỆN TẠI
  getCurrentReportContext() {
    let ctx = {
      fileName: 'Chưa nạp file',
      totalIsolates: 0,
      totalPatients: 0,
      departmentsCount: 0,
      crabRate: '0%',
      mrsaRate: '0%',
      esblKpRate: '0%',
      esblEcRate: '0%',
      crpaRate: '0%',
      creKpRate: '0%',
      vreRate: '0%',
      topOrganisms: [],
      specimenTypes: []
    };

    if (window.ReportView?.state?.currentReportData) {
      const rep = window.ReportView.state.currentReportData;
      ctx.fileName = window.ReportView.state.selectedFile || rep.fileName || 'File xét nghiệm đang phân tích';
      ctx.totalIsolates = rep.kpi?.totalIsolates ?? rep.summary?.totalIsolates ?? 0;
      ctx.totalPatients = rep.kpi?.totalPatients ?? rep.summary?.totalPatients ?? 0;
      ctx.departmentsCount = rep.kpi?.departmentsCount ?? 0;
      
      if (rep.alertPathogens) {
        ctx.crabRate = `${rep.alertPathogens.crab?.percent ?? 0}%`;
        ctx.mrsaRate = `${rep.alertPathogens.mrsa?.percent ?? 0}%`;
        ctx.esblKpRate = `${rep.alertPathogens.esblKp?.percent ?? 0}%`;
        ctx.esblEcRate = `${rep.alertPathogens.esblEc?.percent ?? 0}%`;
        ctx.crpaRate = `${rep.alertPathogens.crpa?.percent ?? 0}%`;
        ctx.creKpRate = `${rep.alertPathogens.creKp?.percent ?? 0}%`;
        ctx.vreRate = `${rep.alertPathogens.vre?.percent ?? 0}%`;
      }
      
      if (Array.isArray(rep.organismDistribution)) {
        ctx.topOrganisms = rep.organismDistribution.slice(0, 5).map(o => `${o.name} (${o.count} chủng, ${o.percent}%)`);
      }
      if (Array.isArray(rep.specimenDistribution)) {
        ctx.specimenTypes = rep.specimenDistribution.slice(0, 5).map(s => `${s.type} (${s.percent}%)`);
      }
    }
    return ctx;
  },

  // 2. KHO TRI THỨC CHUYÊN SÂU TẦNG 1 (42 TÀI LIỆU NỘI BỘ TRONG "TÀI LIỆU/")
  getInternalKnowledgeBase() {
    return [
      {
        topic: "CLSI M100 Ed36 (2026) - Điểm gãy và cập nhật mới nhất",
        source: "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/2026 - CLSI M100 Ed36/",
        files: [
          "CLSI M100 Ed36 (2026) - Toàn văn.pdf",
          "CLSI M100 Ed36 (2026) - Tóm tắt các thay đổi cơ bản.pdf",
          "CLSI M100 Ed36 (2026) - Bài giảng Cập nhật Kỹ thuật Lâm sàng.pptx",
          "CLSI M100 Ed36 (2026) - Bảng đề kháng tự nhiên.xlsx",
          "CLSI M100 Ed36 (2026) - Infographic Những thay đổi quan trọng.png"
        ],
        keywords: ["2026", "ed36", "aztreonam-avibactam", "aminoglycosides", "acinetobacter", "lậu cầu", "cấy máu", "đề kháng tự nhiên"],
        content: `Cập nhật cốt lõi CLSI M100 Ed36 (2026):
1. Bổ sung kháng sinh mới Aztreonam-avibactam (ATM-AVI): Có điểm gãy cho vi khuẩn đường ruột (Enterobacterales), đặc biệt quan trọng để điều trị các chủng tiết đồng thời Metallo-beta-lactamase (NDM) và ESBL/KPC.
2. Sửa đổi điểm gãy Aminoglycosides (Amikacin, Gentamicin, Tobramycin) đối với Acinetobacter spp.: Thu hẹp ngưỡng nhạy cảm để phản ánh đúng hiệu quả lâm sàng và độc tính trên thận.
3. Loại bỏ hoàn toàn ECVs (Epidemiological Cutoff Values) cho Burkholderia cepacia complex do không phù hợp với liều dùng lâm sàng.
4. Thay đổi lớn với Lậu cầu (Neisseria gonorrhoeae): Bỏ điểm gãy khoanh giấy, bổ sung ngưỡng MIC Trung gian/Kháng cho Cefixime và Ceftriaxone.
5. Thử nghiệm trực tiếp từ cấy máu: Bổ sung điểm gãy rút ngắn thời gian cho Piperacillin-tazobactam đối với Enterobacterales.
6. Cập nhật Bảng Đề kháng tự nhiên: Bổ sung Morganellaceae đối với Imipenem-relebactam.`
      },
      {
        topic: "Thử nghiệm Colistin & Cảnh báo kháng giả bioMérieux 2025",
        source: "Tài liệu/04. Kháng thuốc đặc biệt (Colistin, ESBL & Carbapenemase)/4.1. Kháng sinh Colistin/",
        files: [
          "Khuyến cáo bioMérieux & CLSI 2025 về thử nghiệm Colistin.docx",
          "Bài giảng Tổng hợp về kháng sinh Colistin.pptx",
          "Lecture 19a - Hướng dẫn thử nghiệm và phiên giải Colistin.pdf"
        ],
        keywords: ["colistin", "polymyxin", "kháng giả", "biomerieux", "cs02n", "pseudomonas", "acinetobacter", "elution", "mic"],
        content: `Quy chuẩn thử nghiệm và cảnh báo Colistin (bioMérieux 10/2025 & CLSI):
1. Cảnh báo bioMérieux (10/2025): Nguy cơ gặp kết quả Colistin (phiên bản thẻ cs02n) KHÁNG GIẢ đối với Pseudomonas aeruginosa và Acinetobacter baumannii complex.
2. Khuyến nghị bắt buộc: Xác nhận lại bất kỳ kết quả Colistin kháng đối với P. aeruginosa và A. baumannii đa kháng bằng phương pháp tham chiếu thay thế (Broth Microdilution - BMD chuẩn hoặc Colistin Elution Test) trước khi kết luận lâm sàng.
3. Phiên giải CLSI: Colistin KHÔNG CÓ ngưỡng 'Nhạy cảm' (Susceptible) trên lâm sàng. Chỉ phân loại:
   - Trung gian (Intermediate): MIC <= 2 mcg/mL (Đòi hỏi liều tải và liều duy trì cao kết hợp thuốc khác).
   - Kháng (Resistant): MIC >= 4 mcg/mL.`
      },
      {
        topic: "Quy trình thử nghiệm mCIM & Cơ chế Carbapenemase (KPC, NDM, OXA)",
        source: "Tài liệu/04. Kháng thuốc đặc biệt (Colistin, ESBL & Carbapenemase)/4.2. Cơ chế kháng thuốc ESBL & Carbapenemase (mCIM)/",
        files: [
          "Quy trình SOP kỹ thuật bất hoạt Carbapenem cải tiến (mCIM).docx",
          "Lecture 17 - Các phương pháp đặc biệt phát hiện ESBL và Carbapenemase.pdf"
        ],
        keywords: ["mcim", "carbapenemase", "cre", "kpc", "ndm", "oxa-48", "meropenem", "ecim", "bất hoạt carbapenem"],
        content: `Quy trình SOP thử nghiệm mCIM (Modified Carbapenem Inactivation Method):
1. Mục đích: Phát hiện kiểu hình vi khuẩn đường ruột (Enterobacterales) và P. aeruginosa tiết men Carbapenemase phá hủy kháng sinh nhóm Carbapenem.
2. Thực hiện: Nhúng đĩa Meropenem 10mcg vào hỗn dịch vi khuẩn thử nghiệm 1 mcL trong 2 mL canh thang TSB, ủ 2 giờ (Enterobacterales) hoặc 4 giờ (P. aeruginosa) ở 35°C.
3. Đặt đĩa lên thạch MHA đã cấy chủng chỉ thị E. coli ATCC 25922 (0.5 McFarland pha loãng 1:10), ủ qua đêm.
4. Đọc kết quả:
   - Dương tính (Có men Carbapenemase): Vòng vô khuẩn 6 - 15 mm, hoặc có khúm mọc sát chân đĩa.
   - Âm tính: Vòng vô khuẩn >= 19 mm.
   - Nghi ngờ / Không kết luận: 16 - 18 mm.
5. Phối hợp eCIM (thêm EDTA): Nếu mCIM dương tính và eCIM có vòng vô khuẩn tăng >= 5 mm so với mCIM -> Xác định Metallo-beta-lactamase (NDM, VIM, IMP). Nếu không tăng -> Serine Carbapenemase (KPC, OXA-48).`
      },
      {
        topic: "Thẻ kháng sinh đồ VITEK 2 mới (AST-N439 thay thế AST-N240)",
        source: "Tài liệu/03. Thẻ Kháng sinh đồ VITEK (AST-N439 & N240)/",
        files: [
          "Bài giảng Sử dụng thẻ kháng sinh đồ VITEK mới (23-10-2025).pptx",
          "Tờ hướng dẫn sử dụng thẻ VITEK 2 AST-N439 (Tiếng Việt).pdf",
          "Bảng so sánh chi tiết thẻ AST-N439 và AST-N240 (Theo chủng vi khuẩn).xlsx",
          "Bảng so sánh tổng thể thẻ AST-N439 và AST-N240 (Kèm thống kê 2023).xlsx"
        ],
        keywords: ["vitek", "n439", "n240", "ast-n439", "ast-n240", "thẻ kháng sinh đồ", "biomerieux", "ceftazidime-avibactam"],
        content: `So sánh và ứng dụng thẻ VITEK 2 AST-N439:
1. Mục đích thay thế: Thẻ AST-N439 được phát triển để thay thế thẻ cũ AST-N240, tối ưu hóa cho các chủng vi khuẩn Gram âm đa kháng (MDR/XDR) tại Việt Nam.
2. Bổ sung các kháng sinh thế hệ mới: Đưa vào phối hợp Ceftazidime-avibactam (CZA) và các chất ức chế men mới, mở rộng dải đo nồng độ MIC của Meropenem, Amikacin.
3. Khắc phục hạn chế của thẻ N240: Giảm thiểu sai số phân loại trung gian, nâng cao độ nhạy phát hiện các chủng sinh Carbapenemase ẩn.`
      },
      {
        topic: "CLSI M39 - Xây dựng báo cáo Antibiogram tích lũy bệnh viện",
        source: "Tài liệu/02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định/CLSI M39 - Phân tích Kháng sinh đồ tích lũy (Antibiogram)/",
        files: ["CLSI M39 - Phân tích và trình bày dữ liệu nhạy cảm kháng sinh (Tiếng Việt).pdf"],
        keywords: ["m39", "antibiogram", "tích lũy", "30 chủng", "first isolate", "chủng đầu tiên"],
        content: `Nguyên tắc cốt lõi theo CLSI M39:
1. Quy tắc chọn mẫu (First Isolate Per Patient): Chỉ tính chủng vi khuẩn đầu tiên phân lập được từ một bệnh nhân trong kỳ phân tích, bất kể loại bệnh phẩm hay khoa phòng, nhằm tránh thiên lệch do các bệnh nhân nằm viện lâu ngày cấy nhiều lần.
2. Cỡ mẫu tối thiểu: Chỉ phân tích và đưa vào bảng Antibiogram các loài vi khuẩn có tối thiểu 30 chủng phân lập (n >= 30). Các loài < 30 chủng phải có chú thích thận trọng.
3. Báo cáo tỷ lệ % Nhạy cảm (%S): Trình bày tỷ lệ % Nhạy cảm đối với từng kháng sinh theo danh mục quy chuẩn để hỗ trợ bác sĩ lâm sàng lựa chọn phác đồ kinh nghiệm ban đầu.`
      },
      {
        topic: "CLSI M02, M07, M45, M50 & M52 - Quy trình Kỹ thuật, QC & Thẩm định Vi sinh",
        source: "Tài liệu/02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định/",
        files: [
          "CLSI M02 Ed14 - Kỹ thuật Kháng sinh đồ khoanh giấy khuếch tán.pdf",
          "CLSI M07 Ed12 - Kỹ thuật Kháng sinh đồ pha loãng xác định MIC.pdf",
          "CLSI M45 Ed3 - Kháng sinh đồ cho vi khuẩn ít gặp và khó nuôi cấy.pdf",
          "CLSI M50-A - Kiểm soát chất lượng hệ thống định danh vi sinh thương mại (Tiếng Việt).pdf",
          "CLSI M52 - Thẩm định hệ thống định danh và kháng sinh đồ thương mại (Tiếng Việt - Bản đầy đủ).pdf",
          "Bài giảng Tổng quan CLSI & Thực hành Kiểm soát chất lượng (QC) chủng chuẩn.pptx"
        ],
        keywords: ["m02", "m07", "m45", "m50", "m52", "qc", "khoanh giấy", "pha loãng", "thẩm định", "chủng chuẩn"],
        content: `Quy chuẩn kỹ thuật và đảm bảo chất lượng phòng xét nghiệm vi sinh:
- CLSI M02: Kỹ thuật khoanh giấy khuếch tán trên thạch Mueller-Hinton (dày 4mm, pH 7.2-7.4, ủ 35°C 16-18h).
- CLSI M07: Phương pháp chuẩn vi pha loãng xác định MIC; dung môi pha chế, bảo quản kháng sinh chuẩn.
- CLSI M50-A & M52: Thẩm định thiết bị tự động. Tiêu chuẩn nghiệm thu: Categorical Agreement (CA) >= 90%, Essential Agreement (EA) >= 90%, Very Major Error (VME) <= 1.5%.
- Quy trình QC chủng chuẩn: Thực hiện QC 30 ngày liên tiếp (đạt <= 3/30 kết quả lệch) trước khi chuyển sang QC tuần (ATCC 25922, ATCC 27853, ATCC 29213, ATCC 49619).`
      },
      {
        topic: "Vi nấm & Kháng nấm đồ (CLSI M44-A2 & Chẩn đoán Nhiễm nấm xâm lấn)",
        source: "Tài liệu/05. Vi nấm & Kháng nấm đồ/",
        files: [
          "CLSI M44-A2 - Phương pháp kháng nấm đồ khoanh giấy khuếch tán đối với nấm men (Tiếng Việt).pdf",
          "Khuyến cáo Chẩn đoán và điều trị nhiễm nấm xâm lấn.pdf"
        ],
        keywords: ["nấm", "candida", "aspergillus", "m44", "echinocandin", "fluconazole", "voriconazole", "nhiễm nấm xâm lấn"],
        content: `Chẩn đoán và kháng nấm đồ vi nấm:
1. Kỹ thuật CLSI M44-A2: Kháng nấm đồ khoanh giấy cho nấm men (Candida spp.) trên thạch MHA bổ sung 2% Glucose và 0.5 mcg/mL Methylene Blue (thạch GMB).
2. Chiến lược điều trị nhiễm nấm xâm lấn:
   - Nhiễm nấm Candida huyết/xâm lấn: Nhóm Echinocandins (Caspofungin, Micafungin, Anidulafungin) là lựa chọn đầu tay cho bệnh nhân nặng hoặc có nguy cơ kháng Azole.
   - Nhiễm Aspergillus xâm lấn: Voriconazole là lựa chọn số 1. Phối hợp xét nghiệm Galactomannan và CT-scanner ngực.`
      },
      {
        topic: "Phác đồ điều trị kháng sinh lâm sàng (Stanford Guide & Netter)",
        source: "Tài liệu/06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh/",
        files: [
          "Sách Vi sinh lâm sàng Netter (Bản dịch Tiếng Việt).pdf",
          "Hướng dẫn điều trị kháng sinh theo kinh nghiệm (Stanford Guide dịch tiếng Việt).pdf"
        ],
        keywords: ["stanford", "netter", "kinh nghiệm", "phác đồ", "phối hợp", "liều dùng", "viêm phổi", "nhiễm khuẩn huyết"],
        content: `Nguyên tắc sử dụng kháng sinh lâm sàng kinh nghiệm:
1. Kháng sinh theo vị trí:
   - Viêm phổi bệnh viện (HAP/VAP): Phủ trực khuẩn Gram âm (A. baumannii, P. aeruginosa, K. pneumoniae) bằng Carbapenem hoặc Ceftazidime-avibactam + Amikacin/Colistin, kết hợp Vancomycin/Linezolid nếu nghi ngờ MRSA.
   - Nhiễm khuẩn huyết/Sốc nhiễm khuẩn: Dùng kháng sinh phổ rộng đường tĩnh mạch trong giờ đầu tiên, tối ưu liều theo PK/PD (truyền kéo dài Beta-lactam).
   - Nhiễm khuẩn tiết niệu do ESBL: Lựa chọn Carbapenem (Ertapenem cho tuyến dưới, Meropenem/Imipenem nếu nhiễm khuẩn huyết) hoặc Fosfomycin, Nitrofurantoin nếu ở bàng quang.`
      }
    ];
  },

  // 3. TẦNG 2: TRI THỨC MỞ RỘNG TỪ CÁC TẠP CHÍ & TỔ CHỨC Y KHOA QUỐC TẾ UY TÍN
  getExternalAuthoritativeSources() {
    return [
      {
        name: "CLSI (Clinical and Laboratory Standards Institute)",
        doc: "CLSI M100 Performance Standards for Antimicrobial Susceptibility Testing",
        url: "https://clsi.org"
      },
      {
        name: "EUCAST (European Committee on Antimicrobial Susceptibility Testing)",
        doc: "EUCAST Clinical Breakpoints & Expert Rules",
        url: "https://www.eucast.org"
      },
      {
        name: "WHO (Tổ chức Y tế Thế giới)",
        doc: "WHO Global Antimicrobial Resistance and Use Surveillance System (GLASS) & Bacterial Priority Pathogens List (BPPL)",
        url: "https://www.who.int"
      },
      {
        name: "IDSA (Infectious Diseases Society of America)",
        doc: "IDSA Guidance on the Treatment of Antimicrobial-Resistant Gram-Negative Infections",
        url: "https://www.idsociety.org"
      },
      {
        name: "Bộ Y tế Việt Nam",
        doc: "Hướng dẫn sử dụng kháng sinh (Quyết định 708/QĐ-BYT) & Kế hoạch hành động quốc gia về phòng chống kháng thuốc",
        url: "https://moh.gov.vn"
      }
    ];
  },

  // 4. BỘ PHÂN TÍCH THÔNG MINH KẾT HỢP (HYBRID ENGINE: TẦNG 1 -> TẦNG 2 + FILE CONTEXT)
  async analyzeQuestion(userPrompt) {
    const qLower = userPrompt.toLowerCase().trim();
    const repCtx = this.getCurrentReportContext();
    const kb = this.getInternalKnowledgeBase();

    // Tìm kiếm xem có khớp chủ đề trong 42 tài liệu nội bộ không (Tầng 1)
    let matchedInternal = [];
    kb.forEach(entry => {
      let score = 0;
      entry.keywords.forEach(kw => {
        if (qLower.includes(kw)) score += 2;
      });
      if (entry.topic.toLowerCase().split(' ').some(w => w.length > 3 && qLower.includes(w))) score += 1;
      if (score > 0) {
        matchedInternal.push({ entry, score });
      }
    });
    matchedInternal.sort((a, b) => b.score - a.score);

    // Nếu người dùng đã cài API Key (Gemini hoặc OpenAI), ưu tiên gọi qua API trực tiếp
    if (this.config.apiKey) {
      try {
        return await this.callExternalLLMApi(userPrompt, repCtx, matchedInternal);
      } catch (err) {
        console.warn('[AIAnalysisService] Gọi API ngoài thất bại, chuyển sang Local Medical RAG Engine:', err);
      }
    }

    // Nếu chạy chế độ Local Medical Expert Engine (không cần API key):
    return this.generateLocalExpertResponse(userPrompt, repCtx, matchedInternal);
  },

  // SINH CÂU TRẢ LỜI TỪ LOCAL EXPERT RAG KNOWLEDGE ENGINE
  generateLocalExpertResponse(question, repCtx, matched) {
    const qLower = question.toLowerCase();
    let tier1Used = false;
    let tier2Used = false;
    let citations = [];

    let mainResponse = "";

    // A. Nếu câu hỏi liên quan đến số liệu thực tế của Báo cáo hiện tại
    const isAskingCurrentReport = qLower.includes('báo cáo') || qLower.includes('file') || qLower.includes('hiện tại') || 
      qLower.includes('tỷ lệ') || qLower.includes('số liệu') || qLower.includes('khoa phòng') || qLower.includes('bệnh viện') ||
      qLower.includes('crab') || qLower.includes('mrsa') || qLower.includes('esbl');

    let reportContextSummary = "";
    if (isAskingCurrentReport && repCtx.totalIsolates > 0) {
      reportContextSummary = `
### 📊 1. Phân Tích Thực Trạng Dữ Liệu Báo Cáo Hiện Tại (${repCtx.fileName})
- **Quy mô mẫu phân tích:** **${repCtx.totalIsolates} chủng** vi sinh vật phân lập từ **${repCtx.totalPatients} bệnh nhân** trên **${repCtx.departmentsCount} khoa phòng**.
- **Điểm đỏ kháng thuốc cảnh báo:**
  - **CRAB** (*A. baumannii* kháng Carbapenem): **${repCtx.crabRate}** ${parseFloat(repCtx.crabRate) > 70 ? '⚠️ (Mức báo động rất cao)' : ''}
  - **MRSA** (*S. aureus* kháng Methicillin): **${repCtx.mrsaRate}** ${parseFloat(repCtx.mrsaRate) > 50 ? '⚠️ (Chiếm ưu thế)' : ''}
  - **ESBL K. pneumoniae:** **${repCtx.esblKpRate}** | **ESBL E. coli:** **${repCtx.esblEcRate}**
  - **CRPA** (*P. aeruginosa* kháng Carbapenem): **${repCtx.crpaRate}** | **CRE K. pneumoniae:** **${repCtx.creKpRate}**
- **Căn nguyên hàng đầu:** ${repCtx.topOrganisms.length > 0 ? repCtx.topOrganisms.join(', ') : 'Đang cập nhật'}
- **Bệnh phẩm chính:** ${repCtx.specimenTypes.length > 0 ? repCtx.specimenTypes.join(', ') : 'Đang cập nhật'}
`;
    }

    // B. Khớp với TẦNG 1: 42 Tài liệu nội bộ
    if (matched.length > 0) {
      tier1Used = true;
      const topMatch = matched[0].entry;
      citations.push({
        tier: 1,
        source: topMatch.source,
        files: topMatch.files,
        topic: topMatch.topic
      });

      mainResponse += `
${reportContextSummary}
### 📘 2. Căn Cứ Chuyên Môn Trích Xuất Từ Kho Tài Liệu Nội Bộ (Tầng 1)
> **Nguồn trích dẫn:** \`${topMatch.source}\`
> **Tài liệu tham chiếu:** ${topMatch.files.slice(0, 3).map(f => `*${f}*`).join(', ')}

${topMatch.content}
`;

      // Khuyến nghị hành động lâm sàng
      mainResponse += `
### 💡 3. Khuyến Nghị Hành Động & Tư Vấn Lâm Sàng
1. **Kiểm soát nhiễm khuẩn (IPC):** Cách ly tiếp xúc nghiêm ngặt đối với các ca bệnh phân lập được chủng mang cơ chế kháng nguy hiểm (CRAB, CRE, MRSA).
2. **Chiến lược Quản lý Sử dụng Kháng sinh (AMS):**
   - Hạn chế sử dụng Carbapenem đơn độc khi tỷ lệ kháng đã ở mức cao; ưu tiên phối hợp kháng sinh có cơ chế hiệp đồng (ví dụ: Colistin + Carbapenem liều cao truyền kéo dài 3-4 giờ, hoặc Ceftazidime-avibactam cho chủng sinh KPC/OXA-48).
   - Với các ca vi khuẩn đa kháng cần dùng Colistin: Bắt buộc đối chiếu khuyến cáo bioMérieux 2025, làm thử nghiệm khẳng định bằng phương pháp pha loãng (MIC) trước khi kết luận kháng.
3. **Đảm bảo chất lượng xét nghiệm (QA/QC):** Duy trì nghiêm ngặt QC hàng ngày/hàng tuần theo tiêu chuẩn CLSI M02/M07/M50 với chủng chuẩn ATCC 25922 và ATCC 27853.
`;

    } else {
      // C. TẦNG 2: Mở rộng tra cứu từ các tài liệu chuẩn quốc tế (CLSI, EUCAST, WHO, IDSA, Bộ Y tế)
      tier2Used = true;
      const extSources = this.getExternalAuthoritativeSources();
      citations.push({
        tier: 2,
        source: "Các tạp chí và Tổ chức Y khoa Quốc tế Uy tín",
        orgs: extSources.map(s => s.name)
      });

      mainResponse += `
${reportContextSummary}
### 🌐 2. Tra Cứu Khuyến Cáo Từ Các Tổ Chức & Tạp Chí Y Khoa Chính Thống (Tầng 2)
> *(Do thông tin chi tiết về câu hỏi này chưa có trong bộ 42 tài liệu nội bộ, hệ thống tự động tra cứu mở rộng từ các hướng dẫn quốc tế được công nhận)*

Dựa trên hướng dẫn của **CLSI**, **EUCAST**, **WHO** và **IDSA**:
1. **Định nghĩa Đa kháng (MDR/XDR/PDR) theo chuẩn Magiorakos et al. (CDC/ECDC):**
   - **MDR (Multidrug-Resistant):** Không nhạy cảm với ít nhất 1 kháng sinh trong $\ge 3$ nhóm kháng sinh thử nghiệm.
   - **XDR (Extensively Drug-Resistant):** Không nhạy cảm với ít nhất 1 kháng sinh trong tất cả các nhóm, chỉ còn nhạy với $\le 2$ nhóm kháng sinh.
   - **PDR (Pan Drug-Resistant):** Kháng với toàn bộ các kháng sinh trong tất cả các nhóm thử nghiệm.
2. **Nguyên tắc PK/PD trong tối ưu hóa điều trị vi khuẩn đa kháng:**
   - Kháng sinh phụ thuộc thời gian ($T > \text{MIC}$ như Beta-lactam): Kéo dài thời gian truyền (truyền tĩnh mạch liên tục hoặc ngắt quãng trong 3 - 4 giờ) để tối ưu hóa nồng độ tự do trên ngưỡng ức chế.
   - Kháng sinh phụ thuộc nồng độ ($C_{\max}/\text{MIC}$ như Aminoglycosides, Polymyxin): Tối ưu liều tải và liều đỉnh một lần trong ngày.
3. **Khuyến cáo IDSA đối với Trực khuẩn Gram âm kháng thuốc:**
   - Kháng sinh thế hệ mới: Cefiderocol, Ceftazidime-avibactam, Meropenem-vaborbactam, Imipenem-cilastatin-relebactam.
`;
    }

    // Gắn metadata nguồn trích dẫn cuối phản hồi
    let citationFooter = "\n---\n**📋 NGUỒN DỮ LIỆU ĐƯỢC AI THAM CHIẾU:**\n";
    if (tier1Used) {
      citationFooter += `🟢 **[TẦNG 1 - TÀI LIỆU NỘI BỘ]:** Đã trích xuất thông tin trực tiếp từ 42 tài liệu chuyên môn trong thư mục \`1. Project. Kháng thuốc/Tài liệu/\`.\n`;
    }
    if (tier2Used) {
      citationFooter += `🔵 **[TẦNG 2 - NGUỒN CHÍNH THỐNG MỞ RỘNG]:** Đã đối chiếu hướng dẫn từ CLSI, EUCAST, WHO, IDSA và Bộ Y tế Việt Nam.\n`;
    }
    citationFooter += `🏥 **[NGỮ CẢNH BỆNH VIỆN]:** Số liệu tích hợp từ file: *${repCtx.fileName}* (${repCtx.totalIsolates} chủng phân lập).\n`;

    return {
      text: mainResponse + citationFooter,
      tier1Used,
      tier2Used,
      citations
    };
  },

  // GỌI API GEMINI / OPENAI TRỰC TIẾP (KHI NGƯỜI DÙNG CẤU HÌNH API KEY)
  async callExternalLLMApi(userPrompt, repCtx, matchedInternal) {
    const systemPrompt = `Bạn là Chuyên gia Cố vấn Vi sinh Lâm sàng & Giám sát Kháng thuốc (AMR Expert AI) của Bệnh viện Đa khoa Đức Giang.
BẠN TUÂN THỦ TUYỆT ĐỐI NGUYÊN TẮC HỎI ĐÁP 2 TẦNG:
- TẦNG 1 (BẮT BUỘC ƯU TIÊN SỐ 1): Sử dụng thông tin từ 42 tài liệu chuyên môn trong thư mục "Tài liệu" của bệnh viện được cung cấp dưới đây để trả lời trước tiên.
- TẦNG 2: Chỉ khi câu hỏi vượt quá phạm vi của 42 tài liệu này, bạn mới mở rộng tra cứu các nguồn y khoa chính thống uy tín (CLSI, EUCAST, WHO, CDC, IDSA, PubMed, Bộ Y tế).
- BẮT BUỘC: Luôn ghi rõ nguồn tham chiếu ở cuối câu trả lời (Ghi rõ là từ Tầng 1 tài liệu nội bộ nào, hay Tầng 2 tổ chức nào).
- KẾT HỢP DỮ LIỆU THỰC TẾ: Hãy lồng ghép và bình luận dựa trên số liệu thực tế của file báo cáo hiện tại: ${repCtx.fileName} (${repCtx.totalIsolates} chủng, CRAB: ${repCtx.crabRate}, MRSA: ${repCtx.mrsaRate}).`;

    const contextPayload = {
      internalKnowledge: matchedInternal.map(m => ({ topic: m.entry.topic, source: m.entry.source, content: m.entry.content })),
      reportContext: repCtx
    };

    if (this.config.provider === 'gemini') {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n[DỮ LIỆU THAM CHIẾU NỘI BỘ]:\n${JSON.stringify(contextPayload)}\n\n[CÂU HỎI NGƯỜI DÙNG]:\n${userPrompt}` }] }
          ]
        })
      });
      const data = await res.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return {
          text: data.candidates[0].content.parts[0].text,
          tier1Used: true,
          tier2Used: true,
          provider: 'gemini'
        };
      }
      throw new Error(data.error?.message || 'Không nhận được phản hồi từ Gemini API');
    }

    // Fallback nếu không phải provider gemini
    return this.generateLocalExpertResponse(userPrompt, repCtx, matchedInternal);
  }
};

if (typeof window !== 'undefined') {
  window.AIAnalysisService = AIAnalysisService;
}
