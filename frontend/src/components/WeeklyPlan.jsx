import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Calendar, Plus, Trash2, FolderPlus, AlertCircle } from 'lucide-react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MEAL_TYPES = ['Desayuno', 'Almuerzo', 'Guarniciones', 'Snack', 'Cena'];

const requestWeeklyPlanData = async () => {
  const [mealsRes, plansRes] = await Promise.all([
    api.get(`/meals?limit=100&_t=${Date.now()}`),
    api.get(`/plans?_t=${Date.now()}`).catch(() => ({ data: [] }))
  ]);
  return {
    meals: mealsRes.data?.meals || (Array.isArray(mealsRes.data) ? mealsRes.data : []),
    plans: Array.isArray(plansRes.data) ? plansRes.data : []
  };
};

export default function WeeklyPlan() {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [currentPlanItems, setCurrentPlanItems] = useState([]);
  const [availableMeals, setAvailableMeals] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Formulario para añadir plato al plan
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [selectedMealType, setSelectedMealType] = useState('Almuerzo');
  const [selectedMealId, setSelectedMealId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Formulario para crear un nuevo plan
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');

  // 1. Cargar planes y catálogo de comidas
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { meals: mealsList, plans: plansList } = await requestWeeklyPlanData();
      setAvailableMeals(mealsList);

      if (mealsList.length > 0) {
        setSelectedMealId(mealsList[0].meal_id || mealsList[0].id);
      }

      setPlans(plansList);
      setErrorMsg(null);

      const activePlan = plansList.find((plan) => plan.id === Number(selectedPlanId)) || plansList[0];
      setSelectedPlanId(activePlan ? activePlan.id : '');
      setCurrentPlanItems(activePlan ? activePlan.items || [] : []);

    } catch (err) {
      console.error('Error al cargar datos del plan:', err);
      setErrorMsg('No se pudieron obtener los datos. Revisa la consola o la conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    requestWeeklyPlanData()
      .then(({ meals, plans: plansList }) => {
        if (!isActive) return;
        setAvailableMeals(meals);
        if (meals.length > 0) setSelectedMealId(meals[0].meal_id || meals[0].id);
        setPlans(plansList);
        if (plansList.length > 0) {
          setSelectedPlanId(plansList[0].id);
          setCurrentPlanItems(plansList[0].items || []);
          localStorage.setItem('activeShoppingPlanId', String(plansList[0].id));
        }
        setErrorMsg(null);
      })
      .catch((err) => {
        console.error('Error al cargar datos del plan:', err);
        if (isActive) setErrorMsg('No se pudieron obtener los datos. Revisa la consola o la conexión.');
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handlePlanChange = (planId) => {
    setSelectedPlanId(planId);
    localStorage.setItem('activeShoppingPlanId', String(planId));
    const activePlan = plans.find((p) => p.id === Number(planId));
    setCurrentPlanItems(activePlan ? activePlan.items || [] : []);
  };

  // Crear nuevo Plan
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;

    try {
      const res = await api.post('/plans', {
        name: newPlanName,
        description: newPlanDesc,
        items: []
      });

      localStorage.setItem('activeShoppingPlanId', String(res.data.id));
      setShowNewPlanModal(false);
      setNewPlanName('');
      setNewPlanDesc('');
      await fetchData();
      setSelectedPlanId(res.data.id);
      setCurrentPlanItems(res.data.items || []);
    } catch (err) {
      console.error('Error al crear plan:', err);
      alert('No se pudo crear el plan');
    }
  };

  // Eliminar Plan activo
  const handleDeletePlan = async () => {
    if (!selectedPlanId) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar este plan completo?')) return;

    try {
      await api.delete(`/plans/${selectedPlanId}`);
      setSelectedPlanId('');
      await fetchData();
    } catch (err) {
      console.error('Error al eliminar plan:', err);
      alert('No se pudo eliminar el plan.');
    }
  };

  // Añadir plato al plan
  const handleAddMealToPlan = async (e) => {
    e.preventDefault();
    if (!selectedMealId || !selectedPlanId) {
      alert('Asegúrate de tener un plan seleccionado y un plato válido.');
      return;
    }

    setIsAdding(true);
    setErrorMsg(null);

    const payload = {
      plan_id: Number(selectedPlanId),
      day_of_week: selectedDay,
      meal_type: selectedMealType,
      meal_id: Number(selectedMealId),
      portions: 1
    };

    try {
      await api.post('/weekly-plan', payload);
      await fetchData();
    } catch (err) {
      console.error('Error al agregar plato:', err);
      const detail = err.response?.data?.detail;
      setErrorMsg(
        typeof detail === 'string'
          ? detail
          : detail
            ? JSON.stringify(detail)
            : err.message || 'Error al guardar el plato en el plan.'
      );
    } finally {
      setIsAdding(false);
    }
  };

  // Eliminar un plato individual
  const handleRemoveItem = async (itemId) => {
    try {
      await api.delete(`/weekly-plan/${itemId}`);
      await fetchData();
    } catch (err) {
      console.error('Error al borrar el plato del plan:', err);
      alert('No se pudo quitar el plato del plan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y Selección de Plan */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            Planificador Semanal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestiona tus planes semanales y asigna comidas a cada día.
          </p>
        </div>

        {/* Control del selector de planes */}
        <div className="flex items-center gap-2">
          {plans.length > 0 && (
            <select
              value={selectedPlanId}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowNewPlanModal(true)}
            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
            title="Crear nuevo plan"
          >
            <FolderPlus className="w-4 h-4" />
          </button>

          {selectedPlanId && (
            <button
              onClick={handleDeletePlan}
              className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
              title="Eliminar plan actual"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Modal para crear nuevo plan */}
      {showNewPlanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Crear Nuevo Plan Semanal</h3>
            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Plan</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Definición - Semana 1"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción</label>
                <input
                  type="text"
                  placeholder="ej. Plan bajo en carbohidratos"
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPlanModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  Crear Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulario para asignar platos */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-600" />
          Añadir Plato al Plan
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
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Plato del Catálogo</label>
            <select
              value={selectedMealId}
              onChange={(e) => setSelectedMealId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {availableMeals.length === 0 ? (
                <option value="">No hay platos en el catálogo</option>
              ) : (
                availableMeals.map((m) => {
                  const id = m.meal_id || m.id;
                  const name = m.meal_name || m.name;
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <button
            type="submit"
            disabled={isAdding || availableMeals.length === 0 || !selectedPlanId}
            className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 h-[38px]"
          >
            <Plus className="w-4 h-4" />
            {isAdding ? 'Añadiendo...' : 'Añadir al Plan'}
          </button>
        </form>
      </div>

      {/* Grilla Semanal */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Cargando plan semanal...</div>
      ) : !selectedPlanId ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-500 text-xs">
          No hay ningún plan seleccionado. Crea uno nuevo con el botón superior.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {DAYS.map((day) => {
            const dayMeals = currentPlanItems.filter(
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
                      Sin platos
                    </div>
                  ) : (
                    dayMeals.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs flex items-start justify-between gap-1 group hover:border-slate-200 transition-colors"
                      >
                        <div>
                          <span className="text-[9px] font-bold uppercase text-emerald-600 block">
                            {item.meal_type || 'Almuerzo'}
                          </span>
                          <span className="font-semibold text-slate-800 line-clamp-2">
                            {item.meal_name || item.name || 'Plato'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer shrink-0"
                          title="Eliminar del plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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