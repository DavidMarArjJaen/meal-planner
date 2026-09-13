from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, status
from app.database import get_db_connection
from app.schemas import MealResponse, MealListResponse, ShoppingListResponse  # <--- Importamos los esquemas
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware  # <-- Añade esta línea
from pydantic import BaseModel, ConfigDict


app = FastAPI(
    title="Meal Planner AI API",
    description="API para la gestión de comidas, planes semanales y recomendaciones con IA.",
    version="0.1.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite peticiones desde cualquier origen (ideal para desarrollo)
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permite todos los encabezados
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "Meal Planner AI",
        "message": "Servidor FastAPI funcionando correctamente"
    }

@app.get("/meals", response_model=MealListResponse)  # <--- Indicamos el modelo de respuesta
def get_meals(
    category: Optional[str] = Query(None, description="Filtrar por categoría (ej. Almuerzo, Cena)"),
    max_calories: Optional[int] = Query(None, description="Calorías máximas permitidas"),
    tag: Optional[str] = Query(None, description="Filtrar por etiqueta (ej. Sin Gluten, Alto en Proteína)"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de resultados (1-100)")
):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            query = "SELECT * FROM v_meals_full_info WHERE 1=1"
            params = []

            if category:
                query += " AND category ILIKE %s"
                params.append(f"%{category}%")

            if max_calories:
                query += " AND calories <= %s"
                params.append(max_calories)

            if tag:
                query += " AND tags::text ILIKE %s"
                params.append(f"%{tag}%")

            query += " LIMIT %s;"
            params.append(limit)

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

@app.get("/meals/{meal_id}", response_model=MealResponse)  # <--- Indicamos el modelo de respuesta
def get_meal_by_id(meal_id: int):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM v_meals_full_info WHERE meal_id = %s;", (meal_id,))
            meal = cursor.fetchone()

            if not meal:
                raise HTTPException(
                    status_code=404,
                    detail=f"No se encontró ninguna comida con el ID {meal_id}"
                )

            return meal
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al consultar la base de datos: {str(e)}"
        )
    finally:
        conn.close()


import psycopg2
from fastapi import status
from app.schemas import (
    MealResponse, 
    MealListResponse, 
    PlanCreate, 
    PlanResponse,
    ShoppingListResponse
)

@app.post("/plans", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_meal_plan(plan: PlanCreate):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Insertar la cabecera del plan
            insert_plan_query = """
                INSERT INTO meal_plans (name, description, target_calories, start_date)
                VALUES (%s, %s, %s, COALESCE(%s, CURRENT_DATE))
                RETURNING id, name, description, target_calories, start_date;
            """
            cursor.execute(insert_plan_query, (
                plan.name,
                plan.description,
                plan.target_calories,
                plan.start_date
            ))
            created_plan = cursor.fetchone()
            plan_id = created_plan["id"]

            # 2. Insertar cada plato asignado al plan
            created_items = []
            insert_item_query = """
                INSERT INTO meal_plan_items (plan_id, meal_id, day_of_week, meal_type, servings)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, plan_id, meal_id, day_of_week, meal_type, servings;
            """
            for item in plan.items:
                cursor.execute(insert_item_query, (
                    plan_id,
                    item.meal_id,
                    item.day_of_week,
                    item.meal_type,
                    item.servings
                ))
                created_items.append(cursor.fetchone())

            # 3. Confirmar la transacción completa
            conn.commit()

            # Construir la respuesta final
            return {
                "id": created_plan["id"],
                "name": created_plan["name"],
                "description": created_plan["description"],
                "target_calories": created_plan["target_calories"],
                "start_date": created_plan["start_date"],
                "items": created_items
            }

    except psycopg2.IntegrityError as e:
        conn.rollback()
        error_msg = str(e)
        if "fk_meal" in error_msg or "meal_plan_items_meal_id_fkey" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="Uno o más 'meal_id' proporcionados no existen en la base de datos."
            )
        elif "unique_meal_slot_per_day" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="No se puede asignar el mismo tipo de comida (ej. Almuerzo) dos veces en el mismo día."
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Error de integridad en los datos: {error_msg}"
            )
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error inesperado al crear el plan: {str(e)}"
        )
    finally:
        conn.close()




