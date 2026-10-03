CREATE OR REPLACE VIEW v_meals_app AS
SELECT
    m.id AS meal_id,
    m.name AS meal_name,
    m.description,
    COALESCE(tag_data.tags, ARRAY[]::text[]) AS tags,
    COALESCE(ingredient_data.ingredients_list, '') AS ingredients_list,
    COALESCE(ingredient_data.ingredients, '[]'::json) AS ingredients
FROM meals m
LEFT JOIN LATERAL (
    SELECT COALESCE(
        ARRAY_AGG(DISTINCT normalized.tag ORDER BY normalized.tag)
            FILTER (WHERE normalized.tag IS NOT NULL),
        ARRAY[]::text[]
    ) AS tags
    FROM (
        SELECT CASE lower(source.tag)
            WHEN 'ligero' THEN 'Ligero'
            WHEN 'desayuno' THEN 'Desayuno'
            WHEN 'almuerzo' THEN 'Comida/Cena'
            WHEN 'cena' THEN 'Comida/Cena'
            WHEN 'snack' THEN 'Snack'
            WHEN 'comida/cena' THEN 'Comida/Cena'
            WHEN 'alba' THEN 'Alba'
        END AS tag
        FROM (
            SELECT t.name AS tag
            FROM meal_tags mt
            JOIN tags t ON t.id = mt.tag_id
            WHERE mt.meal_id = m.id

            UNION ALL

            SELECT c.name AS tag
            FROM categories c
            WHERE c.id = m.category_id
        ) AS source
    ) AS normalized
) AS tag_data ON TRUE
LEFT JOIN LATERAL (
    SELECT
        STRING_AGG(i.name, ', ' ORDER BY i.name) AS ingredients_list,
        JSON_AGG(
            JSON_BUILD_OBJECT('name', i.name, 'amount', mi.amount, 'unit', mi.unit)
            ORDER BY i.name
        ) AS ingredients
    FROM meal_ingredients mi
    JOIN ingredients i ON i.id = mi.ingredient_id
    WHERE mi.meal_id = m.id
) AS ingredient_data ON TRUE
WHERE m.is_active IS TRUE;
