# List API

Base URL: `http://localhost:3000`

## 1. API quản lý món ăn (Dishes)

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/api/dishes` | Lấy danh sách món ăn có phân trang, tìm kiếm và lọc danh mục. |
| GET | `/api/dishes/:id` | Lấy thông tin chi tiết món ăn theo ID. |
| POST | `/api/dishes` | Thêm món ăn mới. |
| PUT | `/api/dishes/:id` | Cập nhật thông tin món ăn. |
| DELETE | `/api/dishes/:id` | Xóa món ăn khỏi danh mục hoạt động. |
| POST | `/api/random` | Random một món ăn hoặc một thực đơn theo chế độ. |
| GET | `/api/by-ingredients` | Tìm món ăn dựa trên các nguyên liệu được chọn. |
| GET | `/api/dishes/:id/ingredients` | Lấy danh sách nguyên liệu của món ăn. |
| PUT | `/api/dishes/:id/ingredients` | Cập nhật danh sách nguyên liệu của món ăn. |

### Chi tiết các API món ăn

GET `/api/dishes`

Các query parameters:

| Tham số | Bắt buộc | Mặc định | Ý nghĩa |
| --- | --- | --- | --- |
| `page` | Không | `1` | Trang cần lấy. |
| `limit` | Không | `10` | Số món ăn mỗi trang, tối đa 100. |
| `search` | Không | Chuỗi rỗng | Từ khóa tìm kiếm món ăn. |
| `categoryId` | Không | Chuỗi rỗng | Lọc theo ID danh mục. |

Ví dụ:

http

`GET /api/dishes?page=1&limit=10&search=canh&categoryId=2`

Response thành công có cấu trúc:

JSON

```
{
  "data": [],
  "total": 0,
  "pagination": {}
}
```

POST `/api/dishes`

Body yêu cầu:

JSON

```
{
  "name": "Gà kho gừng",
  "category_id": 1,
  "meal_role": "main"
}
```

Các giá trị hợp lệ của `meal_role`:

- `main`: Món chính.
- `vegetable`: Món rau.
- `soup`: Món canh.
- `one_dish`: Món ăn một món.
- `side`: Món ăn kèm.

POST `/api/random`

Body mẫu cho chế độ random món ăn:

JSON

```
{
  "mode": "single",
  "category_id": 1
}
```

Body mẫu cho chế độ random thực đơn:

JSON

```
{
  "mode": "meal",
  "meal_type": "rice"
}
```

| Tham số | Giá trị hợp lệ | Ý nghĩa |
| --- | --- | --- |
| `mode` | `single`, `meal` | Random một món hoặc một thực đơn. |
| `category_id` | ID danh mục | Giới hạn món theo danh mục, chỉ dùng với `single`. |
| `dish_ids` | Mảng ID món ăn | Giới hạn tập món được random, chỉ dùng với `single`. |
| `meal_type` | `rice`, `one_dish`, `auto` | Kiểu thực đơn, chỉ dùng với `meal`. |

`category_id` và `dish_ids` không được truyền đồng thời. Chế độ `meal` không nhận hai tham số này.

GET `/api/by-ingredients`

| Tham số | Bắt buộc | Ý nghĩa |
| --- | --- | --- |
| `ids` | Có | Danh sách ID nguyên liệu, phân tách bằng dấu phẩy. |

Ví dụ:

http

`GET /api/by-ingredients?ids=1,2,4`

Response:

JSON

```
{
  "data": [],
  "total": 0
}
```

API trả về danh sách món ăn phù hợp với nguyên liệu được chọn. Cách xếp hạng và xử lý nguyên liệu tùy chọn được quyết định trong service.

## 2. API quản lý nguyên liệu (Ingredients)

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/api/ingredients` | Lấy danh sách nguyên liệu có phân trang, tìm kiếm, lọc danh mục và thống kê số lượng. |
| GET | `/api/ingredients/:id` | Lấy thông tin chi tiết nguyên liệu theo ID. |
| POST | `/api/ingredients` | Thêm nguyên liệu mới. |
| PUT | `/api/ingredients/:id` | Cập nhật thông tin nguyên liệu. |
| PATCH | `/api/ingredients/:id/status` | Thay đổi trạng thái hoạt động của nguyên liệu. |
| GET | `/api/allergens` | Lấy danh sách nguyên liệu gây dị ứng. |
| GET | `/api/units` | Lấy danh sách đơn vị đo lường. |

### Chi tiết các API nguyên liệu

GET `/api/ingredients`

| Tham số | Bắt buộc | Mặc định | Ý nghĩa |
| --- | --- | --- | --- |
| `page` | Không | `1` | Trang cần lấy. |
| `limit` | Không | `10` | Số nguyên liệu mỗi trang, tối đa 100. |
| `search` | Không | Không lọc | Tìm kiếm theo từ khóa. |
| `categoryId` | Không | Không lọc | Lọc theo danh mục; giá trị `all` được chấp nhận để lấy tất cả. |

Ví dụ:

http

`GET /api/ingredients?page=1&limit=10&search=thịt&categoryId=2`

Response bao gồm danh sách, thông tin phân trang và thống kê:

JSON

```
{
  "data": [],
  "pagination": {},
  "stats": {
    "totalIngredients": 0,
    "activeIngredients": 0
  }
}
```

POST `/api/ingredients`

Body mẫu:

JSON

```
{
  "name": "Thịt bò",
  "ingredient_category_id": 1,
  "default_unit_id": 1,
  "is_allergen": false
}
```

| Trường | Bắt buộc | Ý nghĩa |
| --- | --- | --- |
| `name` | Có | Tên nguyên liệu, tối đa 100 ký tự. |
| `ingredient_category_id` | Có | ID danh mục nguyên liệu. |
| `default_unit_id` | Có | ID đơn vị đo lường mặc định. |
| `is_allergen` | Không | Cờ xác định nguyên liệu có phải chất gây dị ứng hay không. |

`ingredient_category_id` và `default_unit_id` phải là ID số nguyên dương hợp lệ.

PATCH `/api/ingredients/:id/status`

Body:

JSON

```
{
  "is_active": false
}
```

Dùng để bật hoặc tắt trạng thái hoạt động của nguyên liệu mà không cần cập nhật toàn bộ thông tin.

GET `/api/allergens`

| Tham số | Bắt buộc | Ý nghĩa |
| --- | --- | --- |
| `search` | Không | Lọc danh sách chất gây dị ứng theo từ khóa. |

Ví dụ:

http

`GET /api/allergens?search=đậu phộng`

## 3. API danh mục và nhãn nguyên liệu

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/api/categories` | Lấy danh mục món ăn. |
| GET | `/api/ingredient-categories` | Lấy danh mục nguyên liệu. |
| POST | `/api/ingredient-labels/resolve` | Xử lý hoặc ánh xạ nhãn nguyên liệu từ hệ thống nhận diện AI. |

## 4. API thực đơn đã lưu (Menus)

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/api/menus` | Lấy danh sách thực đơn đã lưu. |
| GET | `/api/menus/:id` | Lấy chi tiết thực đơn theo ID. |
| POST | `/api/menus` | Tạo thực đơn thủ công. |
| PUT | `/api/menus/:id` | Cập nhật thực đơn đã lưu. |
| DELETE | `/api/menus/:id` | Xóa thực đơn đã lưu. |

## 5. API lịch sử nấu ăn (Cooking Sessions)

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| POST | `/api/cooking-sessions` | Ghi nhận một lần nấu ăn. |
| GET | `/api/cooking-sessions/calendar` | Lấy dữ liệu lịch sử để hiển thị trên lịch. |
| GET | `/api/cooking-sessions/by-date` | Lấy lịch sử nấu ăn theo ngày. |
| GET | `/api/cooking-sessions/cooked-dishes` | Lấy ID các món đã nấu. |
| PUT | `/api/cooking-sessions/:id` | Cập nhật bản ghi lịch sử nấu ăn. |
| DELETE | `/api/cooking-sessions/:id` | Xóa bản ghi lịch sử nấu ăn. |

## 6. API thống kê (Statistics)

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/api/statistics/overview` | Lấy dữ liệu tổng quan thống kê. |
| GET | `/api/statistics/timeline` | Lấy dữ liệu thống kê theo thời gian. |
| GET | `/api/statistics/top-dishes` | Lấy danh sách món ăn nổi bật theo tiêu chí thống kê. |
| GET | `/api/statistics/categories` | Lấy dữ liệu thống kê theo danh mục. |

## 7. API kiểm tra hệ thống

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/api/db-check` | Kiểm tra kết nối database. |
| GET | `/health` | Kiểm tra tình trạng API. |

## 8. API nhận diện nguyên liệu

Base URL: `http://127.0.0.1:8000`

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| POST | `/api/recognize` | Nhận diện nguyên liệu từ ảnh. |

### Lưu ý về mã HTTP

| Mã HTTP | Ý nghĩa |
| --- | --- |
| `200 OK` | Truy vấn hoặc cập nhật thành công. |
| `201 Created` | Tạo món ăn hoặc nguyên liệu thành công. |
| `400 Bad Request` | Tham số hoặc dữ liệu đầu vào không hợp lệ. |
| `404 Not Found` | Không tìm thấy món ăn hoặc nguyên liệu. |
| `409 Conflict` | Tên món ăn hoặc nguyên liệu bị trùng. |
| `500 Internal Server Error` | Lỗi xử lý phía server. |