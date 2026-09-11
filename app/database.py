import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Carga las variables definidas en el archivo .env
load_dotenv()

def get_db_connection():
    """
    Crea y devuelve una conexión a PostgreSQL leyendo credenciales desde variables de entorno.
    """
    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        cursor_factory=RealDictCursor
    )
    return conn