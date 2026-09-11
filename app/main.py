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

            # Filtro por categoría (usando la columna 'category')
            if category:
                query += " AND category ILIKE %s"
                params.append(f"%{category}%")

            # Filtro por calorías máximas
            if max_calories:
                query += " AND calories <= %s"
                params.append(max_calories)

            # Filtro por etiquetas
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


@app.get("/meals/{meal_id}")
def get_meal_by_id(meal_id: int):
    """
    Obtiene la información detallada de una sola comida mediante su ID único.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Consultamos la vista filtrando por el ID único
            cursor.execute("SELECT * FROM v_meals_full_info WHERE meal_id = %s;", (meal_id,))
            meal = cursor.fetchone()  # fetchone() trae solo 1 registro (o None)

            # Si el ID no existe en la base de datos
            if not meal:
                raise HTTPException(
                    status_code=404,
                    detail=f"No se encontró ninguna comida con el ID {meal_id}"
                )

            return meal
    except HTTPException:
        # Re-elevamos la excepción HTTP 404 para que no la capture el except genérico
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al consultar la base de datos: {str(e)}"
        )
    finally:
        conn.close()