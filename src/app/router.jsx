import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { Roles, RoleHomes } from './roles'
import { AppShell } from './ui/AppShell'
import { LoginPage } from './views/LoginPage'
import { BootstrapPage } from './views/BootstrapPage'
import { PatientListPage } from './views/PatientListPage'
import { PatientDetailPage } from './views/PatientDetailPage'
import { AnalyticsPage } from './views/AnalyticsPage'
import { UsersPage } from './views/UsersPage'

const Protected = observer(({ store, allowedRoles, children }) => {
  const { auth } = store
  if (!auth.token) return <Navigate to="/login" replace />
  if (!auth.user) {
    if (auth.status === 'loading') return <div className="min-h-dvh bg-surface-50" />
    return <Navigate to="/login" replace />
  }
  if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
    return <Navigate to={RoleHomes[auth.user.role] || '/'} replace />
  }
  return children
})

const RoleLanding = observer(({ store }) => {
  const role = store.auth.user?.role
  const to = RoleHomes[role] || '/caregiver'
  return <Navigate to={to} replace />
})

export function createAppRouter(store) {
  return createBrowserRouter([
    {
      path: '/login',
      element: <LoginPage store={store} />,
    },
    {
      path: '/bootstrap',
      element: <BootstrapPage store={store} />,
    },
    {
      path: '/',
      element: (
        <Protected store={store}>
          <AppShell store={store} />
        </Protected>
      ),
      children: [
        { index: true, element: <RoleLanding store={store} /> },

        {
          path: 'patients',
          element: <PatientListPage store={store} />,
        },

        {
          path: 'caregiver',
          element: (
            <Protected store={store} allowedRoles={[Roles.CAREGIVER]}>
              <PatientListPage store={store} />
            </Protected>
          ),
        },
        {
          path: 'leader',
          element: (
            <Protected store={store} allowedRoles={[Roles.CARE_TEAM_LEADER]}>
              <PatientListPage store={store} />
            </Protected>
          ),
        },
        {
          path: 'manager',
          element: (
            <Protected store={store} allowedRoles={[Roles.HOME_CARE_MANAGER]}>
              <AnalyticsPage store={store} />
            </Protected>
          ),
        },
        {
          path: 'admin',
          element: (
            <Protected store={store} allowedRoles={[Roles.SUPER_ADMIN]}>
              <AnalyticsPage store={store} />
            </Protected>
          ),
        },
        {
          path: 'family',
          element: (
            <Protected store={store} allowedRoles={[Roles.FAMILY_MEMBER]}>
              <PatientListPage store={store} />
            </Protected>
          ),
        },

        {
          path: 'patients/:patientId',
          element: <PatientDetailPage store={store} />,
        },
        {
          path: 'users',
          element: (
            <Protected store={store} allowedRoles={[Roles.SUPER_ADMIN, Roles.CARE_TEAM_LEADER]}>
              <UsersPage store={store} />
            </Protected>
          ),
        },
      ],
    },
  ])
}

