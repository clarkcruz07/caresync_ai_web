import React, { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Link } from 'react-router-dom'
import { Button, Card, Input, SectionTitle, Badge } from '../ui/components'
import { Roles } from '../roles'
import { api } from '../../utils/api'
import { MultiSelectCaregivers } from '../widgets/MultiSelectCaregivers'

export const PatientListPage = observer(({ store }) => {
  const { auth, patients } = store
  const [q, setQ] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    patients.loadPatients()
  }, [patients])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return patients.patients
    return patients.patients.filter((p) => (p.name || '').toLowerCase().includes(needle) || (p.condition || '').toLowerCase().includes(needle))
  }, [patients.patients, q])

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Patients"
        subtitle={auth.role === Roles.FAMILY_MEMBER ? 'Read-only access for assigned patient(s).' : 'Manage care plans, logs, and assignments by role.'}
        right={
          auth.role === Roles.SUPER_ADMIN || auth.role === Roles.CARE_TEAM_LEADER ? (
            <Button variant="ghost" onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? 'Close' : 'New patient'}
            </Button>
          ) : null
        }
      />

      {showCreate ? <CreatePatientCard store={store} onCreated={() => { setShowCreate(false); patients.loadPatients() }} /> : null}

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input placeholder="Search by name or condition…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Badge>{filtered.length} total</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((p) => (
          <Link
          key={p.id}
          className="rounded-xl px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100"
          to={`/patients/${p.id}`}
        >
          <Card key={p.id} className="p-0">
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-base font-semibold text-ink-900">{p.name}</div>
                  <div className="mt-1 text-sm text-ink-500">
                    <span className="font-semibold text-ink-700">{p.condition}</span> • {p.mobility}
                  </div>
                </div>
                
                
              </div>
            </div>
          </Card>
          </Link>
        ))}
      </div>
    </div>
  )
})

const CreatePatientCard = observer(({ store, onCreated }) => {
  const { auth } = store
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [condition, setCondition] = useState('')
  const [mobility, setMobility] = useState('Independent')
  const [selectedCaregivers, setSelectedCaregivers] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function create() {
    setBusy(true)
    setError('')
    try {
      await api.createPatient(auth.token, {
        name,
        DOB: dob,
        condition,
        mobility,
        assignedCaregiverIds: selectedCaregivers.map((c) => c.id),
      })
      onCreated?.()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create patient')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <SectionTitle title="New patient" subtitle="Create a patient record (Team Leader / Super Admin)." />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-semibold text-ink-700">Patient name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-ink-700">Date of birth</div>
          <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-ink-700">Condition</div>
          <Input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="e.g., Dementia" />
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-ink-700">Mobility</div>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-soft outline-none focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
            value={mobility}
            onChange={(e) => setMobility(e.target.value)}
          >
            <option>Independent</option>
            <option>Limited</option>
            <option>Bedridden</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 text-xs font-semibold text-ink-700">Assign caregivers (searchable multi-select)</div>
        <MultiSelectCaregivers token={auth.token} value={selectedCaregivers} onChange={setSelectedCaregivers} />
      </div>

      {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div> : null}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={create} disabled={busy || !name || !dob || !condition}>
          {busy ? 'Creating…' : 'Create patient'}
        </Button>
      </div>
    </Card>
  )
})

