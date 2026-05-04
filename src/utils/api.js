import { http, withAuth } from './http'

export const api = {
  async login({ email, password }) {
    const res = await http.post('/api/auth/login', { email, password })
    return res.data
  },
  async bootstrap({ name, email, password }) {
    const res = await http.post('/api/auth/bootstrap', { name, email, password })
    return res.data
  },
  async getMe(token) {
    const res = await http.get('/api/auth/me', withAuth(token))
    return res.data
  },
  async createUser(token, payload) {
    const res = await http.post('/api/auth/users', payload, withAuth(token))
    return res.data
  },
  async listPatients(token) {
    const res = await http.get('/api/patients', withAuth(token))
    return res.data
  },
  async searchCaregivers(token, q) {
    const res = await http.get('/api/patients/caregivers/search', { ...withAuth(token), params: { q } })
    return res.data
  },
  async searchUsers(token, { q, role }) {
    const res = await http.get('/api/auth/users/search', { ...withAuth(token), params: { q, role } })
    return res.data
  },
  async createPatient(token, payload) {
    const res = await http.post('/api/patients', payload, withAuth(token))
    return res.data
  },
  async updateAssignments(token, patientId, payload) {
    const res = await http.patch(`/api/patients/${patientId}/assignments`, payload, withAuth(token))
    return res.data
  },
  async generateCarePlan(token, payload) {
    const res = await http.post('/api/care-plans/generate', payload, withAuth(token))
    return res.data
  },
  async getCarePlanForPatient(token, patientId) {
    const res = await http.get(`/api/care-plans/patient/${patientId}`, withAuth(token))
    return res.data
  },
  async listCarePlanHistory(token, patientId) {
    const res = await http.get(`/api/care-plans/patient/${patientId}/history`, { ...withAuth(token), params: { limit: 200 } })
    return res.data
  },
  async updateCarePlan(token, carePlanId, payload) {
    const res = await http.patch(`/api/care-plans/${carePlanId}`, payload, withAuth(token))
    return res.data
  },
  async listCareLogs(token, patientId) {
    const res = await http.get(`/api/care-logs/patient/${patientId}`, { ...withAuth(token), params: { limit: 200 } })
    return res.data
  },
  async createCareLog(token, payload) {
    const res = await http.post('/api/care-logs', payload, withAuth(token))
    return res.data
  },
  async analyticsOverview(token) {
    const res = await http.get('/api/analytics/overview', withAuth(token))
    return res.data
  },
}