@app.get("/plans", response_model=List[PlanResponse])
def get_meal_plans():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            query = """
                SELECT 
                    p.id AS plan_id,
                    p.name AS plan_name,
                    p.description AS plan_description,
                    p.target_calories,
                    p.start_date,
                    pi.id AS item_id,
                    pi.meal_id,
                    m.name AS meal_name,
                    pi.day_of_week,
                    pi.meal_type,
                    pi.servings
                FROM meal_plans p
                LEFT JOIN meal_plan_items pi ON p.id = pi.plan_id
                LEFT JOIN meals m ON pi.meal_id = m.id
                ORDER BY p.id DESC, pi.id ASC;
            """
            cursor.execute(query)
            rows = cursor.fetchall()

            # Agrupar las filas de la base de datos por ID de plan
            plans_dict = {}
            for row in rows:
                pid = row["plan_id"]
                if pid not in plans_dict:
                    plans_dict[pid] = {
                        "id": pid,
                        "name": row["plan_name"],
                        "description": row["plan_description"],
                        "target_calories": row["target_calories"],
                        "start_date": row["start_date"],
                        "items": []
                    }
                
                # Agregar el plato solo si el plan tiene items asignados
                if row["item_id"] is not None:
                    plans_dict[pid]["items"].append({
                        "id": row["item_id"],
                        "plan_id": pid,
                        "meal_id": row["meal_id"],
                        "meal_name": row["meal_name"],
                        "day_of_week": row["day_of_week"],
                        "meal_type": row["meal_type"],
                        "servings": row["servings"]
                    })

            return list(plans_dict.values())
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener los planes de comida: {str(e)}"
        )
    finally:
        conn.close()



@app.get("/plans/{plan_id}", response_model=PlanResponse)
def get_meal_plan_by_id(plan_id: int):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            query = """
                SELECT 
                    p.id AS plan_id,
                    p.name AS plan_name,
                    p.description AS plan_description,
                    p.target_calories,
                    p.start_date,
                    pi.id AS item_id,
                    pi.meal_id,
                    m.name AS meal_name,
                    pi.day_of_week,
                    pi.meal_type,
                    pi.servings
                FROM meal_plans p
                LEFT JOIN meal_plan_items pi ON p.id = pi.plan_id
                LEFT JOIN meals m ON pi.meal_id = m.id
                WHERE p.id = %s
                ORDER BY pi.id ASC;
            """
            cursor.execute(query, (plan_id,))
            rows = cursor.fetchall()

            if not rows:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No se encontró ningún plan con el ID {plan_id}"
                )

            # Construimos la cabecera del plan con la primera fila obtenida
            first_row = rows[0]
            plan_data = {
                "id": first_row["plan_id"],
                "name": first_row["plan_name"],
                "description": first_row["plan_description"],
                "target_calories": first_row["target_calories"],
                "start_date": first_row["start_date"],
                "items": []
            }

            # Agregamos los platos asociados si la relación no es vacía
            for row in rows:
                if row["item_id"] is not None:
                    plan_data["items"].append({
                        "id": row["item_id"],
                        "plan_id": plan_id,
                        "meal_id": row["meal_id"],
                        "meal_name": row["meal_name"],
                        "day_of_week": row["day_of_week"],
                        "meal_type": row["meal_type"],
                        "servings": row["servings"]
                    })

            return plan_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al consultar el plan {plan_id}: {str(e)}"
        )
    finally:
        conn.close()

@app.delete("/plans/{plan_id}", status_code=status.HTTP_200_OK)
def delete_meal_plan(plan_id: int):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # DELETE con RETURNING id para saber si realmente se borró alguna fila
            cursor.execute("DELETE FROM meal_plans WHERE id = %s RETURNING id;", (plan_id,))
            deleted_plan = cursor.fetchone()

            if not deleted_plan:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No se encontró ningún plan con el ID {plan_id}"
                )

            # Confirmar la eliminación en la base de datos
            conn.commit()

            return {
                "message": f"El plan con ID {plan_id} y todos sus elementos asociados han sido eliminados correctamente."
            }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar el plan {plan_id}: {str(e)}"
        )
    finally:
        conn.close()


