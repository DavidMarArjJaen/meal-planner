# Meal Planner AI 🥗🤖

Aplicación para la planificación semanal de comidas personalizada con asistente de Inteligencia Artificial y almacenamiento en PostgreSQL.

---

## 📐 Esquema de la Base de Datos

![Diagrama de Relaciones de la Base de Datos](database_schema.png)

### 🔗 Relaciones y Estructura del Modelo ER

* **`categories` (1:N con `meals`):** Clasifica los platos en *Desayuno, Almuerzo, Cena o Snack*.
* **`meals` (Tabla Principal):** Almacena información nutricional clave (calorías, proteínas, carbohidratos, grasas), tiempo de preparación y estado activo.
* **`tags` (N:M con `meals` mediante `meal_tags`):** Filtros y restricciones dietéticas (*Sin Gluten, Keto, Vegano, Alto en Proteína*, etc.).
* **`ingredients` (N:M con `meals` mediante `meal_ingredients`):** Catálogo de alimentos básicos que registra las cantidades (`amount`) y unidades (`unit`) exactas por plato para permitir la generación automática de la lista de la compra.
* **`meal_plans` (1:N con `meal_plan_items`):** Cabecera del plan semanal de comidas (nombre, descripción, objetivo calórico, fecha de inicio).
* **`meal_plan_items` (Detalle de asignación):** Vincula una comida (`meal_id`) a un día de la semana (`day_of_week`) y momento determinado (`meal_type`).

### 👁️ Vistas Especiales
* **`v_meals_full_info`:** Vista SQL unificada que concatena categorías, etiquetas e ingredientes formateados en una sola estructura optimizada para consultas de lenguaje natural y prompting con Inteligencia Artificial.

---

## 🛠️ Tecnología y Arquitectura

* **Framework API:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
* **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) con controlador nativo `psycopg2` y cursor mapeado `RealDictCursor`.
* **Validación de Datos:** [Pydantic v2](https://docs.pydantic.dev/) para serialización, parsing y tipado estricto.
* **Entorno de Ejecución:** WSL2 (Ubuntu) / Linux.
* **Seguridad y Configuración:** `python-dotenv` para gestión aislada de credenciales.
* **Servidor ASGI:** Uvicorn con recarga en caliente (*Hot-Reload*).

---

## 📁 Estructura del Proyecto

```text
meal-planner/
├── app/
│   ├── __init__.py
│   ├── database.py       # Conexión a PostgreSQL con carga explícita de .env
│   ├── main.py           # Endpoints de la API FastAPI y lógica transaccional
│   └── schemas.py        # Modelos de validación y serialización Pydantic
├── database/
│   ├── meals_data.json   # Semilla inicial de datos nutricionales e ingredientes
│   ├── schema.sql        # Definición de tablas, vistas, índices y restricciones
│   └── seed.py           # Script idempotente de ingesta de datos
├── database_schema.png   # Diagrama entidad-relación de la base de datos
├── .env.example          # Plantilla de variables de entorno requeridas
├── .gitignore            # Exclusión de credenciales y archivos temporales
├── requirements.txt      # Dependencias del proyecto
└── README.md             # Documentación principal