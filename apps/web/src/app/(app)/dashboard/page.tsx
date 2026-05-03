'use client'

import { useDashboard } from '@/hooks/use-dashboard'
import type { ApplicationStatus } from '@/lib/types'
import { format } from 'date-fns'
import { Calendar, TrendingUp, Inbox, Award } from 'lucide-react'

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

const ACTIVE_STATUSES: ApplicationStatus[] = [
  'APPLIED', 'PHONE', 'TECHNICAL', 'ONSITE', 'OFFER',
]

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard()

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Your job search at a glance
        </p>
      </div>

      {isLoading && (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      )}

      {isError && (
        <div style={{ color: 'var(--danger)', fontSize: 14 }}>
          Failed to load dashboard data. Check your connection and refresh.
        </div>
      )}

      {data && (
        <>
          {/* Stat cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 14,
              marginBottom: 28,
            }}
          >
            <StatCard
              icon={<Inbox size={18} />}
              label="Total applied"
              value={data.totalApplied}
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              label="Active"
              value={data.activeCount}
            />
            <StatCard
              icon={<Award size={18} />}
              label="Offers"
              value={data.offerCount}
              highlight
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              label="Response rate"
              value={`${data.responseRate.toFixed(0)}%`}
            />
            {data.avgDaysToOffer != null && (
              <StatCard
                icon={<Calendar size={18} />}
                label="Avg. days to offer"
                value={data.avgDaysToOffer.toFixed(0)}
              />
            )}
          </div>

          {/* Status breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
            <Section title="Active pipeline">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ACTIVE_STATUSES.map(s => {
                  const count = data.byStatus[s] ?? 0
                  const max = data.totalApplied || 1
                  return (
                    <div key={s}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{STATUS_LABEL[s]}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{count}</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${(count / max) * 100}%`,
                            background: 'var(--primary)',
                            borderRadius: 2,
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>

            {/* Upcoming interviews */}
            <Section title="Upcoming interviews">
              {data.upcomingInterviews.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
                  No upcoming interviews
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.upcomingInterviews.slice(0, 5).map(iv => (
                    <div
                      key={iv.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                          {iv.company}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {iv.type} · {iv.role}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {format(new Date(iv.scheduledAt), 'MMM d')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div
      style={{
        background: highlight ? 'var(--primary-subtle)' : 'var(--surface)',
        border: `1px solid ${highlight ? 'var(--primary-border)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
      }}
    >
      <div style={{ color: highlight ? 'var(--primary)' : 'var(--text-muted)', marginBottom: 8 }}>
        {icon}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: highlight ? 'var(--primary)' : 'var(--text)',
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '18px 20px',
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: 16,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}
