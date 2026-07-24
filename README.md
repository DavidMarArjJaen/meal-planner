# Meal Planner AI 🥗🤖

Aplicación para la planificación semanal de comidas personalizada con asistente de Inteligencia Artificial y almacenamiento en PostgreSQL.

---

## 🗄️ Arquitectura de la Base de Datos

El proyecto utiliza un modelo relacional en **PostgreSQL** compuesto por 6 tablas y vistas optimizadas para alimentar al motor de Inteligencia Artificial con el contexto nutricional, ingredientes y restricciones dietéticas del usuario.

### 📐 Esquema de Tablas

 ┌──────────────┐                  ┌────────────────┐                  ┌─────────────────┐
 │     tags     │                  │   categories   │                  │   ingredients   │
 └──────┬───────┘                  └───────┬────────┘                  └────────┬────────┘
        │ (1)                              │ (1)                                │ (1)
        │                                  │                                    │
        ▼ (N)                              ▼ (N)                                ▼ (N)
 ┌──────────────┐                  ┌────────────────┐                  ┌─────────────────┐
 │  meal_tags   │ ──(N)──────(1)─► │     meals      │ ◄─(1)──────(N)── │meal_ingredients │
 └──────────────┘                  └────────────────┘                  └─────────────────┘
  (Intermedia)                         (Principal)                        (Intermedia)

### 🔗 Relaciones y Estructura

* **`categories` (1:N con `meals`):** Clasifica los platos en *Desayuno, Almuerzo, Cena o Snack*.
* **`meals` (Tabla Principal):** Almacena información nutricional clave (calorías, proteínas, carbohidratos, grasas), tiempo de preparación y estado activo.
* **`tags` (N:M con `meals` mediante `meal_tags`):** Filtros y restricciones dietéticas (*Sin Gluten, Keto, Vegano, Alto en Proteína*, etc.).
* **`ingredients` (N:M con `meals` mediante `meal_ingredients`):** Catálogo de alimentos básicos que registra las cantidades (`amount`) y unidades (`unit`) exactas por plato para permitir la generación automática de la lista de la compra.

### 👁️ Vistas Especiales
* **`v_meals_full_info`:** Vista SQL unificada que concatena categorías, etiquetas e ingredientes formateados en una sola estructura optimizada para consultas de lenguaje natural con IA.