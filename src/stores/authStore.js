import { makeAutoObservable, runInAction } from 'mobx'
import { api } from '../utils/api'

const LS_TOKEN = 'caresyncai_token'

export class AuthStore {
  token = localStorage.getItem(LS_TOKEN) || ''
  user = null
  status = this.token ? 'loading' : 'idle' // idle | loading | authed | error
  error = ''

  constructor() {
    makeAutoObservable(this)
  }

  get isAuthed() {
    return Boolean(this.token) && Boolean(this.user)
  }

  get role() {
    return this.user?.role || ''
  }

  async hydrate() {
    if (!this.token) return
    // If we already have a token but no user yet, stay in loading
    this.status = 'loading'
    this.error = ''
    try {
      const { user } = await api.getMe(this.token)
      runInAction(() => {
        this.user = user
        this.status = 'authed'
      })
    } catch (e) {
      runInAction(() => {
        this.token = ''
        localStorage.removeItem(LS_TOKEN)
        this.user = null
        this.status = 'idle'
        this.error = 'Session expired. Please sign in again.'
      })
    }
  }

  async login(email, password) {
    this.status = 'loading'
    this.error = ''
    try {
      const { token, user } = await api.login({ email, password })
      runInAction(() => {
        this.token = token
        localStorage.setItem(LS_TOKEN, token)
        this.user = user
        this.status = 'authed'
      })
      return true
    } catch (e) {
      runInAction(() => {
        this.status = 'error'
        this.error = e?.response?.data?.error || 'Unable to sign in'
      })
      return false
    }
  }

  async bootstrap({ name, email, password }) {
    this.status = 'loading'
    this.error = ''
    try {
      const { token, user } = await api.bootstrap({ name, email, password })
      runInAction(() => {
        this.token = token
        localStorage.setItem(LS_TOKEN, token)
        this.user = user
        this.status = 'authed'
      })
      return true
    } catch (e) {
      runInAction(() => {
        this.status = 'error'
        this.error = e?.response?.data?.error || 'Bootstrap failed'
      })
      return false
    }
  }

  logout() {
    this.token = ''
    this.user = null
    this.status = 'idle'
    this.error = ''
    localStorage.removeItem(LS_TOKEN)
  }
}

