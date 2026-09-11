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
```

---

## 🛡️ Políticas de Integridad y Transacciones

* **`ON DELETE CASCADE` (`meal_plan_items.plan_id`)**: Al eliminar un plan, sus asignaciones de comidas asociadas se borran automáticamente.
* **`ON DELETE RESTRICT` (`meal_plan_items.meal_id`)**: Impide la eliminación accidental de un plato de la base de datos si está siendo utilizado en un plan activo.
* **`UNIQUE (plan_id, day_of_week, meal_type)`**: Garantiza que no se pueda duplicar el mismo tipo de comida (ej. dos almuerzos) en un mismo día dentro del mismo plan.

---

## 🚀 Guía de Instalación y Configuración Local

### 1. Clonar el Repositorio

```bash
git clone [https://github.com/TU_USUARIO/meal-planner.git](https://github.com/TU_USUARIO/meal-planner.git)
cd meal-planner

```

### 2. Crear y Activar el Entorno Virtual

```bash
python3 -m venv .venv
source .venv/bin/activate

```

### 3. Instalar Dependencias

```bash
pip install -r requirements.txt

```

### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz tomando como referencia `.env.example`:

```env
DB_NAME=meal_planner
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_HOST=127.0.0.1
DB_PORT=5432

```

### 5. Aplicar Migraciones de la Base de Datos

```bash
psql -h 127.0.0.1 -U postgres -d meal_planner -f database/schema.sql

```

### 6. Cargar Datos Semilla de Ejemplo

```bash
python database/seed.py

```

### 7. Iniciar el Servidor de Desarrollo

```bash
uvicorn app.main:app --reload

```

Accede a la documentación interactiva e intuitiva de Swagger UI en **`http://127.0.0.1:8000/docs`**.

---

## 📌 Documentación de Endpoints API

### 🥗 Módulo de Comidas (`/meals`)

| Método | Endpoint | Descripción | Código HTTP |
| --- | --- | --- | --- |
| `GET` | `/meals` | Obtiene el catálogo de comidas con paginación (`limit`, `offset`) | `200 OK` |
| `GET` | `/meals/{meal_id}` | Obtiene los detalles de un plato por su ID desde `v_meals_full_info` | `200 OK` / `404` |
| `POST` | `/meals` | Registra un nuevo plato en el catálogo | `201 Created` / `400` |
| `PUT` | `/meals/{meal_id}` | Actualiza completamente un plato existente | `200 OK` / `404` |
| `DELETE` | `/meals/{meal_id}` | Elimina un plato (restringido si está asignado a un plan) | `200 OK` / `400` / `404` |

### 📅 Módulo de Planes Semanales (`/plans`)

| Método | Endpoint | Descripción | Código HTTP |
| --- | --- | --- | --- |
| `POST` | `/plans` | Crea un plan semanal completo con sus platos asignados (Transaccional) | `201 Created` / `400` |
| `GET` | `/plans` | Lista todos los planes registrados con desglose de días y platos | `200 OK` |
| `GET` | `/plans/{plan_id}` | Obtiene un plan semanal específico por su ID | `200 OK` / `404` |
| `PUT` | `/plans/{plan_id}` | Actualiza un plan y reemplaza de forma atómica sus asignaciones | `200 OK` / `400` / `404` |
| `DELETE` | `/plans/{plan_id}` | Elimina un plan y borra en cascada sus items | `200 OK` / `404` |

---

## 🔮 Próximos Pasos (Roadmap)

* [ ] Integración de Asistente de IA (OpenAI / Gemini) para generación automática de planes semanales basados en lenguaje natural.
* [ ] Generación automática de listas de la compra agregando los ingredientes registrados en `meal_ingredients` para los planes activos.
* [ ] Autenticación y autorización de usuarios mediante JWT (*JSON Web Tokens*).
