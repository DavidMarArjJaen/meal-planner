import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { X, Utensils } from 'lucide-react';

export default function AddMealModal({ isOpen, onClose, day, planId, onMealAdded }) {
  const [allMeals, setAllMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [mealType, setMealType] = useState('Almuerzo');
  const [selectedMealId, setSelectedMealId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingMeals, setFetchingMeals] = useState(true);

  // 1. Cargar todas las comidas al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setFetchingMeals(true);
      api.get('/meals')
        .then((res) => {
          const data = Array.isArray(res.data) ? res.data : (res.data.meals || []);
          setAllMeals(data);
          setFetchingMeals(false);
        })
        .catch((err) => {
          console.error("Error al cargar platos:", err);
          setFetchingMeals(false);
        });
    }
  }, [isOpen]);

  // 2. Filtrar platos cada vez que cambia el momento del día o las comidas cargadas
  useEffect(() => {
    if (allMeals.length > 0) {
      const matches = allMeals.filter((meal) => {
        const category = meal.category || meal.type || meal.meal_type || meal.momento || '';
        // Si el plato no tiene categoría definida, lo mostramos en todas por defecto
        if (!category) return true;
        return category.toLowerCase() === mealType.toLowerCase();
      });

      // Si no hay coincidencias exactas por categoría, mostramos todas para no dejar el select vacío
      const resultList = matches.length > 0 ? matches : allMeals;
      setFilteredMeals(resultList);

      // Asignar por defecto el primer id válido del filtro
      const firstMeal = resultList[0];
      const firstId = firstMeal ? (firstMeal.id || firstMeal.meal_id) : '';
      setSelectedMealId(firstId ? String(firstId) : '');
    }
  }, [mealType, allMeals]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedMealId) {
      alert("Por favor selecciona un plato de la lista.");
      return;
    }

    setLoading(true);

    const payload = {
      meal_id: parseInt(selectedMealId, 10),
      day: day,
      day_of_week: day,
      meal_type: mealType
    };

    api.post(`/plans/${planId}/items`, payload)
      .then(() => {
        setLoading(false);
        onMealAdded();
        onClose();
      })
      .catch((err) => {
        console.error("Error al añadir el plato:", err.response?.data || err);
        setLoading(false);
        alert("Ocurrió un error al asignar el plato.");
      });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-600" />
            Añadir plato al {day}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {fetchingMeals ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            Cargando catálogo de platos...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* PRIMERO: Momento del Día */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Momento del Día
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
              >
                <option value="Desayuno font-normal">Desayuno</option>
                <option value="Almuerzo font-normal">Almuerzo</option>
                <option value="Merienda font-normal">Merienda</option>
                <option value="Cena font-normal">Cena</option>
              </select>
            </div>

            {/* SEGUNDO: Plato filtrado segun el momento */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Selecciona el Plato ({filteredMeals.length} disponibles)
              </label>
              <select
                value={selectedMealId}
                onChange={(e) => setSelectedMealId(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
              >
                {filteredMeals.map((meal, index) => {
                  const mId = meal.id || meal.meal_id;
                  const mealName = meal.name || meal.meal_name || meal.title || meal.nombre || 'Plato sin nombre';
                  const calories = meal.calories || meal.calorias || 0;

                  return (
                    <option key={mId || index} value={mId}>
                      {mealName} ({calories} kcal)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || filteredMeals.length === 0}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                {loading ? 'Guardando...' : 'Asignar Plato'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}