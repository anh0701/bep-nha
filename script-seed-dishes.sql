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
