import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useLayoutEffect, useState } from 'react';
import NProgress from 'nprogress';
import * as LucideIcons from 'lucide-react';
import { MENU, ROLES } from '../constants/rbac.js';
import { useAuth } from '../context/AuthContext.jsx';
import logoPoltek from '../assets/logo-poltek.jpg';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mobileNavRef = useRef(null);
  const profileRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      groups.push({ group: item.group, items: [], icon: item.icon });
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
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm p-1">
                <img src={logoPoltek} alt="Politeknik Sukabumi" className="w-full h-full object-contain" />
              </div>
              <div className="block">
                <p className="text-lg font-bold leading-tight tracking-tight text-white">LMS Poltek</p>
                <p className="text-[11px] font-medium text-sky-200 tracking-wider uppercase">Sukabumi</p>
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
                        {(() => {
                          const Icon = item.icon ? LucideIcons[item.icon] : null;
                          return (
                            <span className="flex items-center gap-2">
                              {Icon && <Icon className="w-4 h-4" />}
                              {item.label}
                            </span>
                          );
                        })()}
                      </NavLink>
                    ))
                  ) : ['Data Master', 'Perkuliahan', 'Ruang Diskusi'].includes(g.group) ? (
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
                      {(() => {
                        const Icon = g.icon ? LucideIcons[g.icon] : null;
                        return (
                          <span className="flex items-center gap-2">
                            {Icon && <Icon className="w-4 h-4" />}
                            {g.group}
                          </span>
                        );
                      })()}
                    </NavLink>
                  ) : null}
                </div>
              ))}
            </nav>

            {/* Right: User Profile & Actions */}
            <div className="flex items-center gap-4">
              <div className="relative group flex items-center h-full pl-3" ref={profileRef}>
                <button 
                  className="flex items-center gap-3 outline-none text-left"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
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
                <div className={`absolute top-[50px] right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl shadow-slate-400/40 border-t-4 border-t-orange-500 border border-slate-200 py-2 transition-all transform origin-top z-50 ${isProfileOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95 group-hover:opacity-100 group-hover:visible group-hover:scale-100'}`}>
                  {validGroups.find(g => g.group === 'Lainnya')?.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsProfileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 text-sm transition-colors mx-2 rounded-lg ${
                          isActive 
                            ? 'bg-orange-50 text-orange-600 font-bold' 
                            : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
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
        {validGroups.filter(g => g.group !== 'Lainnya').flatMap(g => ['Data Master', 'Perkuliahan', 'Ruang Diskusi'].includes(g.group) ? [{ to: g.items[0]?.to || '#', label: g.group, icon: g.icon, isLayoutGroup: true, items: g.items }] : g.items).map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) => {
              const active = item.isLayoutGroup ? item.items.some(i => location.pathname.startsWith(i.to)) : isActive;
              return `${active ? 'active-nav-item bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-slate-100 text-slate-600'} whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-all`;
            }}
          >
            {(() => {
              const Icon = item.icon ? LucideIcons[item.icon] : null;
              return (
                <span className="flex items-center gap-2">
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.label}
                </span>
              );
            })()}
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
