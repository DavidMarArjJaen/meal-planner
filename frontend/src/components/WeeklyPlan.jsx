import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Calendar, RefreshCw, AlertCircle, ChefHat } from 'lucide-react';

const DAYS_OF_WEEK = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

export default function WeeklyPlan({ planId = 1 }) {
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeeklyPlan();
  }, [planId]);

  const fetchWeeklyPlan = () => {
    setLoading(true);
    setError(null);

    // Petición al backend para obtener los detalles del plan
    api.get(`/plans/${planId}`)
      .then((response) => {
        setPlanData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar el plan semanal:", err);
        setError("No se pudo cargar el plan semanal. Asegúrate de que exista un plan con ID " + planId);
        setLoading(false);
      });
  };

  // Organiza los items del plan por días de la semana
  const getMealsForDay = (dayName) => {
  if (!planData || !planData.items) return [];
    
  return planData.items.filter((item) => {
      // Busca la propiedad sin importar si se llama 'day' o 'day_of_week'
      const itemDay = item.day || item.day_of_week || '';
      return itemDay.toString().trim().toLowerCase() === dayName.toLowerCase();
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Cargando plan semanal...</span>
      </div>
    );
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
    <div className="space-y-6">
      {/* Cabecera del Plan */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            {planData?.name || `Plan Semanal #${planId}`}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {planData?.description || 'Organización nutricional de la semana'}
          </p>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
          Activo
        </span>
      </div>

      {/* Grid de Días de la Semana */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS_OF_WEEK.map((day) => {
          const dayMeals = getMealsForDay(day);

          return (
            <div
              key={day}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Header del Día */}
              <div className="bg-slate-800 text-white px-4 py-2.5 font-bold text-sm tracking-wide flex justify-between items-center">
                <span>{day}</span>
                <span className="text-xs text-slate-400 font-normal">
                  {dayMeals.length} platos
                </span>
              </div>

              {/* Contenido del Día */}
              <div className="p-4 flex-1 space-y-3 bg-slate-50/50">
                {dayMeals.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    Sin platos asignados
                  </div>
                ) : (
                  dayMeals.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>{item.meal_type || 'Comida'}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {item.meal_name || item.meal?.name || 'Plato'}
                      </h4>
                      {item.calories && (
                        <span className="text-xs text-slate-400 mt-1 block">
                          {item.calories} kcal
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}