import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ShoppingBag, Plus, Trash2, CheckCircle2, Circle, RefreshCw, Copy, Check } from 'lucide-react';

export default function ShoppingList() {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('1');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // 1. Cargar la lista de planes al entrar
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get(`/plans?_t=${Date.now()}`);
        const plansList = Array.isArray(res.data) ? res.data : [];
        setPlans(plansList);

        const savedPlanId = localStorage.getItem('activeShoppingPlanId');
        if (savedPlanId && plansList.some((p) => p.id === Number(savedPlanId))) {
          setSelectedPlanId(savedPlanId);
        } else if (plansList.length > 0) {
          setSelectedPlanId(plansList[0].id);
        }
      } catch (err) {
        console.error('Error al obtener planes:', err);
      }
    };
    fetchPlans();
  }, []);

  // 2. Cargar ingredientes del plan + ítems manuales
  const fetchShoppingList = async (planId) => {
    if (!planId) return;
    setLoading(true);
    try {
      const res = await api.get(`/plans/${planId}/shopping-list`);
      const backendItems = (res.data?.items || []).map((item, idx) => ({
        id: `auto-${idx}-${item.ingredient}`,
        name: item.ingredient,
        amount: `${item.total_amount} ${item.unit}`,
        completed: false,
        isCustom: false
      }));

      const localCustomItems = JSON.parse(
        localStorage.getItem(`custom_shopping_items_${planId}`) || '[]'
      );

      setItems([...backendItems, ...localCustomItems]);
    } catch (err) {
      console.error('Error al cargar la lista de la compra:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPlanId) {
      localStorage.setItem('activeShoppingPlanId', selectedPlanId);
      fetchShoppingList(selectedPlanId);
    }
  }, [selectedPlanId]);

  // 3. Añadir ítem extra
  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !selectedPlanId) return;

    const newItem = {
      id: `custom-${Date.now()}`,
      name: newItemName.trim(),
      amount: newItemAmount.trim() || '1 ud',
      completed: false,
      isCustom: true
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);

    const customItems = updatedItems.filter((i) => i.isCustom);
    localStorage.setItem(`custom_shopping_items_${selectedPlanId}`, JSON.stringify(customItems));

    setNewItemName('');
    setNewItemAmount('1');
  };

  // 4. Marcar/Desmarcar
  const toggleItem = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  // 5. Eliminar elemento
  const removeItem = (id) => {
    const updatedItems = items.filter((item) => item.id !== id);
    setItems(updatedItems);

    if (selectedPlanId) {
      const customItems = updatedItems.filter((i) => i.isCustom);
      localStorage.setItem(`custom_shopping_items_${selectedPlanId}`, JSON.stringify(customItems));
    }
  };

  // 6. Copiar lista al portapapeles en formato texto limpio
  const handleCopyList = async () => {
    if (items.length === 0) return;

    const currentPlan = plans.find((p) => p.id === Number(selectedPlanId));
    const planName = currentPlan ? currentPlan.name : 'Plan Semanal';

    // Generar texto estructurado
    let formattedText = `🛒 Lista de la Compra - ${planName}\n\n`;

    const pendingItems = items.filter((i) => !i.completed);
    const completedItems = items.filter((i) => i.completed);

    if (pendingItems.length > 0) {
      formattedText += `Pendientes:\n`;
      pendingItems.forEach((item) => {
        formattedText += `▫️ ${item.name} (${item.amount})\n`;
      });
    }

    if (completedItems.length > 0) {
      formattedText += `\nComprados:\n`;
      completedItems.forEach((item) => {
        formattedText += `✅ ${item.name} (${item.amount})\n`;
      });
    }

    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
      alert('No se pudo copiar automáticamente. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Cabecera y Selector de Plan */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-600" />
            Lista de la Compra
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ingredientes automáticos del plan + tus artículos personalizados.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {plans.length > 0 && (
            <>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => fetchShoppingList(selectedPlanId)}
                className="p-2 text-slate-500 hover:text-emerald-600 bg-slate-50 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Recargar lista"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}

          {/* BOTÓN COPIAR */}
          <button
            onClick={handleCopyList}
            disabled={items.length === 0}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              copied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 disabled:opacity-50'
            }`}
            title="Copiar lista para enviar por mensaje"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Formulario para añadir artículos personalizados */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Añadir artículo extra (Hogar, limpieza, otros)
        </h3>
        <form onSubmit={handleAddCustomItem} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="ej. Esponja para el baño, Papel de cocina..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="text"
            placeholder="Cantidad (ej. 2 ud)"
            value={newItemAmount}
            onChange={(e) => setNewItemAmount(e.target.value)}
            className="w-full sm:w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!selectedPlanId || !newItemName.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Añadir
          </button>
        </form>
      </div>

      {/* Lista de elementos */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Cargando ingredientes...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No hay elementos en esta lista de la compra.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  item.completed
                    ? 'bg-slate-50 border-slate-100 opacity-60'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div
                  onClick={() => toggleItem(item.id)}
                  className="flex items-center gap-3 cursor-pointer select-none flex-1"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                  )}
                  <span
                    className={`text-xs font-semibold capitalize ${
                      item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {item.name}
                  </span>
                  {item.isCustom && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md">
                      Extra
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {item.amount}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-slate-300 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                    title="Eliminar ítem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}