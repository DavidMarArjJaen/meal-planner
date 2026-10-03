-- Esquema principal simplificado del planificador.
CREATE TABLE IF NOT EXISTS meals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    calories INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(40) NOT NULL UNIQUE,
    CONSTRAINT tags_name_allowed CHECK (name IN (
        'Desayuno', 'Comida/Cena', 'Snack', 'Ligero', 'Alba', 'Guarniciones'
    ))
);

INSERT INTO tags (name) VALUES
    ('Desayuno'), ('Comida/Cena'), ('Snack'), ('Ligero'), ('Alba'), ('Guarniciones')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS meal_tags (
    meal_id INT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (meal_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_meal_tags_tag_id ON meal_tags(tag_id);

CREATE TABLE IF NOT EXISTS meal_ingredients (
    meal_id INT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    ingredient_id INT NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    unit VARCHAR(30) NOT NULL,
    PRIMARY KEY (meal_id, ingredient_id)
);

-- 1. Tabla Principal: Planes de Comida
CREATE TABLE IF NOT EXISTS meal_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla Detalle: Asignación de Platos por Día y Momento
CREATE TABLE IF NOT EXISTS meal_plan_items (
    id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    meal_id INT NOT NULL REFERENCES meals(id) ON DELETE RESTRICT,
    day_of_week VARCHAR(15) NOT NULL CHECK (
        day_of_week IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')
    ),
    meal_type VARCHAR(50) NOT NULL CHECK (
        meal_type IN ('Desayuno', 'Almuerzo', 'Guarniciones', 'Snack', 'Cena')
    ),
    servings INT DEFAULT 1 CHECK (servings > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Evita duplicar el mismo tipo de comida en el mismo día dentro del mismo plan
    CONSTRAINT unique_meal_slot_per_day UNIQUE (plan_id, day_of_week, meal_type)
);

-- Índices para optimizar las consultas frecuentes por plan
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_plan_id ON meal_plan_items(plan_id);

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
    SELECT ARRAY_AGG(t.name ORDER BY t.name) AS tags
    FROM meal_tags mt
    JOIN tags t ON t.id = mt.tag_id
    WHERE mt.meal_id = m.id
) tag_data ON TRUE
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
) ingredient_data ON TRUE;