@app.put("/plans/{plan_id}", response_model=PlanResponse)
def update_meal_plan(plan_id: int, plan: PlanCreate):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Comprobar existencia y actualizar la cabecera
            update_plan_query = """
                UPDATE meal_plans 
                SET name = %s,
                    description = %s,
                    target_calories = %s,
                    start_date = COALESCE(%s, start_date)
                WHERE id = %s
                RETURNING id, name, description, target_calories, start_date;
            """
            cursor.execute(update_plan_query, (
                plan.name,
                plan.description,
                plan.target_calories,
                plan.start_date,
                plan_id
            ))
            updated_plan = cursor.fetchone()

            if not updated_plan:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No se encontró ningún plan con el ID {plan_id} para actualizar."
                )

            # 2. Reemplazar items: eliminar la asignación previa de platos
            cursor.execute("DELETE FROM meal_plan_items WHERE plan_id = %s;", (plan_id,))

            # 3. Insertar la nueva lista de platos
            updated_items = []
            insert_item_query = """
                INSERT INTO meal_plan_items (plan_id, meal_id, day_of_week, meal_type, servings)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, plan_id, meal_id, day_of_week, meal_type, servings;
            """
            for item in plan.items:
                cursor.execute(insert_item_query, (
                    plan_id,
                    item.meal_id,
                    item.day_of_week,
                    item.meal_type,
                    item.servings
                ))
                updated_items.append(cursor.fetchone())

            # 4. Confirmar la transacción completa
            conn.commit()

            return {
                "id": updated_plan["id"],
                "name": updated_plan["name"],
                "description": updated_plan["description"],
                "target_calories": updated_plan["target_calories"],
                "start_date": updated_plan["start_date"],
                "items": updated_items
            }

    except psycopg2.IntegrityError as e:
        conn.rollback()
        error_msg = str(e)
        if "fk_meal" in error_msg or "meal_plan_items_meal_id_fkey" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="Uno o más 'meal_id' proporcionados no existen en la base de datos."
            )
        elif "unique_meal_slot_per_day" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="No se puede asignar el mismo tipo de comida dos veces en el mismo día dentro del plan."
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Error de integridad al actualizar el plan: {error_msg}"
            )
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error inesperado al actualizar el plan {plan_id}: {str(e)}"
        )
    finally:
        conn.close()


from app.schemas import MealCreate  # Actualizar importaciones

# --- ENDPOINTS CRUD PARA MEALS ---

@app.post("/meals", response_model=MealResponse, status_code=status.HTTP_201_CREATED)
def create_meal(meal: MealCreate):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            query = """
                INSERT INTO meals (name, description, category_id, prep_time_minutes, calories, protein_g, carbs_g, fat_g)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """
            cursor.execute(query, (
                meal.name,
                meal.description,
                meal.category_id,
                meal.prep_time_minutes,
                meal.calories,
                meal.protein_g,
                meal.carbs_g,
                meal.fat_g
            ))
            new_meal_id = cursor.fetchone()["id"]
            conn.commit()

            # Consultamos la vista para devolver el objeto completo serializado por MealResponse
            cursor.execute("SELECT * FROM v_meals_full_info WHERE meal_id = %s;", (new_meal_id,))
            return cursor.fetchone()

    except psycopg2.IntegrityError as e:
        conn.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error de integridad. Verifica que el 'category_id' ({meal.category_id}) exista en la base de datos."
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear el plato: {str(e)}")
    finally:
        conn.close()


@app.put("/meals/{meal_id}", response_model=MealResponse)
def update_meal(meal_id: int, meal: MealCreate):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            query = """
                UPDATE meals
                SET name = %s,
                    description = %s,
                    category_id = %s,
                    prep_time_minutes = %s,
                    calories = %s,
                    protein_g = %s,
                    carbs_g = %s,
                    fat_g = %s
                WHERE id = %s
                RETURNING id;
            """
            cursor.execute(query, (
                meal.name,
                meal.description,
                meal.category_id,
                meal.prep_time_minutes,
                meal.calories,
                meal.protein_g,
                meal.carbs_g,
                meal.fat_g,
                meal_id
            ))
            updated = cursor.fetchone()

            if not updated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No se encontró ningún plato con el ID {meal_id} para actualizar."
                )

            conn.commit()

            # Consultamos la vista para obtener el plato actualizado con su categoría y etiquetas
            cursor.execute("SELECT * FROM v_meals_full_info WHERE meal_id = %s;", (meal_id,))
            return cursor.fetchone()

    except psycopg2.IntegrityError:
        conn.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error de integridad. El 'category_id' ({meal.category_id}) no existe."
        )
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar el plato: {str(e)}")
    finally:
        conn.close()


