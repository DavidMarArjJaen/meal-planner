-- =============================================================
-- ESTRUCTURA DE LA BASE DE DATOS Y VISTAS (MEAL PLANNER)
-- =============================================================

-- 1. Tabla de Categorías (Desayuno, Almuerzo, Cena, Snack)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Tabla de Comidas
CREATE TABLE IF NOT EXISTS meals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    prep_time_minutes INT,
    calories INT NOT NULL,
    protein_g NUMERIC(5,2) DEFAULT 0,
    carbs_g NUMERIC(5,2) DEFAULT 0,
    fat_g NUMERIC(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. VISTA SQL: Información unificada de comidas y nutrición
CREATE OR REPLACE VIEW v_meals_nutrition AS
SELECT 
    m.id AS meal_id,
    m.name AS meal_name,
    m.description,
    c.name AS category_name,
    m.prep_time_minutes,
    m.calories,
    m.protein_g,
    m.carbs_g,
    m.fat_g,
    m.is_active
FROM meals m
LEFT JOIN categories c ON m.category_id = c.id
WHERE m.is_active = TRUE;

-- =============================================================
-- DATOS DE PRUEBA (SEED DATA)
-- =============================================================

INSERT INTO categories (name) VALUES 
    ('Desayuno'), 
    ('Almuerzo'), 
    ('Cena'), 
    ('Snack')
ON CONFLICT (name) DO NOTHING;

INSERT INTO meals (name, description, category_id, prep_time_minutes, calories, protein_g, carbs_g, fat_g) VALUES
    ('Tostadas con Aguacate y Huevo', 'Pan integral con aguacate machacado y huevo pochado', 1, 10, 350, 14.5, 30.0, 18.0),
    ('Avena con Proteína y Frutos Rojos', 'Avena cocida con leche de almendras y proteína', 1, 5, 410, 28.0, 52.0, 7.5),
    ('Pechuga de Pollo con Arroz', 'Pechuga marinada con arroz integral y brócoli', 2, 25, 520, 45.0, 50.0, 10.0),
    ('Ensalada de Atún y Garbanzos', 'Atún al natural, garbanzos, tomate, pepino y aceite de oliva', 2, 10, 430, 32.0, 38.0, 14.0),
    ('Salmón al Horno con Espárragos', 'Lomo de salmón fresco horneado con espárragos', 3, 20, 480, 38.0, 6.0, 32.0),
    ('Tortilla de Espinacas y Queso Feta', 'Tortilla de 3 huevos con espinacas frescas y queso feta', 3, 12, 320, 22.0, 4.0, 24.0)
ON CONFLICT DO NOTHING;


-- 1. Tabla Principal: Planes de Comida
CREATE TABLE IF NOT EXISTS meal_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    target_calories INT,
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
        meal_type IN ('Desayuno', 'Almuerzo', 'Cena', 'Snack')
    ),
    servings INT DEFAULT 1 CHECK (servings > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Evita duplicar el mismo tipo de comida en el mismo día dentro del mismo plan
    CONSTRAINT unique_meal_slot_per_day UNIQUE (plan_id, day_of_week, meal_type)
);

-- Índices para optimizar las consultas frecuentes por plan
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_plan_id ON meal_plan_items(plan_id);

-- 3. Catálogos y relaciones para etiquetas, ingredientes y lista de la compra
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    category VARCHAR(80) NOT NULL DEFAULT 'Despensa'
);

CREATE TABLE IF NOT EXISTS meal_tags (
    meal_id INT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (meal_id, tag_id)
);

CREATE TABLE IF NOT EXISTS meal_ingredients (
    meal_id INT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    ingredient_id INT NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    unit VARCHAR(30) NOT NULL,
    PRIMARY KEY (meal_id, ingredient_id)
);

CREATE OR REPLACE VIEW v_meals_full_info AS
SELECT
    m.id AS meal_id,
    m.name AS meal_name,
    m.description,
    c.name AS category,
    m.prep_time_minutes,
    m.calories,
    m.protein_g,
    m.carbs_g,
    m.fat_g,
    COALESCE(tag_data.tags, '') AS tags,
    COALESCE(ingredient_data.ingredients_list, '') AS ingredients_list,
    COALESCE(ingredient_data.ingredients, '[]'::json) AS ingredients
FROM meals m
LEFT JOIN categories c ON c.id = m.category_id
LEFT JOIN LATERAL (
    SELECT STRING_AGG(t.name, ', ' ORDER BY t.name) AS tags
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
) ingredient_data ON TRUE
WHERE m.is_active = TRUE;