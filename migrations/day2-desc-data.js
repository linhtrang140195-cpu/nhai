// Short curated descriptions for DAY #2 voting cards
// tools[] is set directly into tools_used column to bypass parser
module.exports = [
  {
    titleMatch: 'sử dụng MCP Garena',
    tools: ['MCP Garena', 'Thư ký Kim'],
    desc: `Tự động theo dõi giấy tờ Vendor và nhắn tin thông báo tình trạng cho requester qua Thư Ký Kim, thay vì nhắn thủ công từng người.`,
  },
  {
    titleMatch: 'Hoàn thiện công cụ Việt H',
    tools: ['AI/Codex'],
    desc: `Tự động phát hiện ký tự tiếng Việt còn thiếu trong font, tạo glyph dấu và xuất file font đã Việt hóa — không cần tìm outsource.`,
  },
  {
    titleMatch: 'Plugin Beat Shake',
    tools: ['Claude'],
    desc: `Plugin cài thẳng vào Creative Cloud, tự động tạo hiệu ứng giật nhịp beat trên Premiere — không cần làm thủ công từng frame.`,
  },
  {
    titleMatch: 'Check gian lận giờ chơi',
    tools: [],
    desc: `Script tự động kiểm tra game time thực sự từ log session, phát hiện user treo máy để gian lận giờ chơi trong chương trình khuyến mãi.`,
  },
  {
    titleMatch: 'Tự động hóa quy trình báo cáo kế toán',
    tools: ['Claude'],
    desc: `Tự động hóa một phần quy trình báo cáo kế toán bằng Claude.`,
  },
  {
    titleMatch: 'Tự động hóa quy trình transcript FGD',
    tools: ['Gemini', 'Compass'],
    desc: `Tự động chuyển video FGD thành transcript bằng Gemini qua Compass, tiết kiệm thời gian note-taking và tổng hợp report.`,
  },
  {
    titleMatch: 'Chuyển đổi giọng nói thành',
    tools: ['Swift 6 + SwiftUI', 'whisper.cpp', 'Apple Translation', 'SQLite', 'OBS'],
    desc: `App macOS chuyển giọng nói tiếng Việt thành transcript real-time, dịch và hiển thị phụ đề song ngữ — toàn bộ xử lý local trên máy.`,
  },
  {
    titleMatch: 'Check quality bản build',
    tools: ['Codex GPT 5.6 Sol', 'MCP Garena', 'Alpha Intelligence'],
    desc: `Tự động phát hiện lỗi config và cảnh báo rủi ro "balance break" khi so sánh 2 version bản build, giảm tải review thủ công cho Designer và QA.`,
  },
  {
    titleMatch: 'Tự động hóa quy trình kiểm duyệt Publishing',
    tools: ['TinyFaceDetection', 'Alpha Intelligence'],
    desc: `Extension tự động phát hiện ảnh có mặt người bằng AI, đánh dấu để reviewer duyệt nhanh thay vì kiểm tra thủ công toàn bộ.`,
  },
  {
    titleMatch: 'Thiệu Kỳ',
    tools: [],
    desc: `Auto planning timeline & chatbot nhắc lịch, kết hợp web quiz giúp user tìm lối chơi phù hợp để tạo UGC content.`,
  },
  {
    titleMatch: 'RosterForge',
    tools: ['Claude Code'],
    desc: `Tool tự động tạo hàng loạt video overlay thay ảnh/tên — dùng cho giải đấu esports Free Fire và clip thiệp mời KOL của FCO.`,
  },
  {
    titleMatch: 'Tối ưu hóa workflow cho team PUGC',
    tools: ['Claude', 'Demo System', 'Compass LLM'],
    desc: `Bot ghi nhận feedback/bug report từ team, phân tích và lưu vào database có cấu trúc để tổng hợp khi cần — không cần input thủ công.`,
  },
];
