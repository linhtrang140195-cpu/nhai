-- Delete all previously imported NHAI DAY 2 rows
DELETE FROM event_feedback WHERE id LIKE 'fb-day2-import-%';

-- Import only 21 confirmed NHAI DAY #2 rows
INSERT IGNORE INTO event_feedback (id, season_id, city, participation_type, output_status, no_output_reason, mentor_rating, mentor_comment, continue_dev, recommend, overall_rating, suggestions, submitted_at) VALUES
('fb-day2-import-1','nhai-day-02','HN','Solo','Có, demo được',NULL,5,'Anh Sơn và Anh Kiên giải thích cho minhg giới hạn của tình huống, sản phẩm hiện tại đang là tốt nhất có thể làm','Có, chắc chắn','Có',4,'Nên nerf lại Early Bird, bị abused','2026-07-31 17:25:51'),
('fb-day2-import-2','nhai-day-02','HN','Theo team','Có, demo được',NULL,4,NULL,'Có, chắc chắn','Có',4,NULL,'2026-07-31 17:33:21'),
('fb-day2-import-3','nhai-day-02','HN','Solo','Có, demo được',NULL,5,NULL,'Có, chắc chắn','Chưa chắc',5,NULL,'2026-07-31 17:40:11'),
('fb-day2-import-4','nhai-day-02','HN','Solo','Có, demo được',NULL,5,NULL,'Có, chắc chắn','Có',5,NULL,'2026-07-31 18:32:54'),
('fb-day2-import-5','nhai-day-02','HCM','Theo team','Có, demo được',NULL,5,NULL,'Có, chắc chắn','Có',5,'BTC và mentor 100 đỉm','2026-08-07 17:45:14'),
('fb-day2-import-6','nhai-day-02','HCM','Theo team','Có, demo được',NULL,5,NULL,'Có, chắc chắn','Có',5,NULL,'2026-08-07 17:45:22'),
('fb-day2-import-7','nhai-day-02','HCM','Theo team','Có, demo được',NULL,3,NULL,'Có, chắc chắn','Có',4,NULL,'2026-08-07 17:45:34'),
('fb-day2-import-8','nhai-day-02','HCM','Solo','Có, demo được',NULL,5,NULL,'Có thể','Chưa chắc',5,NULL,'2026-08-07 17:45:56'),
('fb-day2-import-9','nhai-day-02','HCM','Theo team','Có, demo được',NULL,5,NULL,'Có, chắc chắn','Có',5,NULL,'2026-08-07 17:45:56'),
('fb-day2-import-10','nhai-day-02','HCM','Theo team','Có bản nháp nhưng chưa demo được','Thiếu thời gian, Scope quá lớn',5,NULL,'Có, chắc chắn','Có',5,NULL,'2026-08-07 17:46:15'),
('fb-day2-import-11','nhai-day-02','HCM','Theo team','Có, demo được',NULL,5,NULL,'Có, chắc chắn','Có',5,NULL,'2026-08-07 17:46:19'),
('fb-day2-import-12','nhai-day-02','HCM','Theo team','Có, demo được',NULL,4,NULL,'Có thể','Có',4,NULL,'2026-08-07 17:46:28'),
('fb-day2-import-13','nhai-day-02','HCM','Theo team','Có, demo được',NULL,4,NULL,'Có, chắc chắn','Có',4,NULL,'2026-08-07 17:46:29'),
('fb-day2-import-14','nhai-day-02','HCM','Theo team','Có, demo được',NULL,5,'Thực tế ngay vào công việc','Có, chắc chắn','Có',5,NULL,'2026-08-07 17:46:30'),
('fb-day2-import-15','nhai-day-02','HCM','Theo team','Có, demo được','Thiếu thời gian',4,'Các anh chị mentor rất cố gắng hỗ trợ nhưng vẫn còn khả năng bị phụ thuộc vào thời gian chạy khi LLM hoạt động quá lâu ạ.','Có, chắc chắn','Có',4,NULL,'2026-08-07 17:47:14'),
('fb-day2-import-16','nhai-day-02','HN','Solo','Có, demo được','Thiếu thời gian',5,NULL,'Có, chắc chắn','Có',5,'Nên kéo dài thời gian để mọi người có thể trao đổi nhiều hơn. Có thể giúp nhiều team ra được những kết quả tốt hơn, những ý tưởng hay hơn','2026-08-08 20:41:05'),
('fb-day2-import-17','nhai-day-02','HCM','Theo team','Có, demo được',NULL,5,NULL,'Có, chắc chắn','Có',5,NULL,'2026-06-26 17:00:00'),
('fb-day2-import-18','nhai-day-02','HN','Theo team','Có bản nháp nhưng chưa demo được','Thiếu thời gian',5,NULL,'Có thể','Có',5,NULL,'2026-06-26 17:00:00'),
('fb-day2-import-19','nhai-day-02','HCM','Theo team','Có, demo được','Thiếu thời gian',5,NULL,'Có, chắc chắn','Có',4,NULL,'2026-06-26 17:00:00'),
('fb-day2-import-20','nhai-day-02','HCM','Theo team','Có, demo được',NULL,4,'Format event giúp các team block time riêng ra để giải quyết một vấn đề chưa urgent ngay nhưng có thể optimize thời gian nếu thật sự develop tool tương ứng','Có thể','Có',4,'Có thể bundle các team có use case rõ ràng với 1-2 bạn chỉ muốn tham dự để nâng cao sử dụng AI thôi để mọi người đều có thể tham dự. Ngoài ra, có những bạn không tham gia vào quá trình vận hành nhiều nên không có nhiều thứ optimize nên mọi người có thể thêm nhiều use case về creation hoặc tìm những phòng ban có nhiều vấn đề về Operations rùi ghép cặp mọi người lại để mọi người giải quyết vấn đề cùng nhau.','2026-08-11 16:09:06'),
('fb-day2-import-21','nhai-day-02','HCM','Theo team','Có, demo được','Thiếu thời gian',5,NULL,'Có thể','Có',5,NULL,'2026-08-12 20:36:02');
