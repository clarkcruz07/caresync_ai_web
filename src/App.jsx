import { RouterProvider } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { useEffect, useMemo } from 'react'
import { createAppRouter } from './app/router'
import { AppStoreProvider, useRootStore } from './stores/rootStore'

const AppInner = observer(() => {
  const store = useRootStore()
  const { auth } = store

  useEffect(() => {
    auth.hydrate()
  }, [auth])

  // IMPORTANT: router must be stable; recreating breaks navigation/redirects
  const router = useMemo(() => createAppRouter(store), [store])
  if (auth.token && !auth.user && auth.status === 'loading') {
    return <div className="min-h-dvh bg-surface-50" />
  }
  return <RouterProvider router={router} />
})

export default function App() {
  return (
    <AppStoreProvider>
      <AppInner />
    </AppStoreProvider>
  )
}
