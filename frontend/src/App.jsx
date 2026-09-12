import React from 'react';
import { Utensils, ShoppingCart, Calendar } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-slate-100 p-8 text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <header className="flex items-center space-x-3 border-b pb-4 mb-6">
          <Utensils className="w-8 h-8 text-emerald-600" />
          <h1 className="text-2xl font-bold text-slate-900">Meal Planner AI</h1>
        </header>

        <main>
          <p className="text-lg mb-4">
            ¡Frontend configurado con éxito! 🚀
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <Calendar className="w-6 h-6 text-emerald-600 mr-3" />
              <span className="font-semibold">Planes Semanales</span>
            </div>

            <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <ShoppingCart className="w-6 h-6 text-blue-600 mr-3" />
              <span className="font-semibold">Lista de la Compra</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;