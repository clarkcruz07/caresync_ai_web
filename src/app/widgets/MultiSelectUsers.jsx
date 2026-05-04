import React, { useEffect, useMemo, useState } from 'react'
import { Combobox } from '@headlessui/react'
import { api } from '../../utils/api'

export function MultiSelectUsers({ token, role, placeholder, value, onChange }) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    async function run() {
      setBusy(true)
      try {
        const { users } = await api.searchUsers(token, { q: query, role })
        if (!active) return
        setOptions(users)
      } finally {
        if (active) setBusy(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [token, query, role])

  const selected = value || []
  const available = useMemo(() => {
    const selectedIds = new Set(selected.map((x) => x.id))
    return options.filter((o) => !selectedIds.has(o.id))
  }, [options, selected])

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-wrap gap-2 p-2">
        {selected.map((u) => (
          <span key={u.id} className="flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
            {u.name}
            <button
              type="button"
              className="rounded-full px-1 text-brand-800 hover:bg-brand-100"
              onClick={() => onChange(selected.filter((x) => x.id !== u.id))}
              aria-label={`Remove ${u.name}`}
            >
              ×
            </button>
          </span>
        ))}

        <div className="min-w-[220px] flex-1">
          <Combobox value={null} onChange={(person) => onChange([...selected, person])}>
            <div className="relative">
              <Combobox.Input
                className="w-full border-0 bg-transparent px-2 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-300"
                placeholder={placeholder || 'Search…'}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Combobox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-card">
                {busy ? (
                  <div className="px-3 py-2 text-sm text-ink-500">Searching…</div>
                ) : available.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-ink-500">No matches</div>
                ) : (
                  available.map((person) => (
                    <Combobox.Option key={person.id} value={person} className={({ active }) => ['cursor-pointer rounded-lg px-3 py-2 text-sm', active ? 'bg-brand-50 text-brand-900' : 'text-ink-900'].join(' ')}>
                      <div className="font-semibold">{person.name}</div>
                      <div className="text-xs text-ink-500">{person.email}</div>
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>
      </div>
    </div>
  )
}

