import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useLayoutEffect } from 'react';
import NProgress from 'nprogress';
import { MENU, ROLES } from '../constants/rbac.js';
import { useAuth } from '../context/AuthContext.jsx';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mobileNavRef = useRef(null);

  useLayoutEffect(() => {
    const nav = mobileNavRef.current;
    if (!nav) return;
    
    const activeEl = nav.querySelector('.active-nav-item');
    if (activeEl) {
      const scrollTarget = activeEl.offsetLeft - (nav.clientWidth / 2) + (activeEl.clientWidth / 2);
      nav.scrollLeft = scrollTarget;
    }
  }, [location.pathname]);

  useEffect(() => {
    NProgress.start();
    const timer = setTimeout(() => {
      NProgress.done();
    }, 300);
    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [location.pathname]);

  const allowedMenu = MENU.filter((m) => m.group || m.roles === 'ALL' || (Array.isArray(m.roles) && m.roles.includes(user?.role)));
  
  const groups = [];
  for (const item of allowedMenu) {
    if (item.group) {
      groups.push({ group: item.group, items: [] });
    } else {
      if (groups.length === 0) groups.push({ group: null, items: [] });
      groups[groups.length - 1].items.push(item);
    }
  }
  const validGroups = groups.filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header Navigation (Edlink Style) */}
      <header className="bg-sky-600 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Left: Logo & Branding */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-sm font-black text-sky-600 tracking-tighter">PS</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-lg font-bold leading-tight tracking-tight text-white">LMS Poltek</p>
                <p className="text-[10px] text-sky-200 uppercase tracking-widest font-semibold">Sukabumi</p>
              </div>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden md:flex items-center justify-center gap-1 flex-1 px-8 h-full">
              {validGroups.filter(g => g.group !== 'Lainnya').map((g, i) => (
                <div key={i} className="flex h-full items-center">
                  {!g.group ? (
                    g.items.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                          `flex items-center h-full px-5 text-sm font-medium transition-colors border-b-4 ${
                            isActive 
                              ? 'border-orange-500 text-white bg-sky-700/50' 
                              : 'border-transparent text-sky-100 hover:text-white hover:bg-sky-700/30'
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))
                  ) : ['Data Master', 'Perkuliahan'].includes(g.group) ? (
                    <NavLink
                      to={g.items[0]?.to || '#'}
                      className={() => {
                        const isActive = g.items.some(i => location.pathname.startsWith(i.to));
                        return `flex items-center h-full px-5 text-sm font-medium transition-colors border-b-4 ${
                          isActive 
                            ? 'border-orange-500 text-white bg-sky-700/50' 
                            : 'border-transparent text-sky-100 hover:text-white hover:bg-sky-700/30'
                        }`;
                      }}
                    >
                      {g.group}
                    </NavLink>
                  ) : null}
                </div>
              ))}
            </nav>

            {/* Right: User Profile & Actions */}
            <div className="flex items-center gap-4">
              <button className="text-sky-100 hover:text-white relative p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-sky-600"></span>
              </button>
              
              <div className="relative group flex items-center h-full border-l border-sky-500/50 pl-3">
                <button className="flex items-center gap-3 outline-none text-left">
                  <div className="hidden lg:block">
                    <p className="text-sm font-bold text-white">{user?.nickname || user?.nama}</p>
                    <p className="text-xs text-sky-200">{ROLES[user?.role]}</p>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm overflow-hidden border-2 border-sky-400 shrink-0">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sky-600 font-bold text-lg">{(user?.nickname || user?.nama)?.charAt(0)?.toUpperCase()}</span>
                    )}
                  </div>
                </button>
                
                {/* Dropdown Profil */}
                <div className="absolute top-[50px] right-0 mt-2 w-48 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top scale-95 group-hover:scale-100 z-50">
                  {validGroups.find(g => g.group === 'Lainnya')?.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 text-sm transition-colors mx-2 rounded-lg ${
                          isActive 
                            ? 'bg-sky-50 text-sky-600 font-bold' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-600'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  {validGroups.find(g => g.group === 'Lainnya')?.items.length > 0 && (
                    <div className="h-px bg-slate-100 my-2 mx-2"></div>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm transition-colors mx-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation (Scrollable horizontal) */}
      <nav ref={mobileNavRef} className="relative flex gap-2 overflow-x-auto bg-white px-4 py-3 md:hidden border-b border-slate-200 shadow-sm" style={{ scrollbarWidth: 'none' }}>
        {validGroups.filter(g => g.group !== 'Lainnya').flatMap(g => ['Data Master', 'Perkuliahan'].includes(g.group) ? [{ to: g.items[0]?.to || '#', label: g.group, isLayoutGroup: true, items: g.items }] : g.items).map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/'}
            className={() => {
              const isActive = item.isLayoutGroup 
                ? item.items.some(i => location.pathname.startsWith(i.to)) 
                : location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return `${isActive ? 'active-nav-item bg-sky-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600'} whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-all`;
            }}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Main Content Area */}
      <main key={location.pathname} className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
