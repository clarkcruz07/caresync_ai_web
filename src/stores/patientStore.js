import { makeAutoObservable, runInAction } from 'mobx'
import { api } from '../utils/api'

export class PatientStore {
  auth
  patients = []
  status = 'idle'
  error = ''

  constructor(authStore) {
    this.auth = authStore
    makeAutoObservable(this)
  }

  async loadPatients() {
    if (!this.auth.token) return
    this.status = 'loading'
    this.error = ''
    try {
      const { patients } = await api.listPatients(this.auth.token)
      runInAction(() => {
        this.patients = patients
        this.status = 'ready'
      })
    } catch (e) {
      runInAction(() => {
        this.status = 'error'
        this.error = e?.response?.data?.error || 'Failed to load patients'
      })
    }
  }
}

