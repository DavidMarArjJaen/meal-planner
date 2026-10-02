from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

# ------------------------------------------------------------------
# CONFIGURACIÓN BASE (Opcional: Facilita la conversión desde el ORM)
# ------------------------------------------------------------------
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ------------------------------------------------------------------
# ESQUEMAS PARA PLATOS / COMIDAS (MEALS)
# ------------------------------------------------------------------
class MealResponse(BaseSchema):
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

# Sub-esquema para un ingrediente individual
class MealIngredientCreate(BaseModel):
    name: str
    amount: float
    unit: str

class MealCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = None
    category_id: Optional[int] = 2
    category: Optional[str] = "Almuerzo"
    prep_time_minutes: Optional[int] = 20
    calories: Optional[int] = 0
    protein_g: Optional[float] = 0.0
    carbs_g: Optional[float] = 0.0
    fat_g: Optional[float] = 0.0
    ingredients: Optional[List[MealIngredientCreate]] = []


# ------------------------------------------------------------------
# ESQUEMAS PARA PLANES DE COMIDA
# ------------------------------------------------------------------
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
    items: List[PlanItemCreate] = Field(..., min_length=1)  # Usa min_length para Pydantic v2


class PlanItemResponse(PlanItemCreate, BaseSchema):
    id: int
    plan_id: int
    meal_name: Optional[str] = None


class PlanResponse(BaseSchema):
    id: int
    name: str
    description: Optional[str] = None
    target_calories: Optional[int] = None
    start_date: Optional[date] = None
    items: List[PlanItemResponse] = []


# ------------------------------------------------------------------
# ESQUEMAS PARA LISTA DE LA COMPRA
# ------------------------------------------------------------------
class ShoppingListItem(BaseSchema):
    ingredient: str
    total_amount: float
    unit: str


class ShoppingListResponse(BaseSchema):
    plan_id: int
    plan_name: str
    items: List[ShoppingListItem]