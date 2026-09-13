import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Utensils, Flame, AlertCircle } from 'lucide-react';

export default function MealsList() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Petición al backend
    api.get('/meals')
      .then((response) => {
        // Soporta tanto array directo [...] como objeto { meals: [...] }
        const data = Array.isArray(response.data) 
          ? response.data 
          : (response.data.meals || []);
          
        setMeals(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar los platos:", err);
        setError("No se pudieron cargar los platos. Asegúrate de que el backend de FastAPI está corriendo.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Cargando catálogo de comidas...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 text-red-700 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Utensils className="w-5 h-5 text-emerald-600" />
        Catálogo de Platos
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meals.map((meal) => (
          <div key={meal.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-lg text-slate-900 mb-2">{meal.name}</h3>
            <p className="text-slate-600 text-sm mb-4 line-clamp-2">{meal.description || 'Sin descripción'}</p>
            
            <div className="flex items-center justify-between text-xs text-slate-500 border-t pt-3">
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <Flame className="w-4 h-4" />
                {meal.calories} kcal
              </span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                ID: {meal.id}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}