from typing import Optional, List
from pydantic import BaseModel, Field

class MealResponse(BaseModel):
    """
    Esquema tolerante para los datos de un plato de la vista v_meals_full_info.
    Usa Optional en los campos que en la base de datos pueden ser NULL.
    """
    meal_id: int
    meal_name: str
    description: Optional[str] = None
    category: Optional[str] = None
    prep_time_minutes: Optional[int] = Field(None, description="Tiempo de preparación en minutos")
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    tags: Optional[str] = None
    ingredients_list: Optional[str] = None

class FiltersApplied(BaseModel):
    """
    Filtros aplicados en la consulta.
    """
    category: Optional[str] = None
    max_calories: Optional[int] = None
    tag: Optional[str] = None
    limit: int

class MealListResponse(BaseModel):
    """
    Respuesta envolvente para la lista de comidas.
    """
    total_returned: int
    filters_applied: FiltersApplied
    meals: List[MealResponse]

from datetime import date

# --- ESQUEMAS PARA PLANES DE COMIDA ---

class PlanItemCreate(BaseModel):
    meal_id: int
    day_of_week: str = Field(..., description="Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo")
    meal_type: str = Field(..., description="Desayuno, Almuerzo, Cena, Snack")
    servings: Optional[int] = Field(1, ge=1)

class PlanCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=120)
    description: Optional[str] = None
    target_calories: Optional[int] = Field(None, ge=500, le=10000)
    start_date: Optional[date] = None
    items: List[PlanItemCreate] = Field(..., min_items=1)

class PlanItemResponse(PlanItemCreate):
    id: int
    plan_id: int
    meal_name: Optional[str] = None

class PlanResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    target_calories: Optional[int] = None
    start_date: Optional[date] = None
    items: List[PlanItemResponse] = []


class MealCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120, description="Nombre del plato")
    description: Optional[str] = Field(None, description="Descripción detallada o preparación")
    category_id: int = Field(..., description="ID de la categoría (1: Desayuno, 2: Almuerzo, 3: Cena, 4: Snack)")
    prep_time_minutes: Optional[int] = Field(20, ge=1, description="Tiempo de preparación en minutos")
    calories: Optional[int] = Field(0, ge=0)
    protein_g: Optional[float] = Field(0.0, ge=0.0)
    carbs_g: Optional[float] = Field(0.0, ge=0.0)
    fat_g: Optional[float] = Field(0.0, ge=0.0)



# --- Esquemas para Lista de la Compra ---

class ShoppingListItem(BaseModel):
    ingredient: str
    total_amount: float
    unit: str

class ShoppingListResponse(BaseModel):
    plan_id: int
    plan_name: str
    items: List[ShoppingListItem]