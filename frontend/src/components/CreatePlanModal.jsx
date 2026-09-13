import React, { useState } from 'react';
import api from '../api/axios';
import { X, CalendarPlus } from 'lucide-react';

export default function CreatePlanModal({ isOpen, onClose, onPlanCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);

    // Mandamos la estructura básica para cumplir la regla min_length: 1 del backend
    const payload = {
      name: name.trim(),
      description: description.trim(),
      items: [
        {
          day: "Lunes",
          day_of_week: "Lunes",
          meal_type: "Almuerzo",
          meal_id: 1,
          name: "Plato de bienvenida"
        }
      ]
    };

    api.post('/plans', payload)
      .then((res) => {
        setLoading(false);
        setName('');
        setDescription('');
        onPlanCreated(res.data);
        onClose();
      })
      .catch((err) => {
        console.error("Error al crear el plan:", err.response?.data || err);
        setLoading(false);
        alert("Ocurrió un error al crear el plan.");
      });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-emerald-600" />
            Crear Nuevo Plan Semanal
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Nombre del Plan
            </label>
            <input
              type="text"
              placeholder="Ej: Plan Definición Proteica"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Descripción (Opcional)
            </label>
            <textarea
              placeholder="Ej: Menú enfocado en déficit calórico con alta proteína."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
            />
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
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creando...' : 'Crear Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}