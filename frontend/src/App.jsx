import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, ChefHat, Home, ShoppingBasket, Utensils } from 'lucide-react';
import api from './api/axios';
import MealsList from './components/MealsList';
import ShoppingList from './components/ShoppingList';
import WeeklyPlan from './components/WeeklyPlan';

const NAVIGATION = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'plan', label: 'Plan semanal', icon: CalendarDays },
  { id: 'meals', label: 'Platos', icon: Utensils },
  { id: 'shopping', label: 'Lista de la compra', icon: ShoppingBasket }
];

function HomePage({ dashboard, onNavigate }) {
  const today = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());
  const dateLabel = today.charAt(0).toUpperCase() + today.slice(1);
  const recentMeals = dashboard.meals.slice(0, 3);

  return (
    <div className="space-y-10 pb-10">
      <section className="relative isolate min-h-[390px] overflow-hidden rounded-[28px] bg-[#153b32] text-white shadow-xl shadow-emerald-950/10">
        <img
          src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1800&q=85"
          alt="Mesa con platos frescos para compartir"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[#102a25]/70" />
        <div className="grid min-h-[390px] items-center gap-10 px-6 py-9 sm:px-10 lg:grid-cols-[1.3fr_0.7fr] lg:px-14">
          <div className="max-w-2xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-lime-200">
              {dateLabel} <span className="mx-2 text-white/50">/</span> DAVILONCHO
            </p>
            <h2 className="max-w-xl font-serif text-4xl leading-tight sm:text-5xl">
              La semana sabe mejor cuando la tienes <span className="text-lime-200">a punto.</span>
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/80 sm:text-base">
              Tus platos, tu plan y la compra de la semana, en un mismo sitio.
            </p>
            <button
              onClick={() => onNavigate('plan')}
              className="mt-7 inline-flex items-center gap-3 rounded-full bg-lime-300 px-5 py-3 text-sm font-bold text-[#17382f] transition hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-200"
            >
              Ir al plan semanal
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="max-w-sm border-l border-white/30 pl-5 lg:justify-self-end">
            <div className="flex items-center gap-2 text-lime-200">
              <CalendarDays className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Plan activo</span>
            </div>
            {dashboard.loading ? (
              <p className="mt-3 text-sm text-white/70">Cargando tu semana...</p>
            ) : dashboard.activePlan ? (
              <>
                <h3 className="mt-3 font-serif text-2xl">{dashboard.activePlan.name}</h3>
                <p className="mt-2 text-sm text-white/75">
                  {dashboard.activePlan.items.length} platos organizados esta semana
                </p>
                <button
                  onClick={() => onNavigate('plan')}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
                >
                  Continuar plan <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <h3 className="mt-3 font-serif text-2xl">Una semana por estrenar</h3>
                <button
                  onClick={() => onNavigate('plan')}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
                >
                  Crear un plan <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {dashboard.error && (
        <p role="alert" className="-mt-5 text-sm text-[#92553c]">{dashboard.error}</p>
      )}

      <section className="grid gap-8 border-b border-[#dce5db] pb-8 sm:grid-cols-3">
        <button onClick={() => onNavigate('plan')} className="group flex items-center gap-4 text-left">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e3eee5] text-[#255946] transition group-hover:bg-lime-200">
            <CalendarDays className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-[#23372f]">Organizar la semana</span>
            <span className="mt-1 block text-xs text-[#718078]">{dashboard.plans.length} planes guardados</span>
          </span>
          <ArrowRight className="ml-auto h-4 w-4 text-[#8b9a91] transition group-hover:translate-x-1 group-hover:text-[#255946]" />
        </button>
        <button onClick={() => onNavigate('meals')} className="group flex items-center gap-4 text-left">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#f8e9dd] text-[#ac5c33] transition group-hover:bg-[#f4d7c3]">
            <ChefHat className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-[#23372f]">Abrir mis platos</span>
            <span className="mt-1 block text-xs text-[#718078]">{dashboard.meals.length} recetas en el catálogo</span>
          </span>
          <ArrowRight className="ml-auto h-4 w-4 text-[#8b9a91] transition group-hover:translate-x-1 group-hover:text-[#255946]" />
        </button>
        <button onClick={() => onNavigate('shopping')} className="group flex items-center gap-4 text-left">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#f4edcf] text-[#816d2c] transition group-hover:bg-[#eee2a9]">
            <ShoppingBasket className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-[#23372f]">Preparar la compra</span>
            <span className="mt-1 block text-xs text-[#718078]">Ingredientes de tu plan activo</span>
          </span>
          <ArrowRight className="ml-auto h-4 w-4 text-[#8b9a91] transition group-hover:translate-x-1 group-hover:text-[#255946]" />
        </button>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a6a44]">Del recetario</p>
            <h2 className="mt-1 font-serif text-3xl text-[#23372f]">Ideas para estos días</h2>
          </div>
          <button
            onClick={() => onNavigate('meals')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#255946] hover:text-[#17382f]"
          >
            Ver todos <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {dashboard.loading ? (
          <p className="py-8 text-sm text-[#718078]">Cargando platos...</p>
        ) : recentMeals.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentMeals.map((meal) => (
              <button
                key={meal.meal_id}
                onClick={() => onNavigate('meals')}
                className="group border-t border-[#cdd8ce] py-4 text-left transition hover:border-[#255946]"
              >
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {(meal.tags || []).slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] font-bold uppercase tracking-wide text-[#547363]">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="font-serif text-xl text-[#23372f] group-hover:text-[#255946]">{meal.meal_name}</h3>
                {meal.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#718078]">{meal.description}</p>}
              </button>
            ))}
          </div>
        ) : (
          <p className="py-8 text-sm text-[#718078]">Todavía no hay platos en el catálogo.</p>
        )}
      </section>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [dashboard, setDashboard] = useState({ loading: true, meals: [], plans: [], activePlan: null, error: null });

  useEffect(() => {
    if (activeTab !== 'home') return undefined;
    let isActive = true;
    Promise.allSettled([
      api.get('/meals?limit=100'),
      api.get('/plans')
    ]).then(([mealsResult, plansResult]) => {
      if (!isActive) return;
      const mealsResponse = mealsResult.status === 'fulfilled' ? mealsResult.value : null;
      const plansResponse = plansResult.status === 'fulfilled' ? plansResult.value : null;
      const meals = mealsResponse?.data?.meals || [];
      const plans = Array.isArray(plansResponse?.data) ? plansResponse.data : [];
      const savedPlanId = Number(localStorage.getItem('activeShoppingPlanId'));
      const activePlan = plans.find((plan) => plan.id === savedPlanId) || plans[0] || null;
      const failed = [mealsResult, plansResult].some((result) => result.status === 'rejected');
      setDashboard({
        loading: false,
        meals,
        plans,
        activePlan,
        error: failed ? 'No se pudieron cargar todos los datos. Comprueba la conexión.' : null
      });
      if (failed) console.error('No se pudieron cargar todos los datos del inicio:', mealsResult, plansResult);
    });

    return () => {
      isActive = false;
    };
  }, [activeTab]);

  const handleNavigate = (tab) => {
    if (tab === 'home') {
      setDashboard((current) => ({ ...current, loading: true, error: null }));
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f2] text-[#23372f]">
      <header className="sticky top-0 z-10 border-b border-[#e2e9e1] bg-[#f9fbf7]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <button onClick={() => handleNavigate('home')} className="flex items-center gap-3 text-left">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1d483b] text-lime-200">
              <Utensils className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-serif text-lg leading-5 text-[#20382e]">Daviloncho</span>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#829087]">Planificador de comidas</span>
            </span>
          </button>

          <nav className="flex max-w-full gap-1 overflow-x-auto" aria-label="Navegación principal">
            {NAVIGATION.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleNavigate(id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                  activeTab === id
                    ? 'bg-[#1d483b] text-white shadow-sm'
                    : 'text-[#66766d] hover:bg-[#e8eee7] hover:text-[#20382e]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {activeTab === 'home' && <HomePage dashboard={dashboard} onNavigate={handleNavigate} />}
        {activeTab === 'plan' && <WeeklyPlan />}
        {activeTab === 'meals' && <MealsList />}
        {activeTab === 'shopping' && <ShoppingList />}
      </main>
    </div>
  );
}

export default App;