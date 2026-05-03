'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { apiFetch, ApiError } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      router.push('/applications')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error('Email already in use')
      } else {
        toast.error('Something went wrong')
      }
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>parcours</div>
        <h1 style={styles.title}>Create account</h1>
        <p style={styles.subtitle}>Start tracking your job search</p>

        <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
          <Field label="Email" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              style={styles.input}
              autoFocus
            />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <input
              {...register('password')}
              type="password"
              placeholder="Min. 8 characters"
              style={styles.input}
            />
          </Field>

          <button type="submit" disabled={isSubmitting} style={styles.button}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link href="/login" style={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 40,
  },
  brand: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--primary)',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--text)',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-muted)',
    marginBottom: 28,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: 14,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)',
    color: 'var(--text)',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: 'var(--primary)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    marginTop: 4,
  },
  footer: {
    fontSize: 13,
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
  },
  link: {
    color: 'var(--primary)',
    textDecoration: 'none',
    fontWeight: 500,
  },
} as const
