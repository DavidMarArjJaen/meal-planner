from fastapi import FastAPI, HTTPException
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
def get_meals(limit: int = 10):
    """
    Obtiene la lista de platos desde la vista 'v_meals_full_info'.
    Parámetro opcional 'limit' para controlar cuántos resultados devolver.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Consultamos la vista creada en la base de datos
            cursor.execute("SELECT * FROM v_meals_full_info LIMIT %s;", (limit,))
            meals = cursor.fetchall()
            
            return {
                "total_returned": len(meals),
                "meals": meals
            }
    except Exception as e:
        # Si ocurre un error, devolvemos un código HTTP 500 (Internal Server Error)
        raise HTTPException(
            status_code=500, 
            detail=f"Error al consultar la base de datos: {str(e)}"
        )
    finally:
        # Aseguramos que la conexión siempre se cierre al terminar
        conn.close()