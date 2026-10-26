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

BEGIN;

CREATE TABLE public.ingredient_categories (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(100) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ingredient_categories_name_unique UNIQUE (name),
    CONSTRAINT ingredient_categories_name_not_blank
        CHECK (length(trim(name)) > 0)
);

ALTER TABLE public.ingredients
ADD COLUMN ingredient_category_id bigint;

COMMIT;

SELECT
    ingredient_group,
    COUNT(*) AS ingredient_count
FROM public.ingredients
GROUP BY ingredient_group
ORDER BY ingredient_group;

INSERT INTO public.ingredient_categories (name)
VALUES
    ('Thịt'),
    ('Hải sản'),
    ('Rau củ'),
    ('Nấm'),
    ('Trứng'),
    ('Đậu và chế phẩm từ đậu'),
    ('Gia vị'),
    ('Dầu và chất béo'),
    ('Đồ khô'),
    ('Sữa và chế phẩm từ sữa'),
    ('Khác')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE ingredients DROP COLUMN ingredient_group;

SELECT
        di.ingredient_id::text AS ingredient_id,
        i.name AS ingredient_name,
        i.ingredient_category_id::text AS ingredient_category_id,
        ic.name AS ingredient_category_name,
        di.quantity_per_person,
        di.unit,
        di.ingredient_role,
        di.is_optional,
        di.preparation_note,
        EXISTS (
          SELECT 1
          FROM allergen_ingredients ai
          WHERE ai.ingredient_id = i.id
        ) AS is_allergen
      FROM dish_ingredients di
      INNER JOIN ingredients i
        ON i.id = di.ingredient_id
      INNER JOIN ingredient_categories ic
        ON ic.id = i.ingredient_category_id
      WHERE di.dish_id = 119
      ORDER BY
        CASE di.ingredient_role
          WHEN 'main' THEN 0
          ELSE 1
        END,
        i.name ASC


SELECT
    d.meal_role,
    COUNT(*) AS total_active,
    COUNT(*) FILTER (
        WHERE NOT EXISTS (
            SELECT 1
            FROM dish_ingredients di
            JOIN allergen_ingredients ai
                ON ai.ingredient_id = di.ingredient_id
            WHERE di.dish_id = d.id
              AND di.ingredient_role = 'main'
        )
    ) AS eligible_after_allergen_filter
FROM dishes d
WHERE d.is_active = TRUE
  AND d.meal_role IS NOT NULL
GROUP BY d.meal_role
ORDER BY d.meal_role;

SELECT dish_signature, COUNT(*)
FROM menus
GROUP BY dish_signature
HAVING COUNT(*) > 1;

ALTER TABLE menus
ADD CONSTRAINT menus_dish_signature_unique
UNIQUE (dish_signature);

--

SELECT
    'ingredients.default_unit' AS source,
    TRIM(default_unit) AS unit_value,
    COUNT(*) AS total
FROM public.ingredients
GROUP BY TRIM(default_unit)

UNION ALL

SELECT
    'dish_ingredients.unit' AS source,
    TRIM(unit) AS unit_value,
    COUNT(*) AS total
FROM public.dish_ingredients
GROUP BY TRIM(unit)

ORDER BY source, unit_value;

--

SELECT
    unit,
    COUNT(*) AS total
FROM public.dish_ingredients
GROUP BY unit
ORDER BY unit;
--
SELECT COUNT(*) AS total_dish_ingredients
FROM public.dish_ingredients;

----------------------------------------------------------------------------------------------



-- 1. Tạo danh mục đơn vị dùng chung
CREATE TABLE IF NOT EXISTS public.units (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(50) NOT NULL,
    symbol varchar(20) NOT NULL,
    unit_type varchar(20) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),

    CONSTRAINT units_name_unique UNIQUE (name),
    CONSTRAINT units_symbol_unique UNIQUE (symbol),
    CONSTRAINT units_name_not_blank
        CHECK (length(TRIM(name)) > 0),
    CONSTRAINT units_symbol_not_blank
        CHECK (length(TRIM(symbol)) > 0),
    CONSTRAINT units_type_check
        CHECK (unit_type IN ('mass', 'volume', 'count', 'package'))
);

-- 2. Khởi tạo các đơn vị đang dùng và một số đơn vị thông dụng
INSERT INTO public.units (name, symbol, unit_type)
VALUES
    ('Gam', 'g', 'mass'),
    ('Kilôgam', 'kg', 'mass'),
    ('Mililít', 'ml', 'volume'),
    ('Lít', 'l', 'volume'),
    ('Quả', 'quả', 'count'),
    ('Ổ', 'ổ', 'count'),
    ('Gói', 'gói', 'package'),
    ('Củ', 'củ', 'count'),
    ('Bó', 'bó', 'count'),
    ('Nhánh', 'nhánh', 'count'),
    ('Lát', 'lát', 'count'),
    ('Muỗng cà phê', 'muỗng cà phê', 'volume'),
    ('Muỗng canh', 'muỗng canh', 'volume'),
    ('Chén', 'chén', 'volume'),
    ('Thìa', 'thìa', 'count'),
    ('Con', 'con', 'count'),
    ('Miếng', 'miếng', 'count'),
    ('Tép', 'tép', 'count'),
    ('Trái', 'trái', 'count'),
    ('Cây', 'cây', 'count')
ON CONFLICT (symbol) DO NOTHING;

-- 3. Thêm cột ID mới, chưa bắt buộc NOT NULL
-- để backend hiện tại tiếp tục hoạt động trong giai đoạn chuyển tiếp.
ALTER TABLE public.ingredients
    ADD COLUMN IF NOT EXISTS default_unit_id bigint;

ALTER TABLE public.dish_ingredients
    ADD COLUMN IF NOT EXISTS unit_id bigint;

-- 4. Ánh xạ đơn vị hiện tại của 203 nguyên liệu sang units.id
UPDATE public.ingredients AS i
SET default_unit_id = u.id
FROM public.units AS u
WHERE TRIM(i.default_unit) = u.symbol
  AND i.default_unit_id IS NULL;

-- 5. Kiểm tra dữ liệu đã ánh xạ đầy đủ chưa.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.ingredients
        WHERE default_unit_id IS NULL
    ) THEN
        RAISE EXCEPTION
            'Có nguyên liệu chưa ánh xạ được đơn vị. Hãy kiểm tra trước khi tiếp tục.';
    END IF;
END $$;

-- 6. Tạo khóa ngoại.
-- Chỉ tạo nếu constraint chưa tồn tại.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ingredients_default_unit_id_fkey'
          AND conrelid = 'public.ingredients'::regclass
    ) THEN
        ALTER TABLE public.ingredients
            ADD CONSTRAINT ingredients_default_unit_id_fkey
            FOREIGN KEY (default_unit_id)
            REFERENCES public.units(id)
            ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'dish_ingredients_unit_id_fkey'
          AND conrelid = 'public.dish_ingredients'::regclass
    ) THEN
        ALTER TABLE public.dish_ingredients
            ADD CONSTRAINT dish_ingredients_unit_id_fkey
            FOREIGN KEY (unit_id)
            REFERENCES public.units(id)
            ON DELETE RESTRICT;
    END IF;
END $$;

-- check
SELECT
    i.id,
    i.name AS ingredient_name,
    i.default_unit AS old_unit,
    u.id AS unit_id,
    u.name AS unit_name,
    u.symbol AS unit_symbol,
    u.unit_type
FROM public.ingredients i
LEFT JOIN public.units u
    ON u.id = i.default_unit_id
ORDER BY i.id;

--
SELECT
    COUNT(*) AS total_ingredients,
    COUNT(default_unit_id) AS mapped_ingredients,
    COUNT(*) FILTER (
        WHERE default_unit_id IS NULL
    ) AS unmapped_ingredients
FROM public.ingredients;

--
ALTER TABLE public.dish_ingredients
ALTER COLUMN unit DROP NOT NULL;

