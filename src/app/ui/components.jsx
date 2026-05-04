import React from 'react'

export function Card({ children, className = '' }) {
  return <div className={['rounded-xl border border-slate-200 bg-white p-4 shadow-card', className].join(' ')}>{children}</div>
}

export function SectionTitle({ title, subtitle, right }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="text-lg font-semibold text-ink-900">{title}</div>
        {subtitle ? <div className="text-sm text-ink-500">{subtitle}</div> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  )
}

export function Label({ children }) {
  return <div className="mb-1 text-xs font-semibold text-ink-700">{children}</div>
}

export function Input(props) {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-soft outline-none',
        'placeholder:text-ink-300 focus:border-brand-200 focus:ring-2 focus:ring-brand-100',
        props.className || '',
      ].join(' ')}
    />
  )
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      className={[
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-soft outline-none',
        'placeholder:text-ink-300 focus:border-brand-200 focus:ring-2 focus:ring-brand-100',
        props.className || '',
      ].join(' ')}
    />
  )
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition shadow-soft focus:outline-none focus:ring-2 focus:ring-brand-100'
  const styles =
    variant === 'primary'
      ? 'border border-brand-200 bg-brand-600 text-white hover:bg-brand-700'
      : variant === 'ghost'
        ? 'border border-slate-200 bg-white text-ink-700 hover:bg-slate-50'
        : 'border border-slate-200 bg-white text-ink-700 hover:bg-slate-50'

  return <button {...props} className={[base, styles, className].join(' ')} />
}

export function Badge({ children }) {
  return <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-ink-700">{children}</span>
}

export function Divider() {
  return <div className="my-4 h-px w-full bg-slate-200/70" />
}

