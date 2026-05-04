import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Card, SectionTitle, Badge } from '../ui/components'
import { api } from '../../utils/api'

export const AnalyticsPage = observer(({ store }) => {
  const { auth } = store
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setError('')
      try {
        const res = await api.analyticsOverview(auth.token)
        if (!active) return
        setData(res)
      } catch (e) {
        if (!active) return
        setError(e?.response?.data?.error || 'Failed to load analytics')
      }
    }
    load()
    return () => {
      active = false
    }
  }, [auth.token])

  return (
    <div className="space-y-4">
      <SectionTitle title="System Performance" subtitle="Patient progress summaries, caregiver activity, and compliance signals." />

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric title="Patients" value={data?.patientCount ?? '—'} />
        <Metric title="Care logs (total)" value={data?.careLogCount ?? '—'} />
        <Metric
          title="Medication adherence insight (7d)"
          value={
            data
              ? `${data.medicationAdherenceInsight.logsWithMedicationRecordedLast7d}/${data.medicationAdherenceInsight.totalLogsLast7d}`
              : '—'
          }
        />
      </div>

      <Card>
        <SectionTitle title="Caregiver activity (top 10, last 7 days)" subtitle="Operational signal for workload and documentation cadence." />
        <div className="flex flex-wrap gap-2">
          {(data?.caregiverActivityTop || []).map((x) => (
            <Badge key={x.caregiverId}>
              {x.caregiverId.slice(0, 6)}… • {x.logsLast7d} logs
            </Badge>
          ))}
          {(data?.caregiverActivityTop || []).length === 0 ? <div className="text-sm text-ink-500">No data yet.</div> : null}
        </div>
      </Card>
    </div>
  )
})

function Metric({ title, value }) {
  return (
    <Card>
      <div className="text-xs font-semibold text-ink-700">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-ink-900">{value}</div>
    </Card>
  )
}

