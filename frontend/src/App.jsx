import React, { useState } from 'react';
import { Utensils, ShoppingCart, Calendar } from 'lucide-react';
import MealsList from './components/MealsList';
import ShoppingList from './components/ShoppingList';
import WeeklyPlan from './components/WeeklyPlan'; // <-- Importación del nuevo componente

function App() {
  const [activeTab, setActiveTab] = useState('plan'); // 'plan' como pestaña por defecto

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header / Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 text-white p-2 rounded-lg">
              <Utensils className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Meal Planner AI</h1>
          </div>

          <nav className="flex space-x-2">
            <button
              onClick={() => setActiveTab('plan')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'plan'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Plan Semanal
            </button>

            <button
              onClick={() => setActiveTab('meals')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'meals'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Utensils className="w-4 h-4" />
              Platos
            </button>

            <button
              onClick={() => setActiveTab('shopping')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'shopping'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Lista de la Compra
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'plan' && <WeeklyPlan planId={1} />}
        {activeTab === 'meals' && <MealsList />}
        {activeTab === 'shopping' && <ShoppingList planId={1} />}
      </main>
    </div>
  );
}

export default App;