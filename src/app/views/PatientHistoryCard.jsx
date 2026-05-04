import React, { useMemo, useState } from 'react'
import { Badge, Card, Divider, SectionTitle } from '../ui/components'

function fmtDate(x) {
  if (!x) return '—'
  try {
    return new Date(x).toLocaleString()
  } catch {
    return '—'
  }
}

export function PatientHistoryCard({ carePlans, logs }) {
  const [openPlanIds, setOpenPlanIds] = useState(() => new Set())

  const medicationHistory = useMemo(() => {
    const items = []
    for (const l of logs || []) {
      for (const m of l?.medsGiven || []) {
        if (!m?.name) continue
        items.push({
          name: m.name,
          time: m.time || '',
          date: l?.timestamp,
        })
      }
    }
    return items.slice(0, 10)
  }, [logs])

  const dailySummary = useMemo(() => {
    const latest = (logs || [])[0]
    if (!latest) return null
    return {
      timestamp: latest.timestamp,
      vitals: latest.vitals,
      notes: latest.observations,
      caregiver: latest.caregiverSignature,
    }
  }, [logs])

  const observationsTrend = useMemo(() => {
    return (logs || [])
      .filter((l) => Boolean(l?.observations))
      .slice(0, 5)
      .map((l) => ({ timestamp: l.timestamp, text: l.observations }))
  }, [logs])

  const hasAny = (carePlans && carePlans.length > 0) || (logs && logs.length > 0)

  return (
    <Card>
      <SectionTitle title="Patient Care History" subtitle="Read-only history of care plans and recent care activity." />

      {!hasAny ? <div className="text-sm text-ink-500">No history available yet</div> : null}

      {carePlans && carePlans.length > 0 ? (
        <div>
          <div className="text-sm font-semibold text-ink-900">1. Care Plan History</div>
          <div className="mt-2 space-y-2">
            {carePlans.map((p) => {
              const overview = p.patientOverview || {}
              const isOpen = openPlanIds.has(p.id)
              return (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-surface-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-ink-900">{fmtDate(p.createdAt)}</div>
                      <div className="mt-1 text-xs text-ink-500">
                        <span className="font-semibold text-ink-700">{overview.condition || '—'}</span> • {overview.mobilityLevel || '—'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50"
                      onClick={() => {
                        setOpenPlanIds((prev) => {
                          const next = new Set(prev)
                          if (next.has(p.id)) next.delete(p.id)
                          else next.add(p.id)
                          return next
                        })
                      }}
                    >
                      {isOpen ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>

                  {isOpen ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-ink-700">Patient</div>
                        <div className="mt-1 text-sm text-ink-900">{overview.patientName || '—'}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-500">
                          <Badge>{overview.condition || '—'}</Badge>
                          <Badge>{overview.mobilityLevel || '—'}</Badge>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-ink-700">Medication Plan (count)</div>
                        <div className="mt-1 text-sm text-ink-900">{(p.medicationPlan || []).length}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div>
          <div className="text-sm font-semibold text-ink-900">1. Care Plan History</div>
          <div className="mt-2 text-sm text-ink-500">No history available yet</div>
        </div>
      )}

      <Divider />

      <div>
        <div className="text-sm font-semibold text-ink-900">2. Medication History</div>
        {medicationHistory.length === 0 ? (
          <div className="mt-2 text-sm text-ink-500">No history available yet</div>
        ) : (
          <div className="mt-2 space-y-2">
            {medicationHistory.map((m, idx) => (
              <div key={`${m.name}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-ink-900">{m.name}</div>
                  <div className="text-xs text-ink-500">{fmtDate(m.date)}</div>
                </div>
                <div className="mt-1 text-xs text-ink-500">Time administered: {m.time || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Divider />

      <div>
        <div className="text-sm font-semibold text-ink-900">3. Daily Logs Summary</div>
        {!dailySummary ? (
          <div className="mt-2 text-sm text-ink-500">No history available yet</div>
        ) : (
          <div className="mt-2 rounded-xl border border-slate-200 bg-surface-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-ink-900">{fmtDate(dailySummary.timestamp)}</div>
              {dailySummary.caregiver ? <Badge>{dailySummary.caregiver}</Badge> : null}
            </div>
            {dailySummary.vitals ? (
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-500">
                {dailySummary.vitals.heartRate != null ? <Badge>HR {dailySummary.vitals.heartRate}</Badge> : null}
                {dailySummary.vitals.systolicBP != null ? (
                  <Badge>
                    BP {dailySummary.vitals.systolicBP}/{dailySummary.vitals.diastolicBP ?? '—'}
                  </Badge>
                ) : null}
                {dailySummary.vitals.temperatureC != null ? <Badge>Temp {dailySummary.vitals.temperatureC}°C</Badge> : null}
                {dailySummary.vitals.spo2 != null ? <Badge>SpO₂ {dailySummary.vitals.spo2}%</Badge> : null}
              </div>
            ) : null}
            {dailySummary.notes ? <div className="mt-2 text-sm text-ink-700">{dailySummary.notes}</div> : null}
          </div>
        )}
      </div>

      <Divider />

      <div>
        <div className="text-sm font-semibold text-ink-900">4. Observations Trend (Simple)</div>
        {observationsTrend.length === 0 ? (
          <div className="mt-2 text-sm text-ink-500">No history available yet</div>
        ) : (
          <div className="mt-2 space-y-2">
            {observationsTrend.map((o, idx) => (
              <div key={`${o.timestamp || 't'}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs font-semibold text-ink-700">{fmtDate(o.timestamp)}</div>
                <div className="mt-1 text-sm text-ink-700">{o.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

