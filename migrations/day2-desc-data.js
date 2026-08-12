// Full descriptions & tools extracted from "data NHAI DAY - sn nhai 2.csv"
// tools[] is set directly into tools_used column to bypass parser
module.exports = [
  {
    titleMatch: 'sử dụng MCP Garena',
    tools: ['MCP Garena', 'Thư ký Kim'],
    desc: `Đề bài 1: khi nhận được giấy tờ từ đối tác, chị phải :
Ghi nhận trên hệ thống Vendors.garena.vn những giấy tờ đã nhận được
Nhắn tin cho từng requester qua seatalk để update tình trạng giấy tờ --> mất thời gian và làm phiền trực tiếp

Giải pháp: Sử dụng MCP Garena và Thư ký Kim để:
tự theo dõi các request Vendor do chị quản lý để nhận biết khi chị gắn tag xác nhận đã nhận bản cứng Hợp đồng, DDH và/hoặc BBNT.
Hệ thống sẽ thông báo ngay cho người tạo request, gửi qua Thư Ký Kim với nhân viên hoặc vào group SeaTalk riêng với CTV/EXT, đồng thời gộp các request phát sinh cùng lúc cho dễ theo dõi.
Chị nhận báo cáo riêng về kết quả gửi, gồm người nhận, request/link, loại giấy tờ, thời gian, kênh gửi và lỗi nếu có.

Đề bài 2: khi giấy tờ được trình ký xong, chị cần:
Ghi nhận trên hệ thống Vendors.garena.vn những giấy tờ đã trình ký
Báo Requester để trao đổi với Đối tác xuất hóa đơn VAT
Giải pháp: Sử dụng MCP Garena và Thư ký Kim để:
tự theo dõi các request Vendor do chị quản lý để nhận biết khi chị gắn tag xác nhận đã ký Hợp đồng, DDH và/hoặc BBNT.
Hệ thống sẽ thông báo ngay cho người tạo request, gửi qua Thư Ký Kim với nhân viên hoặc vào group SeaTalk riêng với CTV/EXT, đồng thời gộp các request phát sinh cùng lúc cho dễ theo dõi.
Chị nhận báo cáo riêng về kết quả gửi, gồm người nhận, request/link, loại giấy tờ, thời gian, kênh gửi và lỗi nếu có.

Tool sử dụng: MCP Garena, Thư ký Kim`,
  },
  {
    titleMatch: 'Hoàn thiện công cụ Việt H',
    tools: ['AI/Codex'],
    desc: `Mục Đích
Công cụ này dùng để hỗ trợ Việt hóa font nhanh hơn cho team thiết kế, không cần tìm outsource

Tool Sử Dụng
Công cụ được tạo với sự hỗ trợ của AI/Codex để viết code, debug và cải tiến workflow

Cách Hoạt Động
Người dùng chạy tool local, upload file font .ttf hoặc .otf. Tool phân tích font, kiểm tra các ký tự tiếng Việt còn thiếu, sau đó tự tạo glyph mới bằng cách ghép chữ gốc với các dấu tiếng Việt như sắc, huyền, hỏi, ngã, nặng, mũ, móc và nét Đ/đ. Giao diện cho phép preview trước/sau và tinh chỉnh vị trí dấu. Khi hoàn tất, người dùng bấm xuất font, file Việt hóa sẽ được lưu vào thư mục output để đem đi sử dụng.

Ý tưởng tiếp theo
Upgrade UI để trông thẩm mỹ và tối ưu hơn cho người sử dụng
Tiếp tục test với các case thực tế để phát hiện lỗi (vì font có rất nhiều và có thể dễ phát sinh lỗi)`,
  },
  {
    titleMatch: 'Plugin Beat Shake',
    tools: ['Claude'],
    desc: `Mục đích sử dụng:
Làm capcut giật giật nhanh và tự động ngay trên Premiere
Tool sử dụng:
Dùng Claude build Plugin cài trực tiếp vào Creative Cloud Desktop
Demo sản phẩm:
Add hiệu ứng vào 1 adjustment layer -> chọn file adjustment layer và nhạc bấm tự động -> auto marker trên file nhạc + add keyframe hiệu ứng vào adjustment layer
Có ý tưởng follow/ upgrade tiếp theo ntn?
Dùng MCP kết nối với Premiere và Plugin để tự động hơn nữa`,
  },
  {
    titleMatch: 'Check gian lận giờ chơi',
    tools: [],
    desc: `Hỗ trợ team Community verify số liệu giờ chơi thực sự của người chơi tại các phòng net đối tác trong thời gian thực hiện chương trình khuyến mãi.

Từ data session đăng nhập và thoát game, script tự động check game time của user trong giữa khoảng thời gian đó, để tránh trường hợp user chỉ vào game xong treo máy và chơi game khác.`,
  },
  {
    titleMatch: 'Tự động hóa quy trình báo cáo kế toán',
    tools: ['Claude'],
    desc: `Mục đích: tự động hóa 1 phần  báo cáo kế toán
Tool: Claude`,
  },
  {
    titleMatch: 'Tự động hóa quy trình transcript FGD',
    tools: ['Gemini', 'Compass'],
    desc: `Mục đích: tự động chuyển video FGD thành transcript, giúp tiết kiệm thời gian note-taking và tổng hợp report cho các team game làm FGD

Tool sử dụng:
- Gemini models thông qua Compass

Demo:
- Mới chỉ dừng lại ở flow cơ bản, còn cần cải thiện chất lượng nhiều`,
  },
  {
    titleMatch: 'Chuyển đổi giọng nói thành',
    tools: ['Swift 6 + SwiftUI', 'whisper.cpp', 'Apple Translation', 'SQLite', 'OBS'],
    desc: `1.Mô tả ngắn gọn về case
MacSpeechTranslator là ứng dụng macOS chuyển giọng nói tiếng Việt thành văn bản theo thời gian thực, sau đó dịch câu đã hoàn chỉnh và hiển thị phụ đề.
2.Mục đích sử dụng
Hỗ trợ cá nhân/team làm livestream, họp, đào tạo hoặc ghi nhận nội dung tiếng Việt cần phụ đề/dịch. Dữ liệu âm thanh, transcript và model đều xử lý/lưu cục bộ trên máy Mac, phù hợp yêu cầu riêng tư.
3.Tool sử dụng
Swift 6 + SwiftUI, Core Audio/ScreenCaptureKit, whisper.cpp chạy local với model Whisper GGUF, Apple Translation (ngôn ngữ đã cài local), SQLite, và OBS/browser overlay qua localhost.
4.Demo sản phẩm
Chọn microphone hoặc system audio → app phát hiện giọng nói, tạo transcript tiếng Việt dạng partial/final → chuẩn hóa thuật ngữ và dịch câu final → lưu lịch sử/xuất TXT, JSON, SRT, VTT → gửi phụ đề song ngữ đến trang overlay local để dùng trong OBS/browser.
5.Có ý tưởng follow/upgrade tiếp theo ntn?
- Tích hợp Whisper trực tiếp trong app thay vì gọi CLI để giảm độ trễ.
- Thêm Silero VAD cho môi trường ồn/nhạc nền.
- Fine-tune Whisper với dữ liệu tiếng Việt theo domain.
- Hoàn thiện kiểm thử thiết bị thật, benchmark độ chính xác/độ trễ.
- Sử dụng AI để đọc text sau khi đã sub tương tự như một caster AI`,
  },
  {
    titleMatch: 'Check quality bản build',
    tools: ['Codex GPT 5.6 Sol', 'MCP Garena', 'Alpha Intelligence'],
    desc: `Giải quyết: Tự động phát hiện lỗi config và cảnh báo rủi ro "balance break" (mất cân bằng game) do thay đổi thông số. Giúp giảm tải hàng giờ đồng hồ review thủ công và tránh bug lọt xuống môi trường Production.
Dành cho: Các Game Designer, Game Developers, và QA.

Tool sử dụng: Codex GPT 5.6 Sol để tạo nên website và backend + bộ MCP của Garena.
Đồng thời Alpha Intelligence hỗ trợ cho LLM workflow.

Workflow:
- Người dùng điền thư mục chứa codebase và điền hai version cần được so sánh.
- Tool tự động chạy các lệnh git để lấy các mẫu patch code riêng biệt, filter ra các code .fcg (script) và .csv (config/data).
- Tool gửi request lên Alpha Intelligence API với code và yêu cầu phân tích.
- Tool nhận về, format lại content cho người dùng dễ đọc.

Follow/upgrade tiếp theo:
- Chatbot: Designer có thể chat trực tiếp để hỏi AI về tác động của thay đổi config.
- Auto-Test Generator: Từ các config mới, AI tự động sinh ra các Test Case biên để export cho QA.`,
  },
  {
    titleMatch: 'Tự động hóa quy trình kiểm duyệt Publishing',
    tools: ['TinyFaceDetection', 'Alpha Intelligence'],
    desc: `- Cải tiến quy trình kiểm duyệt Publishing bằng cách tích hợp AI vào extension preview ảnh, tự động phát hiện ảnh có chứa khuôn mặt người và đánh dấu các ảnh cần chú ý để người đánh giá đưa ra quyết định Từ chối/Xác nhận nhanh hơn.
- Sử dụng model TinyFaceDetection để sàng lọc trước rồi đưa vô Alpha Intelligence để kiểm tra. Workflow tự động kết nối kết quả AI với UI preview và bộ lọc của extension.

Tool sử dụng: TinyFaceDetection, Alpha Intelligence

Workflow:
- Extension load/preview danh sách ảnh.
- AI tự động phân tích và detect ảnh có mặt người dựa vào điểm tự tin.
- Các ảnh được detect sẽ tự động được tick/đánh dấu và đưa vào filter.
- Reviewer có thể nhanh chóng xem lại nhóm ảnh này và quyết định Reject hoặc Approve.
- AI hiện đóng vai trò hỗ trợ phát hiện và phân loại, quyết định cuối cùng vẫn thuộc về reviewer.

Mở rộng tiếp theo: sexual content, violence, text/brand/logo detection, auto-reject với rule có độ chính xác cao.`,
  },
  {
    titleMatch: 'Thiệu Kỳ',
    tools: [],
    desc: `1. Auto planning timeline project/tracking + chat bot remind.

2. Web test trắc nghiệm để user tìm ra lối chơi phù hợp (mục đích get UGC content)`,
  },
  {
    titleMatch: 'RosterForge',
    tools: ['Claude Code'],
    desc: `Giải quyết việc sản xuất những video thay ảnh, thay tên số lượng nhiều như các file overlay Booyah, Champions của các giải đấu Free Fire esports, hoặc các clip thiệp mời KOL số lượng nhiều của team FCO. Các team khác cũng có thể sử dụng với công việc tương tự.

Tool sử dụng: Claude Code để build.

Ý tưởng update tiếp theo: tối ưu giao diện, bổ sung thêm ngôn ngữ khác như tiếng Thailand để các khu vực khác có thể tiếp cận dễ dàng.`,
  },
  {
    titleMatch: 'Tối ưu hóa workflow cho team PUGC',
    tools: ['Claude', 'Demo System', 'Compass LLM'],
    desc: `Mục đích sử dụng
- Hỗ trợ team tổng hợp thông tin khi cần, không cần phải manually input từng case và phải nhớ xem trước đây mình muốn feedback cái gì, lưu ở đâu

Tool sử dụng
- Claude để build code, Demo System để build database, Compass LLM để tạo lớp phân tích/lọc thông tin bằng AI

Demo sản phẩm
- User report/feedback cho bot về một case nào đó (bug, feature request...)
- Bot ghi nhận thông tin, phân tích, chia thông tin vào đúng cột và ghi data
- Bot phản hồi về việc ghi nhận thông tin thành công

Ý tưởng follow/upgrade tiếp theo:
- Bot sẽ tự động đọc trong data về case được team input đã có chưa, nếu có rồi thì kiểm tra xem có cần bổ sung thông tin gì không để update vào case hiện có
- Bot có thể lấy thông tin này và tổng hợp gửi lại cho team khi team có nhu cầu`,
  },
];
