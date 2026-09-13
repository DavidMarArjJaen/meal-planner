import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import CreateMealModal from './CreateMealModal';
import { Plus, Search, Utensils, Flame, Trash2 } from 'lucide-react';

const CATEGORIES = ['Todos', 'Desayuno', 'Almuerzo', 'Cena', 'Snack'];

export default function MealsList() {
  const [meals, setMeals] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

const fetchMeals = () => {
  setLoading(true);
  // Pedimos un límite más alto y agregamos timestamp para evitar caché
  api.get(`/meals?limit=100&_t=${Date.now()}`)
    .then((res) => {
      const mealsArray = res.data?.meals || (Array.isArray(res.data) ? res.data : []);
      setMeals(mealsArray);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error al obtener catálogo de platos:", err);
      setLoading(false);
    });
};

  useEffect(() => {
    fetchMeals();
  }, []);

  const handleMealCreated = (newMeal) => {
    if (newMeal) {
      setMeals((prevMeals) => [newMeal, ...prevMeals]);
    } else {
      fetchMeals();
    }
  };

  // Función para eliminar plato
  const handleDeleteMeal = async (mealId, mealName) => {
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar "${mealName}"?`);
    if (!confirmDelete) return;

    setDeletingId(mealId);
    try {
      await api.delete(`/meals/${mealId}`);
      // Eliminar de la lista local en el frontend
      setMeals((prevMeals) => prevMeals.filter((m) => (m.meal_id || m.id) !== mealId));
    } catch (err) {
      console.error('Error al eliminar plato:', err);
      alert('No se pudo eliminar el plato. Revisa si está asociado a un menú diario.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMeals = meals.filter((meal) => {
    const mealCategory = (meal.category || '').toLowerCase().trim();
    const activeCatLower = activeCategory.toLowerCase().trim();

    const matchesCategory = activeCategory === 'Todos' || mealCategory === activeCatLower;
    const mealName = meal.meal_name || meal.name || '';
    const matchesSearch = mealName.toLowerCase().includes(searchQuery.toLowerCase().trim());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-emerald-600" />
            Catálogo de Platos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Explora las recetas disponibles o añade nuevas preparaciones.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Plato
        </button>
      </div>

      {/* Buscador y Pestañas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar plato por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Listado */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          Cargando catálogo...
        </div>
      ) : filteredMeals.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
          No se encontraron platos en la categoría "{activeCategory}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeals.map((meal) => {
            const id = meal.meal_id || meal.id;
            const name = meal.meal_name || meal.name;
            const protein = meal.protein_g ?? meal.protein ?? 0;
            const carbs = meal.carbs_g ?? meal.carbs ?? 0;
            const fat = meal.fat_g ?? meal.fat ?? 0;

            return (
              <div
                key={id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      {meal.category || 'Almuerzo'}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {meal.calories > 0 && (
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          {meal.calories} kcal
                        </span>
                      )}

                      {/* Botón Borrar */}
                      <button
                        onClick={() => handleDeleteMeal(id, name)}
                        disabled={deletingId === id}
                        title="Eliminar plato"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base mb-1">
                    {name}
                  </h3>
                  {meal.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {meal.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                  <span>P: {protein}g</span>
                  <span>C: {carbs}g</span>
                  <span>G: {fat}g</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CreateMealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMealCreated={handleMealCreated}
      />
    </div>
  );
}