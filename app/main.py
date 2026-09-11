from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from app.database import get_db_connection

app = FastAPI(
    title="Meal Planner AI API",
    description="API para la gestión de comidas, planes semanales y recomendaciones con IA.",
    version="0.1.0"
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "Meal Planner AI",
        "message": "Servidor FastAPI funcionando correctamente"
    }

@app.get("/meals")
def get_meals(
    category: Optional[str] = Query(None, description="Filtrar por categoría (ej. Almuerzo, Cena, Desayuno)"),
    max_calories: Optional[int] = Query(None, description="Calorías máximas permitidas"),
    tag: Optional[str] = Query(None, description="Filtrar por etiqueta (ej. Sin Gluten, Alto en Proteína)"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de resultados (1-100)")
):
    """
    Obtiene platos filtrados dinámicamente según categoría, calorías máximas o etiquetas.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Consulta base
            query = "SELECT * FROM v_meals_full_info WHERE 1=1"
            params = []

            # Filtro por categoría (búsqueda parcial insensible a mayúsculas/minúsculas)
            # ✅ AHORA (category)
            if category:
                query += " AND category ILIKE %s"
                params.append(f"%{category}%")

            # Filtro por calorías máximas
            if max_calories:
                query += " AND calories <= %s"
                params.append(max_calories)

            # Filtro por etiquetas (convierte el array de etiquetas a texto para buscar coincidencia)
            if tag:
                query += " AND tags::text ILIKE %s"
                params.append(f"%{tag}%")

            # Paginación/Límite
            query += " LIMIT %s;"
            params.append(limit)

            # Ejecutamos la consulta pasándole los parámetros
            cursor.execute(query, tuple(params))
            meals = cursor.fetchall()

            return {
                "total_returned": len(meals),
                "filters_applied": {
                    "category": category,
                    "max_calories": max_calories,
                    "tag": tag,
                    "limit": limit
                },
                "meals": meals
            }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al consultar la base de datos: {str(e)}"
        )
    finally:
        conn.close()