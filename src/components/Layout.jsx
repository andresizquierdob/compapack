import { NavLink, Outlet } from 'react-router-dom'

const enlaces = [
  { to: '/', label: 'Inicio' },
  { to: '/nueva', label: 'Nueva propuesta' },
  { to: '/resultados', label: 'Resultados' },
  { to: '/comparar', label: 'Comparar' },
  { to: '/referencias', label: 'Referencias de mercado' },
  { to: '/configuracion', label: 'Configuracion' },
]

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-slate-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="font-semibold text-lg whitespace-nowrap">
            CompaPack - Izquierdo HR
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {enlaces.map((enlace) => (
              <NavLink
                key={enlace.to}
                to={enlace.to}
                end={enlace.to === '/'}
                className={({ isActive }) =>
                  isActive
                    ? 'text-white font-semibold underline'
                    : 'text-slate-300 hover:text-white'
                }
              >
                {enlace.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
