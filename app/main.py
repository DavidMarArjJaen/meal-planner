from fastapi import FastAPI

app = FastAPI(
    title="Meal Planner AI API",
    description="API para la gestión de comidas, planes semanales y recomendaciones con IA.",
    version="0.1.0"
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "Meal Planner AI",
        "message": "Servidor FastAPI funcionando correctamente"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "environment": "development"
    }