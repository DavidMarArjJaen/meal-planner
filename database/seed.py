import json
import psycopg2
import os
import sys

# Configuración de conexión a PostgreSQL
DB_CONFIG = {
    "dbname": "meal_planner",
    "user": "postgres",        # Cambia si tu usuario de Postgres en WSL es diferente
    "password": "postgres",    # Cambia por tu contraseña si la configuraste
    "host": "127.0.0.1",
    "port": "5432"
}

JSON_FILE_PATH = os.path.join(os.path.dirname(__file__), "meals_data.json")

def load_json_data(filepath):
    if not os.path.exists(filepath):
        print(f"❌ Error: No se encontró el archivo {filepath}")
        sys.exit(1)
    
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"📂 Archivo JSON cargado con éxito ({len(data)} platos encontrados).")
    return data

def seed_database():
    meals_data = load_json_data(JSON_FILE_PATH)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("🔌 Conexión exitosa a la base de datos 'meal_planner'.")
        
        # 1. Asegurar categorías fijas
        categories_map = {}
        cur.execute("SELECT id, name FROM categories;")
        for cat_id, cat_name in cur.fetchall():
            categories_map[cat_name.lower()] = cat_id
            
        default_categories = ['Desayuno', 'Almuerzo', 'Cena', 'Snack']
        for cat_name in default_categories:
            if cat_name.lower() not in categories_map:
                cur.execute(
                    "INSERT INTO categories (name) VALUES (%s) RETURNING id;",
                    (cat_name,)
                )
                cat_id = cur.fetchone()[0]
                categories_map[cat_name.lower()] = cat_id

        # Cache de tags e ingredientes existentes
        tags_map = {}
        cur.execute("SELECT id, name FROM tags;")
        for t_id, t_name in cur.fetchall():
            tags_map[t_name.lower()] = t_id

        ingredients_map = {}
        cur.execute("SELECT id, name FROM ingredients;")
        for i_id, i_name in cur.fetchall():
            ingredients_map[i_name.lower()] = i_id

        meals_count = 0
        tags_count = 0
        ingredients_count = 0

        # 2. Procesar cada plato
        for item in meals_data:
            cat_name = item.get("category", "Almuerzo")
            category_id = categories_map.get(cat_name.lower())
            if not category_id:
                cur.execute("INSERT INTO categories (name) VALUES (%s) RETURNING id;", (cat_name,))
                category_id = cur.fetchone()[0]
                categories_map[cat_name.lower()] = category_id

            # Insertar comida
            cur.execute("""
                INSERT INTO meals (name, description, category_id, prep_time_minutes, calories, protein_g, carbs_g, fat_g)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (
                item.get("name"),
                item.get("description", ""),
                category_id,
                item.get("prep_time_minutes", 20),
                item.get("calories", 0),
                item.get("protein_g", 0.0),
                item.get("carbs_g", 0.0),
                item.get("fat_g", 0.0)
            ))
            meal_id = cur.fetchone()[0]
            meals_count += 1

            # Procesar Tags
            for tag_name in item.get("tags", []):
                tag_name_clean = tag_name.strip()
                if not tag_name_clean:
                    continue
                
                tag_id = tags_map.get(tag_name_clean.lower())
                if not tag_id:
                    cur.execute(
                        "INSERT INTO tags (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id;",
                        (tag_name_clean,)
                    )
                    tag_id = cur.fetchone()[0]
                    tags_map[tag_name_clean.lower()] = tag_id
                    tags_count += 1
                
                cur.execute(
                    "INSERT INTO meal_tags (meal_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
                    (meal_id, tag_id)
                )

            # Procesar Ingredientes
            for ing in item.get("ingredients", []):
                ing_name = ing.get("name", "").strip()
                if not ing_name:
                    continue
                ing_cat = ing.get("category", "Despensa")
                
                ing_id = ingredients_map.get(ing_name.lower())
                if not ing_id:
                    cur.execute(
                        "INSERT INTO ingredients (name, category) VALUES (%s, %s) ON CONFLICT (name) DO UPDATE SET category=EXCLUDED.category RETURNING id;",
                        (ing_name, ing_cat)
                    )
                    ing_id = cur.fetchone()[0]
                    ingredients_map[ing_name.lower()] = ing_id
                    ingredients_count += 1
                
                amount = ing.get("amount", 100)
                unit = ing.get("unit", "g")
                cur.execute(
                    "INSERT INTO meal_ingredients (meal_id, ingredient_id, amount, unit) VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING;",
                    (meal_id, ing_id, amount, unit)
                )

        conn.commit()
        cur.close()
        conn.close()

        print("\n🎉 ¡PROCESO DE INGESTA FINALIZADO CON ÉXITO!")
        print(f"   🥗 Comidas creadas: {meals_count}")
        print(f"   🏷️ Nuevas etiquetas registradas: {tags_count}")
        print(f"   🥦 Nuevos ingredientes registrados: {ingredients_count}")

    except Exception as e:
        print(f"❌ Error durante la inserción en PostgreSQL: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()

if __name__ == "__main__":
    seed_database()