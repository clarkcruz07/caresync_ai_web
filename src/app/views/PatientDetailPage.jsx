import React, { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useParams } from 'react-router-dom'
import { Badge, Button, Card, Divider, Input, SectionTitle, Textarea } from '../ui/components'
import { api } from '../../utils/api'
import { Roles } from '../roles'
import { MultiSelectCaregivers } from '../widgets/MultiSelectCaregivers'
import { MultiSelectUsers } from '../widgets/MultiSelectUsers'
import { PatientHistoryCard } from './PatientHistoryCard'

export const PatientDetailPage = observer(({ store }) => {
  const { patientId } = useParams()
  const { auth } = store
  const patient = useMemo(() => store.patients.patients.find((p) => p.id === patientId), [store.patients.patients, patientId])

  const [carePlan, setCarePlan] = useState(null)
  const [logs, setLogs] = useState([])
  const [history, setHistory] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [planInputs, setPlanInputs] = useState({
    specialNeeds: '',
    allergies: 'None reported',
    medications: [],
  })

  useEffect(() => {
    store.patients.loadPatients()
  }, [store.patients])

  useEffect(() => {
    let active = true
    async function load() {
      if (!auth.token || !patientId) return
      try {
        const [planRes, logRes, histRes] = await Promise.all([
          api.getCarePlanForPatient(auth.token, patientId),
          api.listCareLogs(auth.token, patientId),
          api.listCarePlanHistory(auth.token, patientId),
        ])
        if (!active) return
        setCarePlan(planRes.carePlan)
        setLogs(logRes.logs || [])
        setHistory(histRes || null)
      } catch (e) {
        if (!active) return
        setError(e?.response?.data?.error || 'Failed to load patient details')
      }
    }
    load()
    return () => {
      active = false
    }
  }, [auth.token, patientId])

  if (!patient) {
    return (
      <Card>
        <SectionTitle title="Patient" subtitle="Loading…" />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-ink-900">{patient.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-500">
              <Badge>{patient.condition}</Badge>
              <Badge>{patient.mobility}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(auth.role === Roles.CAREGIVER || auth.role === Roles.CARE_TEAM_LEADER || auth.role === Roles.SUPER_ADMIN) ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  setBusy(true)
                  setError('')
                  try {
                    const res = await api.generateCarePlan(auth.token, {
                      patientId: patient.id,
                      patientName: patient.name,
                      condition: patient.condition,
                      mobility: patient.mobility,
                      specialNeeds: planInputs.specialNeeds || '',
                      allergies: planInputs.allergies || 'None reported',
                      medications: planInputs.medications || [],
                    })
                    setCarePlan(res.carePlan)
                  } catch (e) {
                    setError(e?.response?.data?.error || 'AI generation failed')
                  } finally {
                    setBusy(false)
                  }
                }}
                disabled={busy}
              >
                {busy ? 'Generating…' : 'Generate AI care plan'}
              </Button>
            ) : null}
          </div>
        </div>
        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div> : null}
      </Card>

      {(auth.role === Roles.CAREGIVER || auth.role === Roles.CARE_TEAM_LEADER || auth.role === Roles.SUPER_ADMIN) ? (
        <CarePlanInputCard value={planInputs} onChange={setPlanInputs} />
      ) : null}

      {(auth.role === Roles.CARE_TEAM_LEADER || auth.role === Roles.SUPER_ADMIN) ? (
        <AssignmentsCard store={store} patient={patient} onPatientRefresh={() => store.patients.loadPatients()} />
      ) : null}

      <CarePlanCard store={store} patient={patient} carePlan={carePlan} onChange={setCarePlan} />
      <CareLogCard store={store} patient={patient} logs={logs} onLogs={setLogs} />
      {history ? <PatientHistoryCard carePlans={history.carePlans || []} logs={logs || []} /> : null}
    </div>
  )
})

function CarePlanInputCard({ value, onChange }) {
  const meds = value.medications || []

  return (
    <Card>
      <SectionTitle title="Care Plan Inputs" subtitle="These details improve AI output accuracy. Medications are from the physician prescription." />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-semibold text-ink-700">Special needs</div>
          <Textarea rows={3} value={value.specialNeeds} onChange={(e) => onChange({ ...value, specialNeeds: e.target.value })} placeholder="e.g., fall risk, hearing impairment, aspiration risk, skin integrity concerns" />
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-ink-700">Allergies</div>
          <Textarea rows={3} value={value.allergies} onChange={(e) => onChange({ ...value, allergies: e.target.value })} placeholder="e.g., Penicillin, Shellfish, None reported" />
        </div>
      </div>

      <Divider />

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-ink-900">Medications</div>
          <div className="text-sm text-ink-500">Add each medication with dosage/frequency/prescriber. The AI will recommend optimal timing.</div>
        </div>
        <Button
          variant="ghost"
          onClick={() =>
            onChange({
              ...value,
              medications: [
                ...meds,
                { medicationName: '', dosage: '', frequency: '', prescribedBy: 'Physician', withFood: 'No' },
              ],
            })
          }
        >
          Add medication
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {meds.map((m, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-surface-50 p-3">
            <div className="grid gap-3 sm:grid-cols-5">
              <div className="sm:col-span-2">
                <div className="mb-1 text-xs font-semibold text-ink-700">Medication</div>
                <Input value={m.medicationName} onChange={(e) => updateMed(onChange, value, idx, { medicationName: e.target.value })} placeholder="e.g., Amlodipine" />
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-ink-700">Dosage</div>
                <Input value={m.dosage} onChange={(e) => updateMed(onChange, value, idx, { dosage: e.target.value })} placeholder="e.g., 5 mg" />
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-ink-700">Frequency</div>
                <Input value={m.frequency} onChange={(e) => updateMed(onChange, value, idx, { frequency: e.target.value })} placeholder="e.g., Once daily" />
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-ink-700">Prescribed by</div>
                <Input value={m.prescribedBy} onChange={(e) => updateMed(onChange, value, idx, { prescribedBy: e.target.value })} placeholder="Physician name" />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={m.withFood === 'Yes'}
                  onChange={(e) => updateMed(onChange, value, idx, { withFood: e.target.checked ? 'Yes' : 'No' })}
                />
                With food
              </label>
              <Button
                variant="ghost"
                onClick={() => onChange({ ...value, medications: meds.filter((_, i) => i !== idx) })}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
        {meds.length === 0 ? <div className="text-sm text-ink-500">No medications added.</div> : null}
      </div>
    </Card>
  )
}

function updateMed(onChange, value, idx, patch) {
  const meds = [...(value.medications || [])]
  meds[idx] = { ...meds[idx], ...patch }
  onChange({ ...value, medications: meds })
}

const AssignmentsCard = observer(({ store, patient, onPatientRefresh }) => {
  const { auth } = store
  const [caregivers, setCaregivers] = useState([])
  const [family, setFamily] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let active = true
    async function loadInitial() {
      try {
        const [cgRes, famRes] = await Promise.all([
          api.searchCaregivers(auth.token, ''),
          api.searchUsers(auth.token, { q: '', role: Roles.FAMILY_MEMBER }),
        ])
        if (!active) return
        const cgMap = new Map((cgRes.caregivers || []).map((u) => [u.id, u]))
        const famMap = new Map((famRes.users || []).map((u) => [u.id, u]))
        setCaregivers((patient.assignedCaregivers || []).map((id) => cgMap.get(id)).filter(Boolean))
        setFamily((patient.familyMembers || []).map((id) => famMap.get(id)).filter(Boolean))
      } catch {
        // ignore
      }
    }
    loadInitial()
    return () => {
      active = false
    }
  }, [auth.token, patient.id])

  return (
    <Card>
      <SectionTitle title="Assignments" subtitle="Assign patients to multiple caregivers (many-to-many) and optional family read-only access." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-semibold text-ink-700">Caregivers (searchable multi-select)</div>
          <MultiSelectCaregivers token={auth.token} value={caregivers} onChange={setCaregivers} />
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-ink-700">Family members (read-only access)</div>
          <MultiSelectUsers token={auth.token} role={Roles.FAMILY_MEMBER} placeholder="Search family members by name/email…" value={family} onChange={setFamily} />
        </div>
      </div>

      {err ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div> : null}

      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={async () => {
            setBusy(true)
            setErr('')
            try {
              await api.updateAssignments(auth.token, patient.id, {
                assignedCaregiverIds: caregivers.map((c) => c.id),
                familyMemberIds: family.map((f) => f.id),
              })
              await onPatientRefresh?.()
            } catch (e) {
              setErr(e?.response?.data?.error || 'Failed to update assignments')
            } finally {
              setBusy(false)
            }
          }}
          disabled={busy}
        >
          {busy ? 'Saving…' : 'Save assignments'}
        </Button>
      </div>
    </Card>
  )
})

const CarePlanCard = observer(({ store, patient, carePlan, onChange }) => {
  const { auth } = store
  const isEditor = auth.role === Roles.CARE_TEAM_LEADER || auth.role === Roles.SUPER_ADMIN
  const [scheduleDraft, setScheduleDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState({
    overview: true,
    clinical: true,
    schedule: true,
    meds: true,
    vitals: false,
    nutrition: false,
    mobility: false,
    safety: false,
    cognitive: false,
    caregiver: false,
    observations: false,
    assignment: false,
    approval: false,
  })

  useEffect(() => {
    setScheduleDraft(carePlan?.medicationSchedule || null)
  }, [carePlan?.id])

  return (
    <Card>
      <SectionTitle
        title="Care Plan"
        subtitle={carePlan ? 'AI-generated plan (editable schedule). Approvals available to Team Leader / Super Admin.' : 'No care plan yet.'}
        right={
          carePlan && isEditor ? (
            <>
              <Button
                variant="ghost"
                onClick={async () => {
                  setSaving(true)
                  setErr('')
                  try {
                    await api.updateCarePlan(auth.token, carePlan.id, { medicationSchedule: scheduleDraft })
                    const refreshed = await api.getCarePlanForPatient(auth.token, patient.id)
                    onChange(refreshed.carePlan)
                  } catch (e) {
                    setErr(e?.response?.data?.error || 'Save failed')
                  } finally {
                    setSaving(false)
                  }
                }}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save schedule'}
              </Button>
              <Button
                onClick={async () => {
                  setSaving(true)
                  setErr('')
                  try {
                    await api.updateCarePlan(auth.token, carePlan.id, { approve: true })
                    const refreshed = await api.getCarePlanForPatient(auth.token, patient.id)
                    onChange(refreshed.carePlan)
                  } catch (e) {
                    setErr(e?.response?.data?.error || 'Approve failed')
                  } finally {
                    setSaving(false)
                  }
                }}
                disabled={saving}
              >
                Approve
              </Button>
            </>
          ) : null
        }
      />

      {!carePlan ? (
        <div className="text-sm text-ink-500">Generate a plan to unlock daily schedule, safety, nutrition, activities, and prescription timing recommendations.</div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Status" value={carePlan.approvedByUserId ? 'Approved' : 'Pending review'} />
          </div>

          <PlanSection
            title="1. Patient Overview"
            open={open.overview}
            onToggle={() => setOpen({ ...open, overview: !open.overview })}
            summary={`${carePlan.aiGeneratedPlan.patientOverview.patientName} • ${carePlan.aiGeneratedPlan.patientOverview.age}y • ${carePlan.aiGeneratedPlan.patientOverview.condition}`}
          >
            <KeyValueGrid
              items={[
                ['Patient Name', carePlan.aiGeneratedPlan.patientOverview.patientName],
                ['Date of Birth', carePlan.aiGeneratedPlan.patientOverview.dateOfBirth],
                ['Age', String(carePlan.aiGeneratedPlan.patientOverview.age)],
                ['Condition', carePlan.aiGeneratedPlan.patientOverview.condition],
                ['Mobility Level', carePlan.aiGeneratedPlan.patientOverview.mobilityLevel],
                ['Special Needs', carePlan.aiGeneratedPlan.patientOverview.specialNeeds],
                ['Allergies', carePlan.aiGeneratedPlan.patientOverview.allergies],
                ['Date of Report', carePlan.aiGeneratedPlan.patientOverview.dateOfReport],
              ]}
            />
          </PlanSection>

          <PlanSection
            title="2. Clinical Summary (AI Generated)"
            open={open.clinical}
            onToggle={() => setOpen({ ...open, clinical: !open.clinical })}
            summary={`${carePlan.aiGeneratedPlan.clinicalSummary.riskLevel} risk`}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Condition Summary" value={carePlan.aiGeneratedPlan.clinicalSummary.conditionSummary} />
              <Info label="Risk Level" value={carePlan.aiGeneratedPlan.clinicalSummary.riskLevel} />
              <Info label="Cognitive Status" value={carePlan.aiGeneratedPlan.clinicalSummary.cognitiveStatus} />
              <Info label="Physical Status" value={carePlan.aiGeneratedPlan.clinicalSummary.physicalStatus} />
            </div>
            <Divider />
            <BulletList title="Care Priority Notes" items={carePlan.aiGeneratedPlan.clinicalSummary.carePriorityNotes} />
          </PlanSection>

          <PlanSection
            title="3. Daily Schedule (AI Generated)"
            open={open.schedule}
            onToggle={() => setOpen({ ...open, schedule: !open.schedule })}
            summary="Morning / Afternoon / Evening"
          >
            <ScheduleBlock title="Morning" items={carePlan.aiGeneratedPlan.dailySchedule.morning} />
            <Divider />
            <ScheduleBlock title="Afternoon" items={carePlan.aiGeneratedPlan.dailySchedule.afternoon} />
            <Divider />
            <ScheduleBlock title="Evening" items={carePlan.aiGeneratedPlan.dailySchedule.evening} />
          </PlanSection>

          <PlanSection
            title="4. Medication Plan"
            open={open.meds}
            onToggle={() => setOpen({ ...open, meds: !open.meds })}
            summary={`${(scheduleDraft || carePlan.medicationSchedule || []).length} medication(s)`}
          >
            <div className="text-sm text-ink-500">
              Recommended times are AI-generated and must be reviewed clinically. This schedule is editable and stored per patient.
            </div>
            <div className="mt-3 space-y-2">
              {(scheduleDraft || carePlan.medicationSchedule || []).map((m, idx) => (
                <div key={`${m.medicationName || m.medication}-${idx}`} className="rounded-xl border border-slate-200 bg-surface-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-[220px] flex-1">
                      <div className="text-sm font-semibold text-ink-900">
                        {m.medicationName || m.medication}
                        {(m.dosage || m.dose) ? ` • ${m.dosage || m.dose}` : ''}
                        {m.frequency ? ` • ${m.frequency}` : ''}
                      </div>
                      <div className="mt-1 text-xs text-ink-500">{m.reasonForTiming || m.rationale}</div>
                      <div className="mt-1 text-xs text-ink-500">
                        With food: <span className="font-semibold text-ink-700">{m.withFood || '—'}</span>
                        {m.prescribedBy ? (
                          <>
                            {' '}
                            • Prescribed by <span className="font-semibold text-ink-700">{m.prescribedBy}</span>
                          </>
                        ) : null}
                      </div>
                      {m.sideEffectsNotes ? <div className="mt-1 text-xs text-ink-500">Side effects: {m.sideEffectsNotes}</div> : null}
                    </div>
                    <div className="min-w-[170px]">
                      <div className="mb-1 text-xs font-semibold text-ink-700">Recommended time</div>
                      <Input
                        disabled={!isEditor}
                        value={m.recommendedTime || m.suggestedTime || ''}
                        onChange={(e) => {
                          const next = [...(scheduleDraft || carePlan.medicationSchedule)]
                          next[idx] = { ...next[idx], recommendedTime: e.target.value }
                          setScheduleDraft(next)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PlanSection>

          <PlanSection
            title="5. Vital Signs Monitoring"
            open={open.vitals}
            onToggle={() => setOpen({ ...open, vitals: !open.vitals })}
            summary={carePlan.aiGeneratedPlan.vitalSignsMonitoring.measurementFrequency}
          >
            <KeyValueGrid
              items={[
                ['Blood Pressure', carePlan.aiGeneratedPlan.vitalSignsMonitoring.bloodPressure],
                ['Heart Rate', carePlan.aiGeneratedPlan.vitalSignsMonitoring.heartRate],
                ['Temperature', carePlan.aiGeneratedPlan.vitalSignsMonitoring.temperature],
                ['Weight', carePlan.aiGeneratedPlan.vitalSignsMonitoring.weight],
                ['Oxygen Saturation', carePlan.aiGeneratedPlan.vitalSignsMonitoring.oxygenSaturation],
                ['Measurement Frequency', carePlan.aiGeneratedPlan.vitalSignsMonitoring.measurementFrequency],
              ]}
            />
          </PlanSection>

          <PlanSection
            title="6. Nutrition & Hydration Plan"
            open={open.nutrition}
            onToggle={() => setOpen({ ...open, nutrition: !open.nutrition })}
            summary={`${carePlan.aiGeneratedPlan.nutritionHydrationPlan.hydrationTargetMlPerDay} ml/day`}
          >
            <KeyValueGrid
              items={[
                ['Diet Type', carePlan.aiGeneratedPlan.nutritionHydrationPlan.dietType],
                ['Meal Frequency', carePlan.aiGeneratedPlan.nutritionHydrationPlan.mealFrequency],
                ['Hydration Target (ml/day)', String(carePlan.aiGeneratedPlan.nutritionHydrationPlan.hydrationTargetMlPerDay)],
                ['Feeding Assistance Level', carePlan.aiGeneratedPlan.nutritionHydrationPlan.feedingAssistanceLevel],
              ]}
            />
            <Divider />
            <div className="grid gap-3 sm:grid-cols-2">
              <BulletList title="Recommended Foods" items={carePlan.aiGeneratedPlan.nutritionHydrationPlan.recommendedFoods} />
              <BulletList title="Foods to Avoid" items={carePlan.aiGeneratedPlan.nutritionHydrationPlan.foodsToAvoid} />
            </div>
          </PlanSection>

          <PlanSection
            title="7. Mobility & Activity Plan"
            open={open.mobility}
            onToggle={() => setOpen({ ...open, mobility: !open.mobility })}
            summary={`${carePlan.aiGeneratedPlan.mobilityActivityPlan.fallRiskLevel} fall risk`}
          >
            <KeyValueGrid
              items={[
                ['Mobility Status', carePlan.aiGeneratedPlan.mobilityActivityPlan.mobilityStatus],
                ['Transfer Assistance Level', carePlan.aiGeneratedPlan.mobilityActivityPlan.transferAssistanceLevel],
                ['Fall Risk Level', carePlan.aiGeneratedPlan.mobilityActivityPlan.fallRiskLevel],
              ]}
            />
            <Divider />
            <BulletList title="Daily Exercise Plan" items={carePlan.aiGeneratedPlan.mobilityActivityPlan.dailyExercisePlan} />
            <Divider />
            <div className="grid gap-3 sm:grid-cols-3">
              <BulletList title="Cognitive Activities" items={carePlan.aiGeneratedPlan.mobilityActivityPlan.cognitiveActivities} />
              <BulletList title="Physical Activities" items={carePlan.aiGeneratedPlan.mobilityActivityPlan.physicalActivities} />
              <BulletList title="Social Activities" items={carePlan.aiGeneratedPlan.mobilityActivityPlan.socialActivities} />
            </div>
            <Divider />
            <BulletList title="Assistive Devices Needed" items={carePlan.aiGeneratedPlan.mobilityActivityPlan.assistiveDevicesNeeded} />
          </PlanSection>

          <PlanSection
            title="8. Safety Precautions"
            open={open.safety}
            onToggle={() => setOpen({ ...open, safety: !open.safety })}
            summary={`${carePlan.aiGeneratedPlan.safetyPrecautions.wanderingRisk} wandering risk`}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <BulletList title="Home Safety Modifications" items={carePlan.aiGeneratedPlan.safetyPrecautions.homeSafetyModifications} />
              <BulletList title="Fall Prevention Measures" items={carePlan.aiGeneratedPlan.safetyPrecautions.fallPreventionMeasures} />
            </div>
            <Divider />
            <BulletList title="Emergency Instructions" items={carePlan.aiGeneratedPlan.safetyPrecautions.emergencyInstructions} />
            <Divider />
            <KeyValueGrid
              items={[
                ['Wandering Risk', carePlan.aiGeneratedPlan.safetyPrecautions.wanderingRisk],
                ['Supervision Level', carePlan.aiGeneratedPlan.safetyPrecautions.supervisionLevel],
              ]}
            />
          </PlanSection>

          <PlanSection
            title="9. Cognitive & Behavioral Support"
            open={open.cognitive}
            onToggle={() => setOpen({ ...open, cognitive: !open.cognitive })}
            summary={carePlan.aiGeneratedPlan.cognitiveBehavioralSupport.applicable ? 'Applicable' : 'Not applicable'}
          >
            <Info label="Applicable" value={carePlan.aiGeneratedPlan.cognitiveBehavioralSupport.applicable ? 'Yes' : 'No'} />
            <Divider />
            <div className="grid gap-3 sm:grid-cols-2">
              <BulletList title="Orientation Cues" items={carePlan.aiGeneratedPlan.cognitiveBehavioralSupport.orientationCues} />
              <BulletList title="Memory Support Strategies" items={carePlan.aiGeneratedPlan.cognitiveBehavioralSupport.memorySupportStrategies} />
              <BulletList title="Behavior Triggers" items={carePlan.aiGeneratedPlan.cognitiveBehavioralSupport.behaviorTriggers} />
              <BulletList title="Calming Techniques" items={carePlan.aiGeneratedPlan.cognitiveBehavioralSupport.calmingTechniques} />
            </div>
            <Divider />
            <BulletList title="Agitation Response Plan" items={carePlan.aiGeneratedPlan.cognitiveBehavioralSupport.agitationResponsePlan} />
          </PlanSection>

          <PlanSection
            title="10. Caregiver Instructions"
            open={open.caregiver}
            onToggle={() => setOpen({ ...open, caregiver: !open.caregiver })}
            summary="Shift guidance & escalation"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <BulletList title="Shift Instructions" items={carePlan.aiGeneratedPlan.caregiverInstructions.shiftInstructions} />
              <BulletList title="Priority Tasks" items={carePlan.aiGeneratedPlan.caregiverInstructions.priorityTasks} />
              <BulletList title="Symptoms to Monitor" items={carePlan.aiGeneratedPlan.caregiverInstructions.symptomsToMonitor} />
              <BulletList title="Reporting Guidelines" items={carePlan.aiGeneratedPlan.caregiverInstructions.reportingGuidelines} />
            </div>
          </PlanSection>

          <PlanSection
            title="11. Observations & Notes (Log Structure)"
            open={open.observations}
            onToggle={() => setOpen({ ...open, observations: !open.observations })}
            summary="What to track per shift"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <BulletList title="Mood Tracking" items={carePlan.aiGeneratedPlan.observationsNotesLogStructure.moodTracking} />
              <BulletList title="Behavior Changes" items={carePlan.aiGeneratedPlan.observationsNotesLogStructure.behaviorChanges} />
              <BulletList title="Sleep Quality" items={carePlan.aiGeneratedPlan.observationsNotesLogStructure.sleepQuality} />
              <BulletList title="Appetite Changes" items={carePlan.aiGeneratedPlan.observationsNotesLogStructure.appetiteChanges} />
            </div>
            <Divider />
            <BulletList title="Incident Reports" items={carePlan.aiGeneratedPlan.observationsNotesLogStructure.incidentReports} />
          </PlanSection>

          <PlanSection
            title="12. Care Team Assignment"
            open={open.assignment}
            onToggle={() => setOpen({ ...open, assignment: !open.assignment })}
            summary={`${carePlan.aiGeneratedPlan.careTeamAssignment.assignedCaregivers.length} caregiver(s)`}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <NameList title="Assigned Caregivers" items={carePlan.aiGeneratedPlan.careTeamAssignment.assignedCaregivers} />
              <NameList title="Care Team Leader" items={carePlan.aiGeneratedPlan.careTeamAssignment.careTeamLeader ? [carePlan.aiGeneratedPlan.careTeamAssignment.careTeamLeader] : []} />
              <NameList title="Family Viewers" items={carePlan.aiGeneratedPlan.careTeamAssignment.familyViewers} />
            </div>
          </PlanSection>

          <PlanSection
            title="13. Approval & Sign-off"
            open={open.approval}
            onToggle={() => setOpen({ ...open, approval: !open.approval })}
            summary={carePlan.approvedByUserId ? 'Approved' : 'Pending'}
          >
            <KeyValueGrid
              items={[
                ['Caregiver Signature', carePlan.aiGeneratedPlan.approvalSignOff.caregiverSignature],
                ['Care Team Leader Review', carePlan.aiGeneratedPlan.approvalSignOff.careTeamLeaderReview],
                ['Home Care Manager Approval', carePlan.aiGeneratedPlan.approvalSignOff.homeCareManagerApproval],
              ]}
            />
          </PlanSection>

          {err ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div> : null}
        </div>
      )}
    </Card>
  )
})

function PlanSection({ title, summary, open, onToggle, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 rounded-xl px-4 py-3 text-left hover:bg-slate-50"
        onClick={onToggle}
      >
        <div>
          <div className="text-sm font-semibold text-ink-900">{title}</div>
          {summary ? <div className="mt-0.5 text-xs text-ink-500">{summary}</div> : null}
        </div>
        <div className="pt-0.5 text-sm font-semibold text-ink-500">{open ? '–' : '+'}</div>
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  )
}

function KeyValueGrid({ items }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <Info key={k} label={k} value={v || '—'} />
      ))}
    </div>
  )
}

function BulletList({ title, items }) {
  const list = (items || []).filter(Boolean)
  return (
    <div className="rounded-xl border border-slate-200 bg-surface-50 p-3">
      <div className="text-xs font-semibold text-ink-700">{title}</div>
      {list.length === 0 ? (
        <div className="mt-2 text-sm text-ink-500">—</div>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-ink-900">
          {list.map((x, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-300" />
              <span className="leading-6">{x}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function NameList({ title, items }) {
  const list = (items || []).filter(Boolean)
  return (
    <div className="rounded-xl border border-slate-200 bg-surface-50 p-3">
      <div className="text-xs font-semibold text-ink-700">{title}</div>
      {list.length === 0 ? (
        <div className="mt-2 text-sm text-ink-500">—</div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {list.map((x) => (
            <Badge key={x.userId}>{x.name}</Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function ScheduleBlock({ title, items }) {
  return (
    <div>
      <div className="text-sm font-semibold text-ink-900">{title}</div>
      <div className="mt-2 space-y-2">
        {(items || []).map((it, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-surface-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-ink-900">
                {it.time} • {it.task}
              </div>
              <Badge>{it.type}</Badge>
            </div>
            <div className="mt-2 text-sm text-ink-700">{it.instructions}</div>
          </div>
        ))}
        {(!items || items.length === 0) ? <div className="text-sm text-ink-500">—</div> : null}
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-xs font-semibold text-ink-700">{label}</div>
      <div className="mt-1 text-sm text-ink-900">{value}</div>
    </div>
  )
}

const CareLogCard = observer(({ store, patient, logs, onLogs }) => {
  const { auth } = store
  const canWrite = auth.role === Roles.CAREGIVER || auth.role === Roles.CARE_TEAM_LEADER || auth.role === Roles.SUPER_ADMIN

  const [vitals, setVitals] = useState({ heartRate: '', systolicBP: '', diastolicBP: '', temperatureC: '', spo2: '' })
  const [medsGiven, setMedsGiven] = useState([])
  const [observations, setObservations] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const signature = auth.user?.name || 'Signed'

  async function submitLog() {
    setBusy(true)
    setErr('')
    try {
      await api.createCareLog(auth.token, {
        patientId: patient.id,
        vitals: {
          heartRate: vitals.heartRate ? Number(vitals.heartRate) : undefined,
          systolicBP: vitals.systolicBP ? Number(vitals.systolicBP) : undefined,
          diastolicBP: vitals.diastolicBP ? Number(vitals.diastolicBP) : undefined,
          temperatureC: vitals.temperatureC ? Number(vitals.temperatureC) : undefined,
          spo2: vitals.spo2 ? Number(vitals.spo2) : undefined,
        },
        medsGiven: (medsGiven || []).filter((m) => (m?.name || '').trim()).map((m) => ({
          name: (m.name || '').trim(),
          dose: m.dose || '',
          time: m.time || '',
          notes: m.notes || '',
        })),
        observations,
        caregiverSignature: signature,
      })
      const refreshed = await api.listCareLogs(auth.token, patient.id)
      onLogs(refreshed.logs || [])
      setObservations('')
      setMedsGiven([])
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to submit log')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <SectionTitle title="Daily Care Logs" subtitle={auth.role === Roles.FAMILY_MEMBER ? 'Summary view (read-only).' : 'Record vitals, meds, nutrition, mobility, observations, and signature.'} />

      {canWrite ? (
        <div className="rounded-xl border border-slate-200 bg-surface-50 p-4">
          <div className="grid gap-3 sm:grid-cols-5">
            <div>
              <div className="mb-1 text-xs font-semibold text-ink-700">HR</div>
              <Input value={vitals.heartRate} onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })} placeholder="bpm" />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-ink-700">SBP</div>
              <Input value={vitals.systolicBP} onChange={(e) => setVitals({ ...vitals, systolicBP: e.target.value })} placeholder="mmHg" />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-ink-700">DBP</div>
              <Input value={vitals.diastolicBP} onChange={(e) => setVitals({ ...vitals, diastolicBP: e.target.value })} placeholder="mmHg" />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-ink-700">Temp</div>
              <Input value={vitals.temperatureC} onChange={(e) => setVitals({ ...vitals, temperatureC: e.target.value })} placeholder="°C" />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-ink-700">SpO₂</div>
              <Input value={vitals.spo2} onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })} placeholder="%" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-ink-900">Medications given</div>
                <div className="text-sm text-ink-500">Optional. Record administered meds for evidence tracking.</div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setMedsGiven([...(medsGiven || []), { name: '', dose: '', time: '', notes: '' }])}
              >
                Add medication
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              {(medsGiven || []).map((m, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <div className="mb-1 text-xs font-semibold text-ink-700">Medication name</div>
                      <Input
                        value={m.name}
                        onChange={(e) => {
                          const next = [...(medsGiven || [])]
                          next[idx] = { ...next[idx], name: e.target.value }
                          setMedsGiven(next)
                        }}
                        placeholder="e.g., Amlodipine"
                      />
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-semibold text-ink-700">Dose</div>
                      <Input
                        value={m.dose}
                        onChange={(e) => {
                          const next = [...(medsGiven || [])]
                          next[idx] = { ...next[idx], dose: e.target.value }
                          setMedsGiven(next)
                        }}
                        placeholder="e.g., 5 mg"
                      />
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-semibold text-ink-700">Time</div>
                      <Input
                        value={m.time}
                        onChange={(e) => {
                          const next = [...(medsGiven || [])]
                          next[idx] = { ...next[idx], time: e.target.value }
                          setMedsGiven(next)
                        }}
                        placeholder="e.g., 08:00 AM"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                    <div className="flex-1">
                      <div className="mb-1 text-xs font-semibold text-ink-700">Notes (optional)</div>
                      <Input
                        value={m.notes}
                        onChange={(e) => {
                          const next = [...(medsGiven || [])]
                          next[idx] = { ...next[idx], notes: e.target.value }
                          setMedsGiven(next)
                        }}
                        placeholder="e.g., with food, tolerated well"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setMedsGiven((medsGiven || []).filter((_, i) => i !== idx))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              {(medsGiven || []).length === 0 ? <div className="text-sm text-ink-500">No medications recorded.</div> : null}
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1 text-xs font-semibold text-ink-700">Observations / Notes</div>
            <Textarea rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Behavioral changes, appetite, pain, mobility, skin condition, etc." />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold text-ink-700">Caregiver signature</div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink-900 shadow-soft">{signature}</div>
            </div>
            <div className="flex items-end justify-end">
              <Button onClick={submitLog} disabled={busy}>
                {busy ? 'Submitting…' : 'Submit log'}
              </Button>
            </div>
          </div>

          {err ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div> : null}
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {(logs || []).map((l) => (
          <div key={l.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-ink-900">{new Date(l.timestamp).toLocaleString()}</div>
              {l.caregiverSignature ? <Badge>Signed</Badge> : null}
            </div>
            <div className="mt-2 text-sm text-ink-700">
              {l.vitals ? (
                <div className="flex flex-wrap gap-2 text-xs text-ink-500">
                  {l.vitals.heartRate != null ? <Badge>HR {l.vitals.heartRate}</Badge> : null}
                  {l.vitals.systolicBP != null ? <Badge>BP {l.vitals.systolicBP}/{l.vitals.diastolicBP ?? '—'}</Badge> : null}
                  {l.vitals.temperatureC != null ? <Badge>Temp {l.vitals.temperatureC}°C</Badge> : null}
                  {l.vitals.spo2 != null ? <Badge>SpO₂ {l.vitals.spo2}%</Badge> : null}
                </div>
              ) : null}
              {l.observations ? <div className="mt-2 text-sm text-ink-700">{l.observations}</div> : null}
            </div>
          </div>
        ))}
        {(!logs || logs.length === 0) ? <div className="text-sm text-ink-500">No logs yet.</div> : null}
      </div>
    </Card>
  )
})

