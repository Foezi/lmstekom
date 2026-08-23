import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { MENU, ROLES } from '../constants/rbac.js';
import { useAuth } from '../context/AuthContext.jsx';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = MENU.filter((m) => m.roles === 'ALL' || (Array.isArray(m.roles) && m.roles.includes(user?.role)));
  const groups = [];
  for (const item of items) {
    if (item.group) groups.push({ group: item.group, items: [] });
    else if (groups.length) groups[groups.length - 1].items.push(item);
    else groups.push({ group: null, items: [item] });
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="px-5 py-5">
          <p className="text-lg font-bold text-blue-700">LMS Poltek</p>
          <p className="text-xs text-slate-400">SimTugas · Fase 1</p>
        </div>
        <nav className="flex-1 space-y-4 px-3 pb-6">
          {groups.map((g, i) => (
            <div key={i}>
              {g.group && <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g.group}</p>}
              <div className="space-y-0.5">
                {g.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-sm ${
                        isActive ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="md:hidden font-bold text-blue-700">LMS Poltek</div>
          <div />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{user?.nama}</p>
              <p className="text-xs text-slate-400">
                {ROLES[user?.role]} · {user?.username}
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* menu mobile sederhana */}
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden">
          {items
            .filter((i) => i.to)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-1 text-xs ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
