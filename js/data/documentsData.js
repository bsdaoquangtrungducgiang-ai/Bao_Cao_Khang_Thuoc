/**
 * DANH MỤC TÀI LIỆU CHUYÊN MÔN & TIÊU CHUẨN CLSI
 * Cung cấp dữ liệu tra cứu cho Thư viện Tài liệu & CLSI
 */

const DocumentLibraryData = {
  categories: [
    {
        "id": "clsi_m100",
        "name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "badge": "Tiêu chuẩn Vàng",
        "icon": "fa-book-journal-whills"
    },
    {
        "id": "clsi_specialized",
        "name": "CLSI Chuyên Biệt - Quy Trình, QC & Thẩm Định",
        "badge": "Quy trình & Đảm bảo CL",
        "icon": "fa-vial-circle-check"
    },
    {
        "id": "vitek_cards",
        "name": "Thẻ Kháng Sinh Đồ VITEK 2 (AST-N439 & N240)",
        "badge": "Máy tự động VITEK 2",
        "icon": "fa-microchip"
    },
    {
        "id": "special_resistance",
        "name": "Kháng Thuốc Đặc Biệt (Colistin, ESBL & Carbapenemase)",
        "badge": "Cảnh báo Đỏ Vi sinh",
        "icon": "fa-biohazard"
    },
    {
        "id": "fungal_infections",
        "name": "Vi Nấm & Kháng Nấm Đồ (CLSI M44 & Nhiễm Nấm Xâm Lấn)",
        "badge": "Chẩn đoán Vi nấm",
        "icon": "fa-disease"
    },
    {
        "id": "clinical_books",
        "name": "Sách Vi Sinh Lâm Sàng & Hướng Dẫn Điều Trị Kháng Sinh",
        "badge": "Cẩm nang Lâm sàng",
        "icon": "fa-book-medical"
    }
],
  documents: [
    {
        "id": "doc_1",
        "title": "Sách Vi sinh lâm sàng Netter (Bản dịch Tiếng Việt).pdf",
        "category": "06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh",
        "cat_id": "clinical_books",
        "cat_name": "Sách Vi Sinh Lâm Sàng & Hướng Dẫn Điều Trị Kháng Sinh",
        "path": "Tài liệu/06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh/Sách Vi sinh lâm sàng Netter (Bản dịch Tiếng Việt).pdf",
        "format": "PDF",
        "size_mb": 25.04,
        "desc": "Bản dịch hướng dẫn thử nghiệm độ nhạy cảm kháng sinh CLSI sang tiếng Việt.",
        "tags": [
            "Tiếng Việt",
            "CLSI"
        ]
    },
    {
        "id": "doc_2",
        "title": "Hướng dẫn điều trị kháng sinh theo kinh nghiệm - Bản đầy đủ.pdf",
        "category": "06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh",
        "cat_id": "clinical_books",
        "cat_name": "Sách Vi Sinh Lâm Sàng & Hướng Dẫn Điều Trị Kháng Sinh",
        "path": "Tài liệu/06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh/Hướng dẫn điều trị kháng sinh theo kinh nghiệm/Hướng dẫn điều trị kháng sinh theo kinh nghiệm - Bản đầy đủ.pdf",
        "format": "PDF",
        "size_mb": 221.81,
        "desc": "Hướng dẫn chẩn đoán và lựa chọn phác đồ kháng sinh ban đầu theo kinh nghiệm (The Stanford Guide to Antimicrobial Therapy dịch tiếng Việt).",
        "tags": [
            "Phác đồ",
            "Kháng sinh kinh nghiệm",
            "Stanford"
        ]
    },
    {
        "id": "doc_3",
        "title": "Hướng dẫn điều trị kháng sinh theo kinh nghiệm - Phần 1.pdf",
        "category": "06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh",
        "cat_id": "clinical_books",
        "cat_name": "Sách Vi Sinh Lâm Sàng & Hướng Dẫn Điều Trị Kháng Sinh",
        "path": "Tài liệu/06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh/Hướng dẫn điều trị kháng sinh theo kinh nghiệm/Bản chia theo từng phần (Phần 1 - 5)/Hướng dẫn điều trị kháng sinh theo kinh nghiệm - Phần 1.pdf",
        "format": "PDF",
        "size_mb": 42.17,
        "desc": "Hướng dẫn chẩn đoán và lựa chọn phác đồ kháng sinh ban đầu theo kinh nghiệm (The Stanford Guide to Antimicrobial Therapy dịch tiếng Việt).",
        "tags": [
            "Phác đồ",
            "Kháng sinh kinh nghiệm",
            "Stanford"
        ]
    },
    {
        "id": "doc_4",
        "title": "Hướng dẫn điều trị kháng sinh theo kinh nghiệm - Phần 2.pdf",
        "category": "06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh",
        "cat_id": "clinical_books",
        "cat_name": "Sách Vi Sinh Lâm Sàng & Hướng Dẫn Điều Trị Kháng Sinh",
        "path": "Tài liệu/06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh/Hướng dẫn điều trị kháng sinh theo kinh nghiệm/Bản chia theo từng phần (Phần 1 - 5)/Hướng dẫn điều trị kháng sinh theo kinh nghiệm - Phần 2.pdf",
        "format": "PDF",
        "size_mb": 41.23,
        "desc": "Hướng dẫn chẩn đoán và lựa chọn phác đồ kháng sinh ban đầu theo kinh nghiệm (The Stanford Guide to Antimicrobial Therapy dịch tiếng Việt).",
        "tags": [
            "Phác đồ",
            "Kháng sinh kinh nghiệm",
            "Stanford"
        ]
    },
    {
        "id": "doc_5",
        "title": "Hướng dẫn điều trị kháng sinh theo kinh nghiệm - Phần 3.pdf",
        "category": "06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh",
        "cat_id": "clinical_books",
        "cat_name": "Sách Vi Sinh Lâm Sàng & Hướng Dẫn Điều Trị Kháng Sinh",
        "path": "Tài liệu/06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh/Hướng dẫn điều trị kháng sinh theo kinh nghiệm/Bản chia theo từng phần (Phần 1 - 5)/Hướng dẫn điều trị kháng sinh theo kinh nghiệm - Phần 3.pdf",
        "format": "PDF",
        "size_mb": 41.98,
        "desc": "Hướng dẫn chẩn đoán và lựa chọn phác đồ kháng sinh ban đầu theo kinh nghiệm (The Stanford Guide to Antimicrobial Therapy dịch tiếng Việt).",
        "tags": [
            "Phác đồ",
            "Kháng sinh kinh nghiệm",
            "Stanford"
        ]
    },
    {
        "id": "doc_6",
        "title": "Hướng dẫn điều trị kháng sinh theo kinh nghiệm - Phần 4.pdf",
        "category": "06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh",
        "cat_id": "clinical_books",
        "cat_name": "Sách Vi Sinh Lâm Sàng & Hướng Dẫn Điều Trị Kháng Sinh",
        "path": "Tài liệu/06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh/Hướng dẫn điều trị kháng sinh theo kinh nghiệm/Bản chia theo từng phần (Phần 1 - 5)/Hướng dẫn điều trị kháng sinh theo kinh nghiệm - Phần 4.pdf",
        "format": "PDF",
        "size_mb": 50.98,
        "desc": "Hướng dẫn chẩn đoán và lựa chọn phác đồ kháng sinh ban đầu theo kinh nghiệm (The Stanford Guide to Antimicrobial Therapy dịch tiếng Việt).",
        "tags": [
            "Phác đồ",
            "Kháng sinh kinh nghiệm",
            "Stanford"
        ]
    },
    {
        "id": "doc_7",
        "title": "Hướng dẫn điều trị kháng sinh theo kinh nghiệm - Phần 5.pdf",
        "category": "06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh",
        "cat_id": "clinical_books",
        "cat_name": "Sách Vi Sinh Lâm Sàng & Hướng Dẫn Điều Trị Kháng Sinh",
        "path": "Tài liệu/06. Sách Vi sinh lâm sàng & Hướng dẫn điều trị kháng sinh/Hướng dẫn điều trị kháng sinh theo kinh nghiệm/Bản chia theo từng phần (Phần 1 - 5)/Hướng dẫn điều trị kháng sinh theo kinh nghiệm - Phần 5.pdf",
        "format": "PDF",
        "size_mb": 45.59,
        "desc": "Hướng dẫn chẩn đoán và lựa chọn phác đồ kháng sinh ban đầu theo kinh nghiệm (The Stanford Guide to Antimicrobial Therapy dịch tiếng Việt).",
        "tags": [
            "Phác đồ",
            "Kháng sinh kinh nghiệm",
            "Stanford"
        ]
    },
    {
        "id": "doc_8",
        "title": "Lecture 17 - Các phương pháp đặc biệt phát hiện ESBL và Carbapenemase.pdf",
        "category": "04. Kháng thuốc đặc biệt (Colistin, ESBL & Carbapenemase)",
        "cat_id": "special_resistance",
        "cat_name": "Kháng Thuốc Đặc Biệt (Colistin, ESBL & Carbapenemase)",
        "path": "Tài liệu/04. Kháng thuốc đặc biệt (Colistin, ESBL & Carbapenemase)/4.2. Cơ chế kháng thuốc ESBL & Carbapenemase (mCIM)/Lecture 17 - Các phương pháp đặc biệt phát hiện ESBL và Carbapenemase.pdf",
        "format": "PDF",
        "size_mb": 5.13,
        "desc": "Quy trình chuẩn SOP và bài giảng chuyên sâu về phương pháp mCIM phát hiện vi khuẩn sinh men Carbapenemase và ESBL.",
        "tags": [
            "Carbapenemase",
            "mCIM",
            "ESBL",
            "SOP"
        ]
    },
    {
        "id": "doc_9",
        "title": "Quy trình SOP kỹ thuật bất hoạt Carbapenem cải tiến (mCIM).docx",
        "category": "04. Kháng thuốc đặc biệt (Colistin, ESBL & Carbapenemase)",
        "cat_id": "special_resistance",
        "cat_name": "Kháng Thuốc Đặc Biệt (Colistin, ESBL & Carbapenemase)",
        "path": "Tài liệu/04. Kháng thuốc đặc biệt (Colistin, ESBL & Carbapenemase)/4.2. Cơ chế kháng thuốc ESBL & Carbapenemase (mCIM)/Quy trình SOP kỹ thuật bất hoạt Carbapenem cải tiến (mCIM).docx",
        "format": "DOCX",
        "size_mb": 0.19,
        "desc": "Quy trình chuẩn SOP và bài giảng chuyên sâu về phương pháp mCIM phát hiện vi khuẩn sinh men Carbapenemase và ESBL.",
        "tags": [
            "Carbapenemase",
            "mCIM",
            "ESBL",
            "SOP"
        ]
    },
    {
        "id": "doc_10",
        "title": "Bài giảng Tổng hợp về kháng sinh Colistin.pptx",
        "category": "04. Kháng thuốc đặc biệt (Colistin, ESBL & Carbapenemase)",
        "cat_id": "special_resistance",
        "cat_name": "Kháng Thuốc Đặc Biệt (Colistin, ESBL & Carbapenemase)",
        "path": "Tài liệu/04. Kháng thuốc đặc biệt (Colistin, ESBL & Carbapenemase)/4.1. Kháng sinh Colistin/Bài giảng Tổng hợp về kháng sinh Colistin.pptx",
        "format": "PPTX",
        "size_mb": 0.55,
        "desc": "Hướng dẫn thử nghiệm, khuyến cáo cảnh báo kháng giả của bioMérieux và phiên giải kháng sinh đồ Colistin.",
        "tags": [
            "Colistin",
            "Polymyxin",
            "Kháng sinh đồ"
        ]
    },
    {
        "id": "doc_11",
        "title": "Khuyến cáo bioMérieux & CLSI 2025 về thử nghiệm Colistin.docx",
        "category": "04. Kháng thuốc đặc biệt (Colistin, ESBL & Carbapenemase)",
        "cat_id": "special_resistance",
        "cat_name": "Kháng Thuốc Đặc Biệt (Colistin, ESBL & Carbapenemase)",
        "path": "Tài liệu/04. Kháng thuốc đặc biệt (Colistin, ESBL & Carbapenemase)/4.1. Kháng sinh Colistin/Khuyến cáo bioMérieux & CLSI 2025 về thử nghiệm Colistin.docx",
        "format": "DOCX",
        "size_mb": 0.02,
        "desc": "Tiêu chuẩn CLSI M100 Ed35 (2025), quy chuẩn điểm gãy lâm sàng phiên giải kết quả kháng sinh đồ.",
        "tags": [
            "CLSI 2025",
            "Ed35"
        ]
    },
    {
        "id": "doc_12",
        "title": "Lecture 19a - Hướng dẫn thử nghiệm và phiên giải Colistin.pdf",
        "category": "04. Kháng thuốc đặc biệt (Colistin, ESBL & Carbapenemase)",
        "cat_id": "special_resistance",
        "cat_name": "Kháng Thuốc Đặc Biệt (Colistin, ESBL & Carbapenemase)",
        "path": "Tài liệu/04. Kháng thuốc đặc biệt (Colistin, ESBL & Carbapenemase)/4.1. Kháng sinh Colistin/Lecture 19a - Hướng dẫn thử nghiệm và phiên giải Colistin.pdf",
        "format": "PDF",
        "size_mb": 3.12,
        "desc": "Hướng dẫn thử nghiệm, khuyến cáo cảnh báo kháng giả của bioMérieux và phiên giải kháng sinh đồ Colistin.",
        "tags": [
            "Colistin",
            "Polymyxin",
            "Kháng sinh đồ"
        ]
    },
    {
        "id": "doc_13",
        "title": "CLSI M44-A2 - Phương pháp kháng nấm đồ khoanh giấy khuếch tán đối với nấm men (Tiếng Việt).pdf",
        "category": "05. Vi nấm & Kháng nấm đồ",
        "cat_id": "fungal_infections",
        "cat_name": "Vi Nấm & Kháng Nấm Đồ (CLSI M44 & Nhiễm Nấm Xâm Lấn)",
        "path": "Tài liệu/05. Vi nấm & Kháng nấm đồ/CLSI M44-A2 - Phương pháp kháng nấm đồ khoanh giấy khuếch tán đối với nấm men (Tiếng Việt).pdf",
        "format": "PDF",
        "size_mb": 1.14,
        "desc": "Bản dịch hướng dẫn thử nghiệm độ nhạy cảm kháng sinh CLSI sang tiếng Việt.",
        "tags": [
            "Tiếng Việt",
            "CLSI"
        ]
    },
    {
        "id": "doc_14",
        "title": "Khuyến cáo Chẩn đoán và điều trị nhiễm nấm xâm lấn.pdf",
        "category": "05. Vi nấm & Kháng nấm đồ",
        "cat_id": "fungal_infections",
        "cat_name": "Vi Nấm & Kháng Nấm Đồ (CLSI M44 & Nhiễm Nấm Xâm Lấn)",
        "path": "Tài liệu/05. Vi nấm & Kháng nấm đồ/Khuyến cáo Chẩn đoán và điều trị nhiễm nấm xâm lấn.pdf",
        "format": "PDF",
        "size_mb": 8.43,
        "desc": "Tài liệu chuyên môn vi sinh và kháng sinh đồ.",
        "tags": [
            "Tài liệu Vi sinh"
        ]
    },
    {
        "id": "doc_15",
        "title": "Bài giảng Tổng quan CLSI & Thực hành Kiểm soát chất lượng (QC) chủng chuẩn.pptx",
        "category": "02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định",
        "cat_id": "clsi_specialized",
        "cat_name": "CLSI Chuyên Biệt - Quy Trình, QC & Thẩm Định",
        "path": "Tài liệu/02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định/CLSI M50 & M52 - Kiểm soát chất lượng (QC) & Thẩm định/Bài giảng Tổng quan CLSI & Thực hành Kiểm soát chất lượng (QC) chủng chuẩn.pptx",
        "format": "PPTX",
        "size_mb": 0.32,
        "desc": "Tài liệu chuyên môn vi sinh và kháng sinh đồ.",
        "tags": [
            "Tài liệu Vi sinh"
        ]
    },
    {
        "id": "doc_16",
        "title": "CLSI M50-A - Kiểm soát chất lượng hệ thống định danh vi sinh thương mại (Tiếng Việt).pdf",
        "category": "02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định",
        "cat_id": "clsi_specialized",
        "cat_name": "CLSI Chuyên Biệt - Quy Trình, QC & Thẩm Định",
        "path": "Tài liệu/02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định/CLSI M50 & M52 - Kiểm soát chất lượng (QC) & Thẩm định/CLSI M50-A - Kiểm soát chất lượng hệ thống định danh vi sinh thương mại (Tiếng Việt).pdf",
        "format": "PDF",
        "size_mb": 1.38,
        "desc": "Bản dịch hướng dẫn thử nghiệm độ nhạy cảm kháng sinh CLSI sang tiếng Việt.",
        "tags": [
            "Tiếng Việt",
            "CLSI"
        ]
    },
    {
        "id": "doc_17",
        "title": "CLSI M52 - Thẩm định hệ thống định danh và kháng sinh đồ thương mại (Tiếng Việt - Bản đầy đủ).pdf",
        "category": "02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định",
        "cat_id": "clsi_specialized",
        "cat_name": "CLSI Chuyên Biệt - Quy Trình, QC & Thẩm Định",
        "path": "Tài liệu/02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định/CLSI M50 & M52 - Kiểm soát chất lượng (QC) & Thẩm định/CLSI M52 - Thẩm định hệ thống định danh và kháng sinh đồ thương mại (Tiếng Việt - Bản đầy đủ).pdf",
        "format": "PDF",
        "size_mb": 1.86,
        "desc": "Bản dịch hướng dẫn thử nghiệm độ nhạy cảm kháng sinh CLSI sang tiếng Việt.",
        "tags": [
            "Tiếng Việt",
            "CLSI"
        ]
    },
    {
        "id": "doc_18",
        "title": "CLSI M52 - Thẩm định hệ thống định danh và kháng sinh đồ thương mại (Tiếng Việt - Bản đọc thử).pdf",
        "category": "02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định",
        "cat_id": "clsi_specialized",
        "cat_name": "CLSI Chuyên Biệt - Quy Trình, QC & Thẩm Định",
        "path": "Tài liệu/02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định/CLSI M50 & M52 - Kiểm soát chất lượng (QC) & Thẩm định/CLSI M52 - Thẩm định hệ thống định danh và kháng sinh đồ thương mại (Tiếng Việt - Bản đọc thử).pdf",
        "format": "PDF",
        "size_mb": 0.14,
        "desc": "Bản dịch hướng dẫn thử nghiệm độ nhạy cảm kháng sinh CLSI sang tiếng Việt.",
        "tags": [
            "Tiếng Việt",
            "CLSI"
        ]
    },
    {
        "id": "doc_19",
        "title": "CLSI M02 Ed14 - Kỹ thuật Kháng sinh đồ khoanh giấy khuếch tán.pdf",
        "category": "02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định",
        "cat_id": "clsi_specialized",
        "cat_name": "CLSI Chuyên Biệt - Quy Trình, QC & Thẩm Định",
        "path": "Tài liệu/02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định/CLSI M02 & M07 - Kỹ thuật Khoanh giấy & Pha loãng MIC/CLSI M02 Ed14 - Kỹ thuật Kháng sinh đồ khoanh giấy khuếch tán.pdf",
        "format": "PDF",
        "size_mb": 9.25,
        "desc": "Tiêu chuẩn phương pháp thử nghiệm kháng sinh đồ bằng kỹ thuật khoanh giấy khuếch tán (Disk Diffusion).",
        "tags": [
            "CLSI M02",
            "Khoanh giấy",
            "Disk Diffusion"
        ]
    },
    {
        "id": "doc_20",
        "title": "CLSI M07 Ed12 - Kỹ thuật Kháng sinh đồ pha loãng xác định MIC.pdf",
        "category": "02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định",
        "cat_id": "clsi_specialized",
        "cat_name": "CLSI Chuyên Biệt - Quy Trình, QC & Thẩm Định",
        "path": "Tài liệu/02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định/CLSI M02 & M07 - Kỹ thuật Khoanh giấy & Pha loãng MIC/CLSI M07 Ed12 - Kỹ thuật Kháng sinh đồ pha loãng xác định MIC.pdf",
        "format": "PDF",
        "size_mb": 12.47,
        "desc": "Tiêu chuẩn phương pháp pha loãng trong thạch và trong ống nghiệm để xác định nồng độ ức chế tối thiểu (MIC).",
        "tags": [
            "CLSI M07",
            "MIC",
            "Pha loãng"
        ]
    },
    {
        "id": "doc_21",
        "title": "CLSI M45 Ed3 - Kháng sinh đồ cho vi khuẩn ít gặp và khó nuôi cấy.pdf",
        "category": "02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định",
        "cat_id": "clsi_specialized",
        "cat_name": "CLSI Chuyên Biệt - Quy Trình, QC & Thẩm Định",
        "path": "Tài liệu/02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định/CLSI M45 - Vi khuẩn ít gặp & Khó nuôi cấy/CLSI M45 Ed3 - Kháng sinh đồ cho vi khuẩn ít gặp và khó nuôi cấy.pdf",
        "format": "PDF",
        "size_mb": 1.36,
        "desc": "Tiêu chuẩn hướng dẫn thử nghiệm kháng sinh đồ cho các vi khuẩn khó nuôi cấy và ít gặp trong lâm sàng.",
        "tags": [
            "CLSI M45",
            "Vi khuẩn khó nuôi cấy"
        ]
    },
    {
        "id": "doc_22",
        "title": "CLSI M39 - Phân tích và trình bày dữ liệu nhạy cảm kháng sinh (Tiếng Việt).pdf",
        "category": "02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định",
        "cat_id": "clsi_specialized",
        "cat_name": "CLSI Chuyên Biệt - Quy Trình, QC & Thẩm Định",
        "path": "Tài liệu/02. CLSI Chuyên biệt - Quy trình, QC & Thẩm định/CLSI M39 - Phân tích Kháng sinh đồ tích lũy (Antibiogram)/CLSI M39 - Phân tích và trình bày dữ liệu nhạy cảm kháng sinh (Tiếng Việt).pdf",
        "format": "PDF",
        "size_mb": 0.48,
        "desc": "Bản dịch hướng dẫn thử nghiệm độ nhạy cảm kháng sinh CLSI sang tiếng Việt.",
        "tags": [
            "Tiếng Việt",
            "CLSI"
        ]
    },
    {
        "id": "doc_23",
        "title": "CLSI M100 Ed35 (2025).pdf",
        "category": "01. CLSI M100 - Bảng điểm gãy qua các năm",
        "cat_id": "clsi_m100",
        "cat_name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "path": "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/2025 - CLSI M100 Ed35/CLSI M100 Ed35 (2025).pdf",
        "format": "PDF",
        "size_mb": 17.33,
        "desc": "Tiêu chuẩn CLSI M100 Ed35 (2025), quy chuẩn điểm gãy lâm sàng phiên giải kết quả kháng sinh đồ.",
        "tags": [
            "CLSI 2025",
            "Ed35"
        ]
    },
    {
        "id": "doc_24",
        "title": "CLSI M100 Ed36 (2026) - Bài giảng Cập nhật Kỹ thuật Lâm sàng.pptx",
        "category": "01. CLSI M100 - Bảng điểm gãy qua các năm",
        "cat_id": "clsi_m100",
        "cat_name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "path": "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/2026 - CLSI M100 Ed36/CLSI M100 Ed36 (2026) - Bài giảng Cập nhật Kỹ thuật Lâm sàng.pptx",
        "format": "PPTX",
        "size_mb": 53.81,
        "desc": "Bộ tài liệu tiêu chuẩn CLSI M100 Ed36 mới nhất (2026), cập nhật điểm gãy Aztreonam-avibactam, Aminoglycosides cho Acinetobacter, Lậu cầu và đề kháng tự nhiên.",
        "tags": [
            "CLSI 2026",
            "Ed36",
            "Mới nhất"
        ]
    },
    {
        "id": "doc_25",
        "title": "CLSI M100 Ed36 (2026) - Bảng đề kháng tự nhiên.xlsx",
        "category": "01. CLSI M100 - Bảng điểm gãy qua các năm",
        "cat_id": "clsi_m100",
        "cat_name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "path": "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/2026 - CLSI M100 Ed36/CLSI M100 Ed36 (2026) - Bảng đề kháng tự nhiên.xlsx",
        "format": "XLSX",
        "size_mb": 0.01,
        "desc": "Bộ tài liệu tiêu chuẩn CLSI M100 Ed36 mới nhất (2026), cập nhật điểm gãy Aztreonam-avibactam, Aminoglycosides cho Acinetobacter, Lậu cầu và đề kháng tự nhiên.",
        "tags": [
            "CLSI 2026",
            "Ed36",
            "Mới nhất"
        ]
    },
    {
        "id": "doc_26",
        "title": "CLSI M100 Ed36 (2026) - Infographic Những thay đổi quan trọng.png",
        "category": "01. CLSI M100 - Bảng điểm gãy qua các năm",
        "cat_id": "clsi_m100",
        "cat_name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "path": "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/2026 - CLSI M100 Ed36/CLSI M100 Ed36 (2026) - Infographic Những thay đổi quan trọng.png",
        "format": "PNG",
        "size_mb": 5.63,
        "desc": "Bộ tài liệu tiêu chuẩn CLSI M100 Ed36 mới nhất (2026), cập nhật điểm gãy Aztreonam-avibactam, Aminoglycosides cho Acinetobacter, Lậu cầu và đề kháng tự nhiên.",
        "tags": [
            "CLSI 2026",
            "Ed36",
            "Mới nhất"
        ]
    },
    {
        "id": "doc_27",
        "title": "CLSI M100 Ed36 (2026) - Toàn văn.pdf",
        "category": "01. CLSI M100 - Bảng điểm gãy qua các năm",
        "cat_id": "clsi_m100",
        "cat_name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "path": "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/2026 - CLSI M100 Ed36/CLSI M100 Ed36 (2026) - Toàn văn.pdf",
        "format": "PDF",
        "size_mb": 56.14,
        "desc": "Bộ tài liệu tiêu chuẩn CLSI M100 Ed36 mới nhất (2026), cập nhật điểm gãy Aztreonam-avibactam, Aminoglycosides cho Acinetobacter, Lậu cầu và đề kháng tự nhiên.",
        "tags": [
            "CLSI 2026",
            "Ed36",
            "Mới nhất"
        ]
    },
    {
        "id": "doc_28",
        "title": "CLSI M100 Ed36 (2026) - Tóm tắt các thay đổi cơ bản.pdf",
        "category": "01. CLSI M100 - Bảng điểm gãy qua các năm",
        "cat_id": "clsi_m100",
        "cat_name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "path": "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/2026 - CLSI M100 Ed36/CLSI M100 Ed36 (2026) - Tóm tắt các thay đổi cơ bản.pdf",
        "format": "PDF",
        "size_mb": 5.7,
        "desc": "Bộ tài liệu tiêu chuẩn CLSI M100 Ed36 mới nhất (2026), cập nhật điểm gãy Aztreonam-avibactam, Aminoglycosides cho Acinetobacter, Lậu cầu và đề kháng tự nhiên.",
        "tags": [
            "CLSI 2026",
            "Ed36",
            "Mới nhất"
        ]
    },
    {
        "id": "doc_29",
        "title": "CLSI M100 Ed34 (2024).pdf",
        "category": "01. CLSI M100 - Bảng điểm gãy qua các năm",
        "cat_id": "clsi_m100",
        "cat_name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "path": "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/2024 - CLSI M100 Ed34/CLSI M100 Ed34 (2024).pdf",
        "format": "PDF",
        "size_mb": 17.35,
        "desc": "Tiêu chuẩn CLSI M100 Ed34 (2024).",
        "tags": [
            "CLSI 2024",
            "Ed34"
        ]
    },
    {
        "id": "doc_30",
        "title": "CLSI M100 Ed27 (2017).pdf",
        "category": "01. CLSI M100 - Bảng điểm gãy qua các năm",
        "cat_id": "clsi_m100",
        "cat_name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "path": "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/2017 - CLSI M100 Ed27/CLSI M100 Ed27 (2017).pdf",
        "format": "PDF",
        "size_mb": 8.06,
        "desc": "Tiêu chuẩn CLSI M100 Ed27 (2017).",
        "tags": [
            "CLSI 2017",
            "Ed27"
        ]
    },
    {
        "id": "doc_31",
        "title": "CLSI M100 Ed33 (2023) - Bản 1.pdf",
        "category": "01. CLSI M100 - Bảng điểm gãy qua các năm",
        "cat_id": "clsi_m100",
        "cat_name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "path": "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/2023 - CLSI M100 Ed33/CLSI M100 Ed33 (2023) - Bản 1.pdf",
        "format": "PDF",
        "size_mb": 18.71,
        "desc": "Tiêu chuẩn CLSI M100 Ed33 (2023).",
        "tags": [
            "CLSI 2023",
            "Ed33"
        ]
    },
    {
        "id": "doc_32",
        "title": "CLSI M100 Ed33 (2023) - Bản 2 (M100-S33).pdf",
        "category": "01. CLSI M100 - Bảng điểm gãy qua các năm",
        "cat_id": "clsi_m100",
        "cat_name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "path": "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/2023 - CLSI M100 Ed33/CLSI M100 Ed33 (2023) - Bản 2 (M100-S33).pdf",
        "format": "PDF",
        "size_mb": 16.21,
        "desc": "Tiêu chuẩn CLSI M100 Ed33 (2023).",
        "tags": [
            "CLSI 2023",
            "Ed33"
        ]
    },
    {
        "id": "doc_33",
        "title": "CLSI M100 - Hướng dẫn thử nghiệm nhạy cảm kháng sinh (Tiếng Việt - Bản rút gọn).pdf",
        "category": "01. CLSI M100 - Bảng điểm gãy qua các năm",
        "cat_id": "clsi_m100",
        "cat_name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "path": "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/CLSI M100 - Bản dịch Tiếng Việt/CLSI M100 - Hướng dẫn thử nghiệm nhạy cảm kháng sinh (Tiếng Việt - Bản rút gọn).pdf",
        "format": "PDF",
        "size_mb": 2.92,
        "desc": "Bản dịch hướng dẫn thử nghiệm độ nhạy cảm kháng sinh CLSI sang tiếng Việt.",
        "tags": [
            "Tiếng Việt",
            "CLSI"
        ]
    },
    {
        "id": "doc_34",
        "title": "CLSI M100 - Hướng dẫn thử nghiệm nhạy cảm kháng sinh (Tiếng Việt - Bản đầy đủ).pdf",
        "category": "01. CLSI M100 - Bảng điểm gãy qua các năm",
        "cat_id": "clsi_m100",
        "cat_name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "path": "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/CLSI M100 - Bản dịch Tiếng Việt/CLSI M100 - Hướng dẫn thử nghiệm nhạy cảm kháng sinh (Tiếng Việt - Bản đầy đủ).pdf",
        "format": "PDF",
        "size_mb": 3.64,
        "desc": "Bản dịch hướng dẫn thử nghiệm độ nhạy cảm kháng sinh CLSI sang tiếng Việt.",
        "tags": [
            "Tiếng Việt",
            "CLSI"
        ]
    },
    {
        "id": "doc_35",
        "title": "CLSI M100 Ed30 (2020).pdf",
        "category": "01. CLSI M100 - Bảng điểm gãy qua các năm",
        "cat_id": "clsi_m100",
        "cat_name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "path": "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/2020 - CLSI M100 Ed30/CLSI M100 Ed30 (2020).pdf",
        "format": "PDF",
        "size_mb": 12.22,
        "desc": "Tiêu chuẩn CLSI M100 Ed30 (2020).",
        "tags": [
            "CLSI 2020",
            "Ed30"
        ]
    },
    {
        "id": "doc_36",
        "title": "CLSI M100 Ed32 (2022).pdf",
        "category": "01. CLSI M100 - Bảng điểm gãy qua các năm",
        "cat_id": "clsi_m100",
        "cat_name": "CLSI M100 - Bảng Điểm Gãy Kháng Sinh (2017 - 2026)",
        "path": "Tài liệu/01. CLSI M100 - Bảng điểm gãy qua các năm/2022 - CLSI M100 Ed32/CLSI M100 Ed32 (2022).pdf",
        "format": "PDF",
        "size_mb": 8.12,
        "desc": "Tiêu chuẩn CLSI M100 Ed32 (2022).",
        "tags": [
            "CLSI 2022",
            "Ed32"
        ]
    },
    {
        "id": "doc_37",
        "title": "Bài giảng Sử dụng thẻ kháng sinh đồ VITEK mới (23-10-2025).pptx",
        "category": "03. Thẻ Kháng sinh đồ VITEK (AST-N439 & N240)",
        "cat_id": "vitek_cards",
        "cat_name": "Thẻ Kháng Sinh Đồ VITEK 2 (AST-N439 & N240)",
        "path": "Tài liệu/03. Thẻ Kháng sinh đồ VITEK (AST-N439 & N240)/Bài giảng Sử dụng thẻ kháng sinh đồ VITEK mới (23-10-2025).pptx",
        "format": "PPTX",
        "size_mb": 1.64,
        "desc": "Tiêu chuẩn CLSI M100 Ed35 (2025), quy chuẩn điểm gãy lâm sàng phiên giải kết quả kháng sinh đồ.",
        "tags": [
            "CLSI 2025",
            "Ed35"
        ]
    },
    {
        "id": "doc_38",
        "title": "Bảng so sánh chi tiết thẻ AST-N439 và AST-N240 (Theo chủng vi khuẩn).xlsx",
        "category": "03. Thẻ Kháng sinh đồ VITEK (AST-N439 & N240)",
        "cat_id": "vitek_cards",
        "cat_name": "Thẻ Kháng Sinh Đồ VITEK 2 (AST-N439 & N240)",
        "path": "Tài liệu/03. Thẻ Kháng sinh đồ VITEK (AST-N439 & N240)/Bảng so sánh chi tiết thẻ AST-N439 và AST-N240 (Theo chủng vi khuẩn).xlsx",
        "format": "XLSX",
        "size_mb": 0.04,
        "desc": "Tài liệu kỹ thuật, hướng dẫn sử dụng và so sánh thẻ kháng sinh đồ Gram âm mới AST-N439 thay thế AST-N240 của bioMérieux.",
        "tags": [
            "VITEK 2",
            "AST-N439",
            "N240"
        ]
    },
    {
        "id": "doc_39",
        "title": "Bảng so sánh tổng thể thẻ AST-N439 và AST-N240 (Kèm thống kê 2023).xlsx",
        "category": "03. Thẻ Kháng sinh đồ VITEK (AST-N439 & N240)",
        "cat_id": "vitek_cards",
        "cat_name": "Thẻ Kháng Sinh Đồ VITEK 2 (AST-N439 & N240)",
        "path": "Tài liệu/03. Thẻ Kháng sinh đồ VITEK (AST-N439 & N240)/Bảng so sánh tổng thể thẻ AST-N439 và AST-N240 (Kèm thống kê 2023).xlsx",
        "format": "XLSX",
        "size_mb": 0.02,
        "desc": "Tiêu chuẩn CLSI M100 Ed33 (2023).",
        "tags": [
            "CLSI 2023",
            "Ed33"
        ]
    },
    {
        "id": "doc_40",
        "title": "Danh mục các thẻ kháng sinh đồ VITEK.pdf",
        "category": "03. Thẻ Kháng sinh đồ VITEK (AST-N439 & N240)",
        "cat_id": "vitek_cards",
        "cat_name": "Thẻ Kháng Sinh Đồ VITEK 2 (AST-N439 & N240)",
        "path": "Tài liệu/03. Thẻ Kháng sinh đồ VITEK (AST-N439 & N240)/Danh mục các thẻ kháng sinh đồ VITEK.pdf",
        "format": "PDF",
        "size_mb": 0.05,
        "desc": "Tài liệu chuyên môn vi sinh và kháng sinh đồ.",
        "tags": [
            "Tài liệu Vi sinh"
        ]
    },
    {
        "id": "doc_41",
        "title": "Tài liệu giới thiệu cấu hình thẻ VITEK 2 AST-N439.pdf",
        "category": "03. Thẻ Kháng sinh đồ VITEK (AST-N439 & N240)",
        "cat_id": "vitek_cards",
        "cat_name": "Thẻ Kháng Sinh Đồ VITEK 2 (AST-N439 & N240)",
        "path": "Tài liệu/03. Thẻ Kháng sinh đồ VITEK (AST-N439 & N240)/Tài liệu giới thiệu cấu hình thẻ VITEK 2 AST-N439.pdf",
        "format": "PDF",
        "size_mb": 0.64,
        "desc": "Tài liệu kỹ thuật, hướng dẫn sử dụng và so sánh thẻ kháng sinh đồ Gram âm mới AST-N439 thay thế AST-N240 của bioMérieux.",
        "tags": [
            "VITEK 2",
            "AST-N439",
            "N240"
        ]
    },
    {
        "id": "doc_42",
        "title": "Tờ hướng dẫn sử dụng thẻ VITEK 2 AST-N439 (Tiếng Việt).pdf",
        "category": "03. Thẻ Kháng sinh đồ VITEK (AST-N439 & N240)",
        "cat_id": "vitek_cards",
        "cat_name": "Thẻ Kháng Sinh Đồ VITEK 2 (AST-N439 & N240)",
        "path": "Tài liệu/03. Thẻ Kháng sinh đồ VITEK (AST-N439 & N240)/Tờ hướng dẫn sử dụng thẻ VITEK 2 AST-N439 (Tiếng Việt).pdf",
        "format": "PDF",
        "size_mb": 1.11,
        "desc": "Bản dịch hướng dẫn thử nghiệm độ nhạy cảm kháng sinh CLSI sang tiếng Việt.",
        "tags": [
            "Tiếng Việt",
            "CLSI"
        ]
    }
]
};

if (typeof window !== "undefined") {
  window.DocumentLibraryData = DocumentLibraryData;
}
