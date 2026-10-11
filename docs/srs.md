# Bep Nha

## Tech stack

- Frontend: React + TypeScript + Vite
- CSS: Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL

## Luong nghiep vu

```mermaid
flowchart TD
    A["Random món ăn"] --> B{"Người dùng chọn gì?"}
    B -->|"Thêm vào thực đơn"| C["Trạng thái: Dự kiến"]
    B -->|"Không chọn"| D["Ghi nhận kết quả random nếu cần"]
    C --> E{"Sau bữa ăn"}
    E -->|"Đã nấu"| F["Tạo bản ghi lịch sử nấu"]
    E -->|"Bỏ qua"| G["Đánh dấu bỏ qua"]
    E -->|"Chưa nấu"| C
    F --> H["Cập nhật thống kê"]
    G --> I["Không tính là đã nấu"]
```

## Nguyên tắc chọn món

- Hạn chế lặp món: giảm khả năng chọn những món đã nấu trong 3 ngày gần nhất.
- Cân bằng lịch sử: ưu tiên hợp lý các danh mục ít xuất hiện trong lịch sử nấu gần đây.
- Không tạo bữa thiếu thành phần: nếu chọn bữa cơm mà dữ liệu chưa đủ món chính, rau hoặc canh, hệ thống phải thông báo thiếu lựa chọn thay vì tự bịa món.
- Chỉ ghi lịch sử khi thực sự nấu: kết quả Random chưa phải bản ghi nấu ăn. Người dùng cần xác nhận đã nấu thì mới thêm vào thống kê.

## Danh sach API

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | /api/health | Kiểm tra server |
| GET | /api/dishes | Lấy danh sách món ăn |
| POST | /api/dishes | Thêm món ăn |
| PUT | /api/dishes/:id | Sửa món ăn |
| DELETE | /api/dishes/:id | Ngừng hiển thị món ăn |
| GET | /api/categories | Lấy danh mục món ăn |
