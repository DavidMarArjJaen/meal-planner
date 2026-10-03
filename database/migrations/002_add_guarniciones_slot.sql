BEGIN;

INSERT INTO tags (name) VALUES ('Guarniciones')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE meal_plan_items
    DROP CONSTRAINT IF EXISTS meal_plan_items_meal_type_check;

ALTER TABLE meal_plan_items
    ADD CONSTRAINT meal_plan_items_meal_type_check
    CHECK (meal_type IN ('Desayuno', 'Almuerzo', 'Guarniciones', 'Snack', 'Cena'));

COMMIT;