import React, { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/caresync-logo.png'
import { Button, Card, Input, Label } from '../ui/components'
import { RoleHomes } from '../roles'

export const LoginPage = observer(({ store }) => {
  const { auth } = store
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    const ok = await auth.login(email, password)
    if (ok) navigate(RoleHomes[auth.user.role] || '/', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-surface-50">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
        <div className="flex items-center justify-center">
          <img src={logo} alt="CareSync AI" className="h-14 w-auto" />
        </div>

        <Card>
          <div className="mb-4">
            <div className="text-lg font-semibold text-ink-900">Sign in</div>
            <div className="text-sm text-ink-500">Secure access with role-based permissions.</div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <Label>Email</Label>
              <Input autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {auth.error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{auth.error}</div> : null}

            <Button type="submit" className="w-full" disabled={auth.status === 'loading'}>
              {auth.status === 'loading' ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>

    {/*  <div className="text-center text-sm text-ink-500">
          First-time setup? <Link className="font-semibold text-brand-700 hover:underline" to="/bootstrap">Bootstrap Super Admin</Link>
        </div> */}
      </div>
    </div>
  )
})

