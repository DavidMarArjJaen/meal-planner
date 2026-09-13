import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Calendar, Plus, Trash2, Utensils, AlertCircle } from 'lucide-react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MEAL_TYPES = ['Desayuno', 'Almuerzo', 'Cena', 'Snack'];

export default function WeeklyPlan() {
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [availableMeals, setAvailableMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [selectedMealType, setSelectedMealType] = useState('Almuerzo');
  const [selectedMealId, setSelectedMealId] = useState('');
  const [portions, setPortions] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // Cargar platos y plan semanal
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [mealsRes, planRes] = await Promise.all([
        api.get(`/meals?limit=100&_t=${Date.now()}`),
        // Probamos sin barra y con fallback con barra por si FastAPI la exige
        api.get(`/weekly-plan?_t=${Date.now()}`).catch(() => api.get(`/weekly-plan/?_t=${Date.now()}`))
      ]);

      // Extraer los platos
      const mealsList = mealsRes.data?.meals || (Array.isArray(mealsRes.data) ? mealsRes.data : []);
      setAvailableMeals(mealsList);

      if (mealsList.length > 0) {
        setSelectedMealId(mealsList[0].meal_id || mealsList[0].id);
      }

      // Extraer el plan
      const planList = planRes.data?.plan || planRes.data?.items || (Array.isArray(planRes.data) ? planRes.data : []);
      setWeeklyPlan(planList);

    } catch (err) {
      console.error('Error al obtener datos del plan semanal:', err);
      setErrorMsg('No se pudieron cargar los datos del plan semanal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Añadir plato al plan
  const handleAddMealToPlan = async (e) => {
    e.preventDefault();
    if (!selectedMealId) {
      alert('Selecciona un plato válido');
      return;
    }

    setIsAdding(true);
    setErrorMsg(null);

    // Schema según PlanItemCreate de tu Swagger
    const payload = {
      day_of_week: selectedDay,
      meal_type: selectedMealType,
      meal_id: Number(selectedMealId),
      portions: Number(portions) || 1
    };

    try {
      await api.post('/weekly-plan', payload);
      await fetchData(); // Recargar datos tras guardar
    } catch (err) {
      console.error('Error POST /weekly-plan:', err.response?.data || err);
      // Reintento con barra final por si FastAPI tiene redirección estricta
      try {
        await api.post('/weekly-plan/', payload);
        await fetchData();
      } catch (err2) {
        const detail = err2.response?.data?.detail;
        setErrorMsg(
          typeof detail === 'string'
            ? detail
            : JSON.stringify(detail) || 'Error al guardar el plato en el plan.'
        );
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            Planificador Semanal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Organiza tus comidas diarias asignando platos de tu catálogo.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-600" />
          Asignar Plato a la Semana
        </h3>

        <form onSubmit={handleAddMealToPlan} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Día</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Momento</label>
            <select
              value={selectedMealType}
              onChange={(e) => setSelectedMealType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Plato ({availableMeals.length} en catálogo)
            </label>
            <select
              value={selectedMealId}
              onChange={(e) => setSelectedMealId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {availableMeals.length === 0 ? (
                <option value="">No hay platos disponibles</option>
              ) : (
                availableMeals.map((m) => {
                  const id = m.meal_id || m.id;
                  const name = m.meal_name || m.name;
                  return (
                    <option key={id} value={id}>
                      {name} ({m.category || 'Sin cat.'})
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <button
            type="submit"
            disabled={isAdding || availableMeals.length === 0}
            className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 h-[38px]"
          >
            <Plus className="w-4 h-4" />
            {isAdding ? 'Guardando...' : 'Añadir al Plan'}
          </button>
        </form>
      </div>

      {/* Vista de días */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Cargando plan semanal...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {DAYS.map((day) => {
            const dayMeals = weeklyPlan.filter(
              (item) => (item.day_of_week || '').toLowerCase() === day.toLowerCase()
            );

            return (
              <div key={day} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col min-h-[220px]">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 mb-3">
                  {day}
                </h4>

                <div className="space-y-2 flex-1">
                  {dayMeals.length === 0 ? (
                    <div className="text-[11px] text-slate-400 text-center py-6 italic">
                      Sin platos asignados
                    </div>
                  ) : (
                    dayMeals.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs flex items-start justify-between gap-1"
                      >
                        <div>
                          <span className="text-[9px] font-bold uppercase text-emerald-600 block">
                            {item.meal_type || 'Almuerzo'}
                          </span>
                          <span className="font-semibold text-slate-800 line-clamp-1">
                            {item.meal_name || item.name || 'Plato'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}