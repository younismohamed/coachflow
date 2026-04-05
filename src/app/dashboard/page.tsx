import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

const coachingTypeLabels: Record<string, string> = {
  performance: 'Performance', development: 'Development', behavioral: 'Behavioral',
  goal_setting: 'Goal Setting', feedback: 'Feedback', disciplinary: 'Disciplinary', other: 'Other',
};

const typeColors: Record<string, string> = {
  performance: '#3b82f6', development: '#8b5cf6', behavioral: '#f59e0b',
  goal_setting: '#10b981', feedback: '#06b6d4', disciplinary: '#ef4444', other: '#6b7280',
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role, name').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const { data: records } = await supabase
    .from('coaching_records')
    .select(`id, status, coaching_type, created_at, employee:employees(name, email), coach:profiles(name)`)
    .order('created_at', { ascending: false });

  const total = records?.length ?? 0;
  const pending = records?.filter((r) => r.status === 'pending').length ?? 0;
  const acknowledged = records?.filter((r) => r.status === 'acknowledged').length ?? 0;
  const ackRate = total > 0 ? Math.round((acknowledged / total) * 100) : 0;

  const canCreate = (profile as any).role === 'manager' || (profile as any).role === 'admin';

  const kpis = [
    {
      label: 'Total Sessions',
      value: total,
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
    },
    {
      label: 'Pending',
      value: pending,
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
    },
    {
      label: 'Acknowledged',
      value: acknowledged,
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
    },
    {
      label: 'Acknowledgment Rate',
      value: `${ackRate}%`,
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)',
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '8px 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Welcome back, {(profile as any).name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Here's what's happening with your coaching sessions.
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/coaching/new" className="btn-primary">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Session
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: kpi.bg, color: kpi.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {kpi.icon}
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Overall acknowledgment progress</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{ackRate}%</span>
          </div>
          <div style={{ height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${ackRate}%`,
              background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
              borderRadius: '99px',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{acknowledged} acknowledged</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pending} pending</span>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Sessions</h2>
          <Link href="/dashboard/coaching" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            View all →
          </Link>
        </div>

        {!records?.length ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'var(--bg)', margin: '0 auto 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>No sessions yet</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Create your first coaching session to get started.</p>
            {canCreate && (
              <Link href="/dashboard/coaching/new" className="btn-primary" style={{ display: 'inline-flex' }}>
                Create first session
              </Link>
            )}
          </div>
        ) : (
          <div>
            {records.slice(0, 8).map((record: any, i: number) => (
              <div key={record.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 20px',
                borderBottom: i < Math.min(records.length, 8) - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}>
                {/* Type color dot */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
                  background: `${typeColors[record.coaching_type] || '#6b7280'}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: typeColors[record.coaching_type] || '#6b7280',
                  fontSize: '13px', fontWeight: 700,
                }}>
                  {(record.employee?.name || '?').charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {record.employee?.name}
                    </span>
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '99px', fontWeight: 500,
                      background: `${typeColors[record.coaching_type] || '#6b7280'}15`,
                      color: typeColors[record.coaching_type] || '#6b7280',
                    }}>
                      {coachingTypeLabels[record.coaching_type]}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    by {record.coach?.name} · {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 500,
                    background: record.status === 'acknowledged' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: record.status === 'acknowledged' ? '#10b981' : '#f59e0b',
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
                    {record.status === 'acknowledged' ? 'Acknowledged' : 'Pending'}
                  </span>
                  <Link href={`/dashboard/coaching/${record.id}`} style={{
                    fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500,
                  }}>
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
