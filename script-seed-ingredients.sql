CREATE TABLE IF NOT EXISTS public.ingredients_import (
    name varchar(100),
    default_unit varchar(20),
    ingredient_category varchar(100)
);

DELETE FROM ingredients;

-- kiem tra co lien ket voi mon an nao khong
SELECT
    di.dish_id,
    d.name AS dish_name,
    di.ingredient_id,
    i.name AS ingredient_name,
    di.quantity_per_person,
    di.unit,
    di.ingredient_role
FROM public.dish_ingredients di
JOIN public.dishes d ON d.id = di.dish_id
JOIN public.ingredients i ON i.id = di.ingredient_id
WHERE di.ingredient_id = 1;

-- kiem tra du lieu import
SELECT *
FROM public.ingredients_import
ORDER BY ingredient_category, name;

-- kiem tra khop du lieu danh muc khong
SELECT DISTINCT i.ingredient_category
FROM public.ingredients_import i
LEFT JOIN public.ingredient_categories c
    ON TRIM(i.ingredient_category) = c.name
WHERE c.id IS NULL;

-- do du lieu vao bang chinh

INSERT INTO public.ingredients (
    name,
    default_unit,
    ingredient_category_id
)
SELECT DISTINCT ON (TRIM(i.name))
    TRIM(i.name),
    TRIM(i.default_unit),
    c.id
FROM public.ingredients_import i
JOIN public.ingredient_categories c
    ON TRIM(i.ingredient_category) = c.name
WHERE TRIM(COALESCE(i.name, '')) <> ''
  AND TRIM(COALESCE(i.default_unit, '')) <> ''
ORDER BY TRIM(i.name), c.id
ON CONFLICT (name) DO NOTHING;

-- check lai bang chinh
SELECT
    i.id,
    i.name,
    i.default_unit,
    c.name AS ingredient_category,
    i.is_active
FROM public.ingredients i
LEFT JOIN public.ingredient_categories c
    ON c.id = i.ingredient_category_id
ORDER BY c.id, i.name;

--

SELECT
    c.name AS ingredient_category,
    COUNT(i.id) AS total_ingredients
FROM public.ingredient_categories c
LEFT JOIN public.ingredients i
    ON i.ingredient_category_id = c.id
GROUP BY c.id, c.name
ORDER BY c.id;


