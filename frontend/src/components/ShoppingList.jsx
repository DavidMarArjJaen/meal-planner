import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ShoppingCart, CheckCircle, Circle, AlertCircle, RefreshCw } from 'lucide-react';

export default function ShoppingList({ planId = 1 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedItems, setCompletedItems] = useState({});

  useEffect(() => {
    fetchShoppingList();
  }, [planId]);

  const fetchShoppingList = () => {
    setLoading(true);
    setError(null);
    
    // Petición al endpoint de la lista de la compra de FastAPI
    api.get(`/plans/${planId}/shopping-list`)
      .then((response) => {
        // Soporta respuesta en formato array o envuelta en objeto
        const data = Array.isArray(response.data)
          ? response.data
          : (response.data.items || response.data.shopping_list || []);
        
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener la lista de la compra:", err);
        setError("No se pudo cargar la lista de la compra. Verifica que exista un plan activo con ID " + planId + ".");
        setLoading(false);
      });
  };

  const toggleItem = (index) => {
    setCompletedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Consolidando lista de la compra...</span>
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-emerald-600" />
          Lista de la Compra
        </h2>
        <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
          Plan #{planId}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-slate-500 bg-white rounded-xl border border-slate-200 p-6">
          No hay ingredientes registrados en esta lista de la compra.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {items.map((item, index) => {
            const isDone = !!completedItems[index];
            return (
              <div
                key={index}
                onClick={() => toggleItem(index)}
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                  isDone ? 'bg-slate-50/60' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {isDone ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                  <span
                    className={`font-medium ${
                      isDone ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {item.ingredient || item.name || item.ingredient_name || item}
                  </span>
                </div>

                {(item.quantity || item.amount) && (
                  <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
                    {item.quantity || item.amount} {item.unit || ''}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}