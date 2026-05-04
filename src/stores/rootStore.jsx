import React, { createContext, useContext, useMemo } from 'react'
import { AuthStore } from './authStore'
import { PatientStore } from './patientStore'

const StoreContext = createContext(null)

export function AppStoreProvider({ children }) {
  const store = useMemo(() => {
    const auth = new AuthStore()
    const patients = new PatientStore(auth)
    return { auth, patients }
  }, [])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useRootStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('Store not available')
  return ctx
}

