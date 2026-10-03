import os
import json
import psycopg2
from dotenv import load_dotenv

load_dotenv()

JSON_FILE_PATH = os.path.join(os.path.dirname(__file__), "meals_data.json")
ALLOWED_TAGS = {
    "Desayuno",
    "Comida/Cena",
    "Snack",
    "Ligero",
    "Alba",
    "Guarniciones",
}

def load_json_data(filepath):
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"No se encontró el archivo {filepath}")
    
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

def seed_database():
    meals_data = load_json_data(JSON_FILE_PATH)
    conn = None

    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        cur = conn.cursor()
        for tag in sorted(ALLOWED_TAGS):
            cur.execute(
                "INSERT INTO tags (name) VALUES (%s) ON CONFLICT (name) DO NOTHING;",
                (tag,),
            )

        for item in meals_data:
            meal_tags = set(item.get("tags", []))
            invalid_tags = meal_tags - ALLOWED_TAGS
            if invalid_tags:
                raise ValueError(f"Etiquetas no permitidas en {item.get('name')}: {sorted(invalid_tags)}")

            cur.execute("SELECT id FROM meals WHERE name = %s ORDER BY id LIMIT 1;", (item["name"],))
            row = cur.fetchone()
            if row:
                meal_id = row[0]
                cur.execute(
                    "UPDATE meals SET description = %s WHERE id = %s;",
                    (item.get("description", ""), meal_id),
                )
            else:
                cur.execute(
                    "INSERT INTO meals (name, description) VALUES (%s, %s) RETURNING id;",
                    (item["name"], item.get("description", "")),
                )
                meal_id = cur.fetchone()[0]

            cur.execute("DELETE FROM meal_tags WHERE meal_id = %s;", (meal_id,))
            cur.execute("DELETE FROM meal_ingredients WHERE meal_id = %s;", (meal_id,))

            for tag in meal_tags:
                cur.execute("SELECT id FROM tags WHERE name = %s;", (tag,))
                tag_id = cur.fetchone()[0]
                cur.execute(
                    "INSERT INTO meal_tags (meal_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
                    (meal_id, tag_id),
                )

            for ingredient in item.get("ingredients", []):
                ingredient_name = ingredient.get("name", "").strip()
                if not ingredient_name:
                    continue
                cur.execute(
                    """
                    INSERT INTO ingredients (name) VALUES (%s)
                    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id;
                    """,
                    (ingredient_name,),
                )
                ingredient_id = cur.fetchone()[0]
                cur.execute(
                    """
                    INSERT INTO meal_ingredients (meal_id, ingredient_id, amount, unit)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (meal_id, ingredient_id)
                    DO UPDATE SET amount = EXCLUDED.amount, unit = EXCLUDED.unit;
                    """,
                    (meal_id, ingredient_id, ingredient.get("amount", 1), ingredient.get("unit", "ud")),
                )

        conn.commit()
        cur.close()
        print(f"Carga completada: {len(meals_data)} platos procesados.")

    except Exception as e:
        if conn:
            conn.rollback()
        raise RuntimeError(f"Error durante la carga inicial: {e}") from e
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    seed_database()