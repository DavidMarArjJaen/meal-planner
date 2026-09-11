import psycopg2
from psycopg2.extras import RealDictCursor

# Credenciales de conexión a PostgreSQL
DB_CONFIG = {
    "dbname": "meal_planner",
    "user": "postgres",
    "password": "4656",
    "host": "127.0.0.1",
    "port": "5432"
}

def get_db_connection():
    """
    Crea y devuelve una nueva conexión a PostgreSQL.
    Usa RealDictCursor para que los resultados sean diccionarios.
    """
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    return conn