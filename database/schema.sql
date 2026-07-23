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