@app.delete("/meals/{meal_id}", status_code=status.HTTP_200_OK)
def delete_meal(meal_id: int):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM meals WHERE id = %s RETURNING id;", (meal_id,))
            deleted = cursor.fetchone()

            if not deleted:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No se encontró ningún plato con el ID {meal_id} para eliminar."
                )

            conn.commit()
            return {"message": f"El plato con ID {meal_id} fue eliminado correctamente."}

    except psycopg2.IntegrityError:
        conn.rollback()
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar este plato porque está siendo utilizado en uno o más planes semanales."
        )
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar el plato: {str(e)}")
    finally:
        conn.close()



@app.get("/plans/{plan_id}/shopping-list", response_model=ShoppingListResponse, tags=["Planes"])
def get_shopping_list(plan_id: int):
    """
    Consolida y suma todos los ingredientes requeridos para los platos
    asignados a un plan de comidas específico.
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # 1. Comprobar que el plan existe
        cursor.execute("SELECT id, name FROM meal_plans WHERE id = %s;", (plan_id,))
        plan = cursor.fetchone()
        
        if not plan:
            raise HTTPException(status_code=404, detail="El plan de comidas no existe")
        
        # 2. Consultar y consolidar ingredientes agrupados por nombre y unidad
        query = """
            SELECT 
                i.name AS ingredient,
                ROUND(SUM(mi.amount)::numeric, 2) AS total_amount,
                mi.unit
            FROM meal_plan_items mpi
            JOIN meal_ingredients mi ON mpi.meal_id = mi.meal_id
            JOIN ingredients i ON mi.ingredient_id = i.id
            WHERE mpi.plan_id = %s
            GROUP BY i.name, mi.unit
            ORDER BY i.name ASC;
        """
        cursor.execute(query, (plan_id,))
        shopping_items = cursor.fetchall()
        
        return {
            "plan_id": plan["id"],
            "plan_name": plan["name"],
            "items": shopping_items
        }

    finally:
        cursor.close()
        conn.close()




# Definición del modelo Pydantic flexible sin restricciones de longitud mínima en items
class PlanCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = ""
    items: Optional[List[Any]] = []

# Endpoint POST /plans
@app.post("/plans", status_code=201)
def create_plan(plan: PlanCreate):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    plan_name = (plan.name or plan.title or "Nuevo Plan").strip()
    plan_desc = (plan.description or "").strip()

    try:
        try:
            cursor.execute(
                "INSERT INTO meal_plans (name, description) VALUES (%s, %s) RETURNING id, name, description;",
                (plan_name, plan_desc)
            )
        except Exception:
            conn.rollback()
            cursor.execute(
                "INSERT INTO plans (name, description) VALUES (%s, %s) RETURNING id, name, description;",
                (plan_name, plan_desc)
            )

        new_plan = cursor.fetchone()
        conn.commit()
        return new_plan

    except Exception as e:
        conn.rollback()
        print(f"❌ Error al crear plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# Endpoint: Eliminar un plan semanal por ID
@app.delete("/plans/{plan_id}", status_code=200)
def delete_plan(plan_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # 1. Eliminar los ítems asociados al plan primero (por integridad referencial si no hay ON DELETE CASCADE)
        try:
            cursor.execute("DELETE FROM plan_items WHERE plan_id = %s;", (plan_id,))
        except Exception:
            conn.rollback()
            cursor.execute("DELETE FROM meal_plan_items WHERE plan_id = %s;", (plan_id,))

        # 2. Eliminar el plan
        try:
            cursor.execute("DELETE FROM meal_plans WHERE id = %s RETURNING id;", (plan_id,))
        except Exception:
            conn.rollback()
            cursor.execute("DELETE FROM plans WHERE id = %s RETURNING id;", (plan_id,))

        deleted_plan = cursor.fetchone()
        if not deleted_plan:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Plan no encontrado")

        conn.commit()
        return {"message": "Plan eliminado correctamente", "id": plan_id}

    except HTTPException as e:
        raise e
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al eliminar el plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")
    finally:
        cursor.close()
        conn.close()