import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import AddMealModal from './AddMealModal';
import CreatePlanModal from './CreatePlanModal';
import { Plus, Calendar, Trash2, Utensils } from 'lucide-react';

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function WeeklyPlan() {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para controlar los Modales
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);

  // 1. Obtener la lista de todos los planes disponibles
  const fetchPlans = () => {
    api.get('/plans')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setPlans(data);
        if (data.length > 0 && (!selectedPlanId || !data.some(p => p.id === Number(selectedPlanId)))) {
          setSelectedPlanId(data[0].id);
        }
      })
      .catch((err) => console.error("Error al obtener la lista de planes:", err));
  };

  // 2. Obtener los detalles e ítems del plan seleccionado
  const fetchPlanDetail = (planId) => {
    if (!planId) return;
    setLoading(true);
    api.get(`/plans/${planId}`)
      .then((res) => {
        setPlanData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener detalle del plan:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      fetchPlanDetail(selectedPlanId);
    }
  }, [selectedPlanId]);

  const handlePlanCreated = (newPlan) => {
    fetchPlans();
    if (newPlan && newPlan.id) {
      setSelectedPlanId(newPlan.id);
    }
  };

  // 3. Borrar el plan seleccionado
  const handleDeletePlan = () => {
    if (!selectedPlanId) return;

    if (plans.length <= 1) {
      alert("Debes tener al menos un plan disponible. Crea uno nuevo antes de borrar este.");
      return;
    }

    const currentPlanName = planData?.name || 'este plan';
    if (!window.confirm(`¿Seguro que deseas eliminar permanentemente el plan "${currentPlanName}"?`)) {
      return;
    }

    api.delete(`/plans/${selectedPlanId}`)
      .then(() => {
        const remainingPlans = plans.filter((p) => p.id !== Number(selectedPlanId));
        setPlans(remainingPlans);
        if (remainingPlans.length > 0) {
          setSelectedPlanId(remainingPlans[0].id);
        } else {
          setSelectedPlanId('');
          setPlanData(null);
        }
      })
      .catch((err) => {
        console.error("Error al eliminar el plan:", err);
        alert("Ocurrió un error al intentar eliminar el plan.");
      });
  };

  const handleOpenAddMeal = (day) => {
    setSelectedDay(day);
    setIsAddMealOpen(true);
  };

  const handleDeleteItem = (itemId) => {
    if (!window.confirm("¿Seguro que deseas eliminar este plato del plan?")) return;
    
    api.delete(`/plans/${selectedPlanId}/items/${itemId}`)
      .then(() => {
        fetchPlanDetail(selectedPlanId);
      })
      .catch((err) => {
        console.error("Error al eliminar plato:", err);
        alert("No se pudo eliminar el plato.");
      });
  };

  // Agrupar ítems asignados por día de la semana
  const getItemsForDay = (dayName) => {
    if (!planData || !planData.items) return [];
    return planData.items.filter((item) => {
      const itemDay = item.day || item.day_of_week || '';
      return itemDay.toLowerCase() === dayName.toLowerCase();
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabecera con Selector de Planes, Eliminar y Botón Nuevo Plan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            {planData?.name || 'Plan Semanal'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {planData?.description || 'Gestiona la distribución de tus comidas para la semana.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="p-2 bg-transparent text-slate-800 font-semibold text-sm focus:outline-hidden transition-all cursor-pointer border-none"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleDeletePlan}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar este plan semanal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsCreatePlanOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Nuevo Plan
          </button>
        </div>
      </div>

      {/* Rejilla de Días de la Semana */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          Cargando plan semanal...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const dayItems = getItemsForDay(day);

            return (
              <div
                key={day}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <h3 className="font-bold text-slate-800 text-base">{day}</h3>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      {dayItems.length} {dayItems.length === 1 ? 'plato' : 'platos'}
                    </span>
                  </div>

                  {dayItems.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs italic">
                      Sin platos asignados
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayItems.map((item) => (
                        <div
                          key={item.id}
                          className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all"
                        >
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 block">
                              {item.meal_type || 'Almuerzo'}
                            </span>
                            <span className="text-sm font-semibold text-slate-700 block">
                              {item.meal_name || item.name || 'Plato'}
                            </span>
                            {item.calories > 0 && (
                              <span className="text-xs text-slate-400">
                                {item.calories} kcal
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all"
                            title="Eliminar plato"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleOpenAddMeal(day)}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-200 hover:border-emerald-500 text-slate-500 hover:text-emerald-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  Añadir plato
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modales */}
      <AddMealModal
        isOpen={isAddMealOpen}
        onClose={() => setIsAddMealOpen(false)}
        day={selectedDay}
        planId={selectedPlanId}
        onMealAdded={() => fetchPlanDetail(selectedPlanId)}
      />

      <CreatePlanModal
        isOpen={isCreatePlanOpen}
        onClose={() => setIsCreatePlanOpen(false)}
        onPlanCreated={handlePlanCreated}
      />
    </div>
  );
}