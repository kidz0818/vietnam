import { Outlet, NavLink } from 'react-router-dom';
import { Home, PlusCircle, MapPin, Route } from 'lucide-react';

export default function Layout() {
  return (
    <div className="flex flex-col h-screen bg-stone-50 text-stone-900 font-sans">
      <header className="bg-emerald-600 text-white p-4 shadow-md z-10">
        <h1 className="text-xl font-semibold text-center tracking-wide">VN Explorer</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-stone-200 flex justify-around items-center h-16 pb-safe z-10">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? 'text-emerald-600' : 'text-stone-400 hover:text-stone-600'
            }`
          }
        >
          <Home size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Explore</span>
        </NavLink>
        <NavLink
          to="/plan"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? 'text-emerald-600' : 'text-stone-400 hover:text-stone-600'
            }`
          }
        >
          <Route size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Plan</span>
        </NavLink>
        <NavLink
          to="/add"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? 'text-emerald-600' : 'text-stone-400 hover:text-stone-600'
            }`
          }
        >
          <PlusCircle size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Add Place</span>
        </NavLink>
      </nav>
    </div>
  );
}
