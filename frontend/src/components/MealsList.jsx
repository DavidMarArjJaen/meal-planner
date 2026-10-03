import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Utensils, Plus, Trash2, Search, Edit3, X } from 'lucide-react';

const TAGS = [
  'Desayuno',
  'Comida/Cena',
  'Snack',
  'Ligero',
  'Alba'
];
const TAG_FILTERS = [
  { label: 'Todas', value: 'Todas' },
  { label: 'Desayuno', value: 'Desayuno' },
  { label: 'Comida/Cena', value: 'Comida/Cena' },
  { label: 'Picoteo', value: 'Snack' },
  { label: 'Ligero', value: 'Ligero' },
  { label: 'Alba', value: 'Alba' }
];
const TAG_LABELS = { Snack: 'Picoteo' };

const requestMeals = async () => {
  const response = await api.get(`/meals?limit=100&_t=${Date.now()}`);
  const rawList = response.data?.meals || (Array.isArray(response.data) ? response.data : []);

  return rawList.map((meal) => {
    let ingredients = [];
    if (Array.isArray(meal.ingredients)) {
      ingredients = meal.ingredients;
    } else if (typeof meal.ingredients_list === 'string' && meal.ingredients_list.trim()) {
      ingredients = meal.ingredients_list.split(',').map((name) => ({
        name: name.trim(),
        amount: '',
        unit: ''
      }));
    }
    return { ...meal, ingredients };
  });
};

export default function MealsList() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('Todas');

  // Estado del formulario
  const [showModal, setShowModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);

  const [name, setName] = useState('');
  const [tags, setTags] = useState([]);
  const [description, setDescription] = useState('');

  // Lista de ingredientes para el plato
  const [ingredients, setIngredients] = useState([]);
  const [ingName, setIngName] = useState('');
  const [ingAmount, setIngAmount] = useState('');
  const [ingUnit, setIngUnit] = useState('g');
  const [savingMeal, setSavingMeal] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Cargar platos con sanitización de tipos
  const fetchMeals = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      setMeals(await requestMeals());
    } catch (err) {
      console.error('Error al cargar platos:', err);
      setMeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    requestMeals()
      .then((loadedMeals) => {
        if (isActive) setMeals(loadedMeals);
      })
      .catch((err) => {
        console.error('Error al cargar platos:', err);
        if (isActive) setMeals([]);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  // Abrir Modal
  const handleOpenModal = (meal = null) => {
    if (meal) {
      setEditingMeal(meal);
      setName(meal.name || meal.meal_name || '');
      setDescription(meal.description || '');
      setTags(Array.isArray(meal.tags) ? meal.tags : []);

      setIngredients(Array.isArray(meal.ingredients) ? meal.ingredients : []);
    } else {
      setEditingMeal(null);
      setName('');
      setDescription('');
      setTags([]);
      setIngredients([]);
    }

    setIngName('');
    setIngAmount('');
    setIngUnit('g');
    setShowModal(true);
  };

  // Agregar ingrediente al array local
  const handleAddIngredient = () => {
    if (!ingName.trim()) return;

    const newIng = {
      name: ingName.trim(),
      amount: parseFloat(ingAmount) || 1,
      unit: ingUnit
    };

    setIngredients((current) => [...current, newIng]);
    setIngName('');
    setIngAmount('');
    setIngUnit('g');
  };

  const handleIngredientKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddIngredient();
    }
  };

  // Quitar ingrediente
  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Guardar Plato
  const handleSaveMeal = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      description: description.trim(),
      tags,
      ingredients: ingredients
    };

    setSavingMeal(true);
    setSaveError('');
    try {
      if (editingMeal) {
        const mealId = editingMeal.id || editingMeal.meal_id;
        await api.put(`/meals/${mealId}`, payload);
      } else {
        await api.post('/meals', payload);
      }
      await fetchMeals();
      setShowModal(false);
    } catch (err) {
      console.error('Error al guardar:', err.response?.data || err);
      setSaveError(err.response?.data?.detail || 'No se pudo guardar el plato. Inténtalo de nuevo.');
    } finally {
      setSavingMeal(false);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm('Se eliminará el plato y se quitará de los planes semanales donde esté asignado. ¿Continuar?')) return;
    try {
      await api.delete(`/meals/${mealId}`);
      fetchMeals();
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert(err.response?.data?.detail || 'No se pudo eliminar el plato.');
    }
  };

  const filteredMeals = meals.filter((meal) => {
    const mealName = (meal.name || meal.meal_name || '').toLowerCase();
    const matchesSearch = mealName.includes(search.toLowerCase());
    const matchesTag = selectedTag === 'Todas' || (meal.tags || []).includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-emerald-600" />
            Catálogo de Platos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Crea y gestiona tus recetas junto con sus ingredientes.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Añadir Nuevo Plato
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar plato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {TAG_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setSelectedTag(value)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                selectedTag === value
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Cargando platos...</div>
      ) : filteredMeals.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-100">
          No hay platos para mostrar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeals.map((meal) => {
            const id = meal.id || meal.meal_id;
            const mealName = meal.name || meal.meal_name;
            const ingList = Array.isArray(meal.ingredients) ? meal.ingredients : [];

            return (
              <div
                key={id}
                className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between"
              >
                <div>
                    {meal.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {meal.tags.map((tag) => (
                          <span key={tag} className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                            {TAG_LABELS[tag] || tag}
                          </span>
                        ))}
                      </div>
                    )}

                  <h3 className="font-bold text-slate-800 text-sm mb-1">{mealName}</h3>

                  {meal.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {meal.description}
                    </p>
                  )}

                  {ingList.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">
                        Ingredientes ({ingList.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {ingList.map((ing, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                          >
                            {ing.name} {ing.amount ? `(${ing.amount}${ing.unit})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-1 mt-4 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => handleOpenModal(meal)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMeal(id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {editingMeal ? 'Editar Plato' : 'Crear Nuevo Plato'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nombre del Plato *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Pechuga de Pollo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <fieldset className="sm:col-span-2">
                    <legend className="block text-xs font-semibold text-slate-600 mb-2">Etiquetas</legend>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {TAGS.map((tag) => (
                        <label key={tag} className="flex items-center gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={tags.includes(tag)}
                            onChange={() => setTags((current) => current.includes(tag)
                              ? current.filter((item) => item !== tag)
                              : [...current, tag])}
                            className="accent-emerald-600"
                          />
                          {TAG_LABELS[tag] || tag}
                        </label>
                      ))}
                    </div>
                  </fieldset>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Ingredientes
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Ingrediente (ej. Pollo)"
                    value={ingName}
                    onChange={(e) => setIngName(e.target.value)}
                    onKeyDown={handleIngredientKeyDown}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Cant."
                    value={ingAmount}
                    onChange={(e) => setIngAmount(e.target.value)}
                    onKeyDown={handleIngredientKeyDown}
                    className="w-20 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <select
                    value={ingUnit}
                    onChange={(e) => setIngUnit(e.target.value)}
                    className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="ud">ud</option>
                    <option value="cda">cda</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg"
                  >
                    +
                  </button>
                </div>

                {ingredients.length > 0 ? (
                  <div className="space-y-1.5 pt-2">
                    {ingredients.map((ing, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      >
                        <span className="font-medium text-slate-700">
                          {ing.name} — <strong className="text-emerald-600">{ing.amount} {ing.unit}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Sin ingredientes añadidos.
                  </p>
                )}
                {ingredients.length > 0 && (
                  <p className="text-[11px] text-slate-500">
                    Los ingredientes se guardan al guardar el plato.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                {saveError && (
                  <p role="alert" className="mr-auto text-xs text-rose-600">{saveError}</p>
                )}
                <button
                  type="submit"
                  disabled={savingMeal}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  {savingMeal ? 'Guardando…' : editingMeal ? 'Guardar Cambios' : 'Crear Plato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}