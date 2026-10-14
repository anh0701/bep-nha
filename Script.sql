SELECT
    current_database() AS database_name,
    current_user AS database_user,
    version() AS postgres_version;


-- Danh mục món ăn
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Danh sách món ăn
CREATE TABLE IF NOT EXISTS dishes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    category_id BIGINT NOT NULL
        REFERENCES categories(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tạo danh mục ban đầu
INSERT INTO categories (name)
VALUES
    ('Canh'),
    ('Món mặn'),
    ('Rau'),
    ('Món chay'),
    ('Bún/phở/miến/mì'),
    ('Cháo')
ON CONFLICT (name) DO NOTHING;

--
CREATE TABLE IF NOT EXISTS cooking_records (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dish_id BIGINT NOT NULL REFERENCES dishes(id),
    cooked_on DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cooking_records_cooked_on
    ON cooking_records (cooked_on);

CREATE INDEX IF NOT EXISTS idx_cooking_records_dish_id_cooked_on
    ON cooking_records (dish_id, cooked_on);

/*
 * Update vai tro mon an trong bua an
 * main: món chính 
 * vegetable: món rau
 * soup: món canh
 * one_dish: món ăn riêng như phở, bún, cháo
 * side: món ăn kèm, có thể có hoặc không
 */


ALTER TABLE dishes
ADD COLUMN IF NOT EXISTS meal_role VARCHAR(20)
CHECK (
    meal_role IN (
        'main',
        'vegetable',
        'soup',
        'one_dish',
        'side'
    )
);


UPDATE dishes d
SET meal_role = CASE
    WHEN c.name = 'Món mặn' THEN 'main'
    WHEN c.name = 'Rau' THEN 'vegetable'
    WHEN c.name = 'Canh' THEN 'soup'
    WHEN c.name = 'Bún/phở/miến/mì' THEN 'one_dish'
    WHEN c.name = 'Cháo' THEN 'one_dish'
END
FROM categories c
WHERE d.category_id = c.id
  AND c.name IN (
      'Món mặn',
      'Rau',
      'Canh',
      'Bún/phở/miến/mì',
      'Cháo'
  )
  AND d.meal_role IS NULL;


SELECT
    c.name AS category,
    d.meal_role,
    COUNT(*) AS dish_count
FROM dishes d
JOIN categories c ON c.id = d.category_id
WHERE d.is_active = TRUE
GROUP BY c.name, d.meal_role
ORDER BY c.name, d.meal_role;


SELECT
    d.id,
    d.name,
    c.name AS category,
    d.meal_role
FROM dishes d
JOIN categories c ON c.id = d.category_id
WHERE d.is_active = TRUE
  AND d.meal_role IS NULL
ORDER BY c.name, d.name;


UPDATE dishes
SET meal_role = CASE id
    WHEN 92 THEN 'one_dish'   -- Bánh xèo chay
    WHEN 89 THEN 'side'       -- Chả giò chay
    WHEN 107 THEN 'one_dish'  -- Cơm chiên chay
    WHEN 80 THEN 'main'       -- Củ cải kho nấm
    WHEN 102 THEN 'vegetable' -- Gỏi bắp chuối chay
    WHEN 103 THEN 'one_dish'  -- Gỏi cuốn chay
    WHEN 101 THEN 'vegetable' -- Gỏi ngó sen chay
    WHEN 86 THEN 'main'       -- Mì căn xào sả ớt
    WHEN 76 THEN 'main'       -- Mít non kho nước dừa
    WHEN 77 THEN 'main'       -- Măng kho nấm
    WHEN 90 THEN 'side'       -- Nấm kim châm chiên giòn
    WHEN 74 THEN 'main'       -- Nấm rơm kho tiêu
    WHEN 87 THEN 'main'       -- Nấm sốt tiêu xanh
    WHEN 75 THEN 'main'       -- Nấm đùi gà kho gừng
    WHEN 78 THEN 'main'       -- Rau củ kho chay
    WHEN 91 THEN 'main'       -- Đậu hũ chiên giòn sốt chua ngọt
    WHEN 79 THEN 'main'       -- Đậu hũ rim nước tương
    WHEN 88 THEN 'main'       -- Đậu hũ sốt sa tế chay
END
WHERE id IN (
    92, 89, 107, 80, 102, 103, 101, 86, 76,
    77, 90, 74, 87, 75, 78, 91, 79, 88
)
AND meal_role IS NULL;


SELECT
    meal_role,
    COUNT(*) AS dish_count
FROM dishes
WHERE is_active = TRUE
GROUP BY meal_role
ORDER BY meal_role;


SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cooking_records'
ORDER BY ordinal_position;

-- 

-- Bảng lưu các thực đơn đã random thành công
CREATE TABLE IF NOT EXISTS menus (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dish_signature TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng liên kết thực đơn với các món ăn
CREATE TABLE IF NOT EXISTS menu_dishes (
    menu_id BIGINT NOT NULL
        REFERENCES menus(id) ON DELETE CASCADE,
    dish_id BIGINT NOT NULL
        REFERENCES dishes(id),
    position INTEGER NOT NULL CHECK (position > 0),

    PRIMARY KEY (menu_id, dish_id),
    UNIQUE (menu_id, position)
);

-- Hỗ trợ truy vấn thực đơn theo món ăn
CREATE INDEX IF NOT EXISTS idx_menu_dishes_dish_id
    ON menu_dishes (dish_id);

SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('menus', 'menu_dishes')
ORDER BY table_name, ordinal_position;


SELECT
    COUNT(*) AS total_records,
    COUNT(DISTINCT cooked_on) AS cooking_days,
    MIN(cooked_on) AS first_cooking_date,
    MAX(cooked_on) AS last_cooking_date
FROM cooking_records;

-- luu thoi gian nau an

CREATE TABLE IF NOT EXISTS cooking_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cooked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cooking_sessions_cooked_at
    ON cooking_sessions (cooked_at);


CREATE TABLE IF NOT EXISTS cooking_session_dishes (
    session_id BIGINT NOT NULL
        REFERENCES cooking_sessions(id) ON DELETE CASCADE,
    dish_id BIGINT NOT NULL
        REFERENCES dishes(id),
    position INTEGER NOT NULL CHECK (position > 0),

    PRIMARY KEY (session_id, dish_id),
    UNIQUE (session_id, position)
);

CREATE INDEX IF NOT EXISTS idx_cooking_session_dishes_dish_id
    ON cooking_session_dishes (dish_id);

select d.* from dishes d where d.is_active = false ;


-- 1. Thêm thông tin nguồn và thời gian cập nhật.
ALTER TABLE menus
    ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'random',
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Kiểm soát các giá trị source hợp lệ.
ALTER TABLE menus
    ADD CONSTRAINT menus_source_check
    CHECK (source IN ('random', 'manual'));

-- 3. Bỏ ràng buộc UNIQUE cũ trên dish_signature.
-- Tên mặc định PostgreSQL thường tạo là menus_dish_signature_key.
ALTER TABLE menus
    DROP CONSTRAINT menus_dish_signature_key;

-- 4. Chỉ yêu cầu chữ ký duy nhất đối với thực đơn random.
CREATE UNIQUE INDEX menus_random_signature_unique
    ON menus (dish_signature)
    WHERE source = 'random';


-- 1. Danh mục nguyên liệu
CREATE TABLE public.ingredients (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(100) NOT NULL,
    ingredient_group varchar(50),
    default_unit varchar(20) NOT NULL DEFAULT 'g',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ingredients_name_unique UNIQUE (name),
    CONSTRAINT ingredients_name_not_blank
        CHECK (length(trim(name)) > 0),
    CONSTRAINT ingredients_default_unit_not_blank
        CHECK (length(trim(default_unit)) > 0)
);

-- 2. Nguyên liệu và định lượng theo từng món
CREATE TABLE public.dish_ingredients (
    dish_id bigint NOT NULL
        REFERENCES public.dishes(id) ON DELETE CASCADE,

    ingredient_id bigint NOT NULL
        REFERENCES public.ingredients(id) ON DELETE RESTRICT,

    quantity_per_person numeric(10, 3) NOT NULL,
    unit varchar(20) NOT NULL,

    ingredient_role varchar(10) NOT NULL DEFAULT 'minor',
    is_optional boolean NOT NULL DEFAULT false,
    preparation_note text,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (dish_id, ingredient_id),

    CONSTRAINT dish_ingredients_quantity_positive
        CHECK (quantity_per_person > 0),

    CONSTRAINT dish_ingredients_unit_not_blank
        CHECK (length(trim(unit)) > 0),

    CONSTRAINT dish_ingredients_role_check
        CHECK (ingredient_role IN ('main', 'minor'))
);

CREATE INDEX idx_dish_ingredients_ingredient_id
    ON public.dish_ingredients(ingredient_id);

-- 3. Nguyên liệu người dùng cần tránh
CREATE TABLE public.allergen_ingredients (
    ingredient_id bigint PRIMARY KEY
        REFERENCES public.ingredients(id) ON DELETE CASCADE,

    created_at timestamptz NOT NULL DEFAULT now()
);


-----------------------------------------------------------------------------------------

/*
 * chạy dữ liệu cho món ăn
 * 
 */

-- banrg nafy suwr dungj cho mucj ddicsh imporrt duw lieeuj thoio
CREATE TABLE IF NOT EXISTS dishes_import (
    stt INTEGER,
    name VARCHAR(200),
    category VARCHAR(100)
);

-- Kiểm tra loại món nào chưa tồn tại
SELECT DISTINCT i.category
FROM dishes_import i
LEFT JOIN categories c
    ON c.name = TRIM(i.category)
WHERE c.id IS NULL;

INSERT INTO dishes (name, category_id)
SELECT
    TRIM(i.name),
    c.id
FROM dishes_import i
JOIN categories c
    ON c.name = TRIM(i.category)
WHERE TRIM(COALESCE(i.name, '')) <> ''
ON CONFLICT (name) DO NOTHING;

--

SELECT
    c.name AS category,
    COUNT(d.id) AS dish_count
FROM categories c
LEFT JOIN dishes d
    ON d.category_id = c.id
GROUP BY c.id, c.name
ORDER BY c.id;

--

SELECT
    COUNT(*) AS total_csv_rows,
    COUNT(DISTINCT TRIM(name)) AS unique_dish_names,
    COUNT(*) FILTER (
        WHERE name IS NULL OR TRIM(name) = ''
    ) AS empty_names
FROM dishes_import;

SELECT DISTINCT TRIM(i.category) AS unmatched_category
FROM dishes_import i
LEFT JOIN categories c
    ON c.name = TRIM(i.category)
WHERE c.id IS NULL;