--
CREATE TABLE ai_ingredient_labels (
    id BIGSERIAL PRIMARY KEY,

    label VARCHAR(150) NOT NULL,
    ingredient_id BIGINT NOT NULL
        REFERENCES ingredients(id)
        ON DELETE RESTRICT,

    model_name VARCHAR(150) NOT NULL DEFAULT 'bep-nha-ingredients',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_ai_label_model
        UNIQUE (model_name, label)
);

CREATE INDEX idx_ai_ingredient_labels_ingredient_id
    ON ai_ingredient_labels(ingredient_id);

CREATE INDEX idx_ai_ingredient_labels_active
    ON ai_ingredient_labels(model_name, is_active);

--
-- Cho phép label chưa ánh xạ nguyên liệu
ALTER TABLE ai_ingredient_labels
ALTER COLUMN ingredient_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_ingredient_labels_model_label
ON ai_ingredient_labels (model_name, LOWER(label));

INSERT INTO ai_ingredient_labels (model_name, label, ingredient_id)
VALUES
    ('bep-nha-ingredients', 'banana', NULL),
    ('bep-nha-ingredients', 'beef', 173),
    ('bep-nha-ingredients', 'black_pepper', 185),
    ('bep-nha-ingredients', 'bottle_gourd', 34),
    ('bep-nha-ingredients', 'carp', 58),
    ('bep-nha-ingredients', 'carrot', 54),
    ('bep-nha-ingredients', 'chicken', 176),
    ('bep-nha-ingredients', 'chicken_breast', 223),
    ('bep-nha-ingredients', 'chicken_egg', 187),
    ('bep-nha-ingredients', 'chicken_leg', 207),
    ('bep-nha-ingredients', 'chicken_wing', 71),
    ('bep-nha-ingredients', 'cinnamon', NULL),
    ('bep-nha-ingredients', 'cooking_oil', 83),
    ('bep-nha-ingredients', 'drumstick', NULL),
    ('bep-nha-ingredients', 'duck', 182),
    ('bep-nha-ingredients', 'eggplant', 55),
    ('bep-nha-ingredients', 'field_crab', 52),
    ('bep-nha-ingredients', 'fresh_chili', 222),
    ('bep-nha-ingredients', 'garlic', 197),
    ('bep-nha-ingredients', 'ginger', 94),
    ('bep-nha-ingredients', 'green_onion', 95),
    ('bep-nha-ingredients', 'ground_beef', 174),
    ('bep-nha-ingredients', 'ground_pork', 178),
    ('bep-nha-ingredients', 'guava', NULL),
    ('bep-nha-ingredients', 'lemon', 47),
    ('bep-nha-ingredients', 'lemongrass', 165),
    ('bep-nha-ingredients', 'okra', 210),
    ('bep-nha-ingredients', 'onion', 97),
    ('bep-nha-ingredients', 'orange', NULL),
    ('bep-nha-ingredients', 'pork_belly', 172),
    ('bep-nha-ingredients', 'pumpkin', 28),
    ('bep-nha-ingredients', 'red_apple', NULL),
    ('bep-nha-ingredients', 'rice_noodle', 30),
    ('bep-nha-ingredients', 'shallot', 98),
    ('bep-nha-ingredients', 'star_anise', NULL),
    ('bep-nha-ingredients', 'tilapia', 66),
    ('bep-nha-ingredients', 'tofu', 213),
    ('bep-nha-ingredients', 'tomato', 53),
    ('bep-nha-ingredients', 'turmeric', 130),
    ('bep-nha-ingredients', 'white_pepper', 184),
    ('bep-nha-ingredients', 'winter_melon', 27),
    ('bep-nha-ingredients', 'zucchini', NULL),
    ('bep-nha-ingredients', 'bep-nha-ingredients', NULL)
ON CONFLICT (model_name, LOWER(label))
DO UPDATE SET
    ingredient_id = EXCLUDED.ingredient_id,
    is_active = TRUE,
    updated_at = NOW();



















        
