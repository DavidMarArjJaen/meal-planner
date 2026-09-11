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