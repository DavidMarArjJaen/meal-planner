from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

# ------------------------------------------------------------------
# CONFIGURACIÓN BASE (Opcional: Facilita la conversión desde el ORM)
# ------------------------------------------------------------------
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ------------------------------------------------------------------
# ESQUEMAS PARA PLATOS / COMIDAS (MEALS)
# ------------------------------------------------------------------
class MealIngredientCreate(BaseModel):
    name: str
    amount: float
    unit: str


MealTag = Literal[
    "Desayuno",
    "Comida/Cena",
    "Snack",
    "Ligero",
    "Alba",
    "Guarniciones",
]


class MealResponse(BaseSchema):
    meal_id: int
    meal_name: str
    description: Optional[str] = None
    tags: List[MealTag] = Field(default_factory=list)
    ingredients_list: Optional[str] = None
    ingredients: List[MealIngredientCreate] = Field(default_factory=list)





class FiltersApplied(BaseModel):
    """
    Filtros aplicados en la consulta.
    """
    tag: Optional[MealTag] = None
    limit: int


class MealListResponse(BaseModel):
    """
    Respuesta envolvente para la lista de comidas.
    """
    total_returned: int
    filters_applied: FiltersApplied
    meals: List[MealResponse]

class MealCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = None
    tags: List[MealTag] = Field(default_factory=list)
    ingredients: Optional[List[MealIngredientCreate]] = Field(default_factory=list)


# ------------------------------------------------------------------
# ESQUEMAS PARA PLANES DE COMIDA
# ------------------------------------------------------------------
class PlanItemCreate(BaseModel):
    meal_id: int
    day_of_week: str = Field(..., description="Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo")
    meal_type: str = Field(..., description="Desayuno, Almuerzo, Guarniciones, Snack, Cena")
    servings: Optional[int] = Field(1, ge=1)


class PlanCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=120)
    description: Optional[str] = None
    start_date: Optional[date] = None
    items: List[PlanItemCreate] = Field(default_factory=list)


class PlanItemResponse(PlanItemCreate, BaseSchema):
    id: int
    plan_id: int
    meal_name: Optional[str] = None


class PlanResponse(BaseSchema):
    id: int
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    items: List[PlanItemResponse] = Field(default_factory=list)


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