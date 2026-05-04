import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import logo from '../../assets/caresync-logo.png'
import { RoleHomes, Roles } from '../roles'

export const AppShell = observer(({ store }) => {
  const { auth } = store
  const navigate = useNavigate()

  const roleHome = RoleHomes[auth.user?.role] || '/'

  return (
    <div className="min-h-dvh bg-surface-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl px-2 py-1 text-left hover:bg-slate-50"
            onClick={() => navigate(roleHome)}
          >
            <img src={logo} alt="CareSync AI" className="h-8 w-auto" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-ink-900">CareSync AI</div>
              <div className="text-xs text-ink-500">AI-Powered Caregiving Assistant</div>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 sm:inline">
              {auth.user?.role || '—'}
            </span>
            <div className="text-right">
              <div className="text-sm font-semibold text-ink-900">{auth.user?.name || ''}</div>
              <div className="text-xs text-ink-500">{auth.user?.email || ''}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                auth.logout()
                navigate('/login')
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 shadow-soft hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pb-3">
          <nav className="flex flex-wrap gap-2">
            <Tab to={roleHome} label="Home" />
            <Tab to="/patients" label="Patients" hidden={[Roles.HOME_CARE_MANAGER].includes(auth.user?.role)} />
            <Tab
              to="/manager"
              label="System Dashboard"
              hidden={!([Roles.HOME_CARE_MANAGER, Roles.SUPER_ADMIN, Roles.CARE_TEAM_LEADER].includes(auth.user?.role))}
            />
            <Tab
              to="/users"
              label="Users"
              hidden={!([Roles.SUPER_ADMIN, Roles.CARE_TEAM_LEADER].includes(auth.user?.role))}
            />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-5">
        <Outlet />
      </main>
    </div>
  )
})

function Tab({ to, label, hidden }) {
  if (hidden) return null
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'rounded-xl px-3 py-2 text-sm font-semibold transition',
          isActive
            ? 'bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-200'
            : 'text-ink-700 hover:bg-slate-50',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  )
}

