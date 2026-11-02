# Ôn tập dấu hiệu ngoại khoa Y3

Đề trắc nghiệm 4 lựa chọn về dấu hiệu và triệu chứng lâm sàng ngoại khoa, dành cho sinh viên Y3 thực tập Ngoại.

- Mỗi nhóm đề mở bằng một mật khẩu riêng do giảng viên cung cấp.
- Mỗi đề có 10 câu về định nghĩa, biểu hiện, cách khám và nhận diện trên ảnh. Thứ tự câu và đáp án được xáo lại mỗi lần làm.
- Sau mỗi câu, app hiện đáp án, giải thích và nguồn tham khảo.

Câu hỏi, đáp án và ảnh lâm sàng nằm trong `data/*.enc.json`, mã hóa AES-256-GCM với khóa dẫn xuất từ mật khẩu bằng PBKDF2-SHA256 (600.000 vòng). App chạy hoàn toàn trong trình duyệt, không gửi dữ liệu về máy chủ; điểm cao nhất chỉ lưu trên thiết bị của người làm.

Ảnh lấy từ Wikimedia Commons, ghi tác giả và giấy phép dưới từng ảnh; một số ảnh đã thu nhỏ hoặc cắt cúp. Mã nguồn app (`index.html`, `app.js`, `app.css`) được công khai để xem.
