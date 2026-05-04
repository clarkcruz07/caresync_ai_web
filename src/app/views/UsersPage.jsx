import React, { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Card, Input, Label, SectionTitle, Badge } from '../ui/components'
import { Roles } from '../roles'
import { api } from '../../utils/api'

export const UsersPage = observer(({ store }) => {
  const { auth } = store
  const [q, setQ] = useState('')
  const [role, setRole] = useState(Roles.CAREGIVER)
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setError('')
      try {
        const res = await api.searchUsers(auth.token, { q, role: auth.role === Roles.CARE_TEAM_LEADER ? Roles.CAREGIVER : role })
        if (!active) return
        setUsers(res.users || [])
      } catch (e) {
        if (!active) return
        setError(e?.response?.data?.error || 'Failed to load users')
      }
    }
    load()
    return () => {
      active = false
    }
  }, [auth.token, q, role, auth.role])

  const canManageAll = auth.role === Roles.SUPER_ADMIN

  const roleOptions = useMemo(() => {
    if (!canManageAll) return [Roles.CAREGIVER]
    return [Roles.CAREGIVER, Roles.CARE_TEAM_LEADER, Roles.HOME_CARE_MANAGER, Roles.FAMILY_MEMBER, Roles.SUPER_ADMIN]
  }, [canManageAll])

  return (
    <div className="space-y-4">
      <SectionTitle title="Users & Roles" subtitle="Create caregiver profiles, set roles, and support assignments." />

      <CreateUserCard store={store} onCreated={() => api.searchUsers(auth.token, { q: '', role }).then((r) => setUsers(r.users || [])).catch(() => {})} />

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <Label>Search</Label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or email…" />
            </div>
            <div className="min-w-[220px]">
              <Label>Role filter</Label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-soft outline-none focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={!canManageAll}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {!canManageAll ? <div className="mt-1 text-xs text-ink-500">Team Leaders can manage caregivers only.</div> : null}
            </div>
          </div>
          <Badge>{users.length} results</Badge>
        </div>

        {error ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div> : null}

        <div className="mt-4 space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3">
              <div>
                <div className="text-sm font-semibold text-ink-900">{u.name}</div>
                <div className="text-xs text-ink-500">{u.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{u.role}</Badge>
              </div>
            </div>
          ))}
          {users.length === 0 ? <div className="text-sm text-ink-500">No users found.</div> : null}
        </div>
      </Card>
    </div>
  )
})

const CreateUserCard = observer(({ store, onCreated }) => {
  const { auth } = store
  const canManageAll = auth.role === Roles.SUPER_ADMIN

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(canManageAll ? Roles.CAREGIVER : Roles.CAREGIVER)
  const [address, setAddress] = useState('')
  const [contact, setContact] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const allowedRoles = canManageAll
    ? [Roles.CAREGIVER, Roles.CARE_TEAM_LEADER, Roles.HOME_CARE_MANAGER, Roles.FAMILY_MEMBER, Roles.SUPER_ADMIN]
    : [Roles.CAREGIVER]

  async function create() {
    setBusy(true)
    setError('')
    try {
      await api.createUser(auth.token, {
        name,
        email,
        password,
        role,
        caregiverProfile: role === Roles.CAREGIVER ? { address, contact } : undefined,
      })
      setName('')
      setEmail('')
      setPassword('')
      setAddress('')
      setContact('')
      onCreated?.()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create user')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <SectionTitle title="Add user" subtitle={canManageAll ? 'Create any role.' : 'Create caregiver profiles.'} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>Temporary password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 10 characters" />
        </div>
        <div>
          <Label>Role</Label>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-soft outline-none focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={!canManageAll}
          >
            {allowedRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {role === Roles.CAREGIVER ? (
          <>
            <div>
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <Label>Contact</Label>
              <Input value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
          </>
        ) : null}
      </div>

      {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div> : null}

      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={create} disabled={busy || !name || !email || password.length < 10}>
          {busy ? 'Creating…' : 'Create user'}
        </Button>
      </div>
    </Card>
  )
})

