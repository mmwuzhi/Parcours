'use client'

import type { Application, ApplicationStatus } from '@/lib/types'
import { Briefcase, DollarSign } from 'lucide-react'

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  APPLIED:   'Applied',
  PHONE:     'Phone',
  TECHNICAL: 'Technical',
  ONSITE:    'On-site',
  OFFER:     'Offer',
  ACCEPTED:  'Accepted',
  REJECTED:  'Rejected',
  WITHDRAWN: 'Withdrawn',
}

export function ApplicationCard({
  app,
  onStatusChange,
}: {
  app: Application
  onStatusChange?: (id: string, status: ApplicationStatus) => void
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '12px 14px',
        cursor: 'default',
      }}
    >
      {/* Company + role */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
          {app.company}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 3,
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          <Briefcase size={11} />
          {app.role}
        </div>
      </div>

      {/* Salary */}
      {app.salaryRange && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: 'var(--text-muted)',
            marginBottom: 8,
          }}
        >
          <DollarSign size={11} />
          {app.salaryRange}
        </div>
      )}

      {/* Status badge */}
      <span
        className={`status-${app.status}`}
        style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 100,
        }}
      >
        {STATUS_LABEL[app.status]}
      </span>
    </div>
  )
}
