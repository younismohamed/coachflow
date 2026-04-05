import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

async function getDashboardData(userId: string, role: string) {
  const supabase = createClient();

  // Fetch coaching records (RLS handles filtering by role)
  const { data: records, error } = await supabase
    .from('coaching_records')
    .select(`
      id, status, coaching_type, created_at,
      employee:employees(name, email),
      coach:profiles(name)
    `)
    .order('created_at', { ascending: false });

  if (error) return { records: [], stats: null };

  const total = records?.length ?? 0;
  const pending = records?.filter((r) => r.status === 'pending').length ?? 0;
  const acknowledged = records?.filter((r) => r.status === 'acknowledged').length ?? 0;
  const ackRate = total > 0 ? Math.round((acknowledged / total) * 100) : 0;

  return { records: records ?? [], stats: { total, pending, acknowledged, ackRate } };
}

const coachingTypeLabels: Record<string, string> = {
  performance: 'Performance',
  development: 'Development',
  behavioral: 'Behavioral',
  goal_setting: 'Goal Setting',
  feedback: 'Feedback',
  disciplinary: 'Disciplinary',
  other: 'Other',
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const { records, stats } = await getDashboardData(user.id, profile.role);

  const kpis = [
    {
      label: 'Total Sessions',
      value: stats?.total ?? 0,
      icon: '📋',
      color: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
    },
    {
      label: 'Pending Acknowledgment',
      value: stats?.pending ?? 0,
      icon: '⏳',
      color: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
    {
      label: 'Acknowledged',
      value: stats?.acknowledged ?? 0,
      icon: '✅',
      color: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    {
      label: 'Acknowledgment Rate',
      value: `${stats?.ackRate ?? 0}%`,
      icon: '📈',
      color: 'bg-brand-50 text-brand-600',
      border: 'border-brand-100',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Overview of coaching activity</p>
        </div>
        {(profile.role === 'manager' || profile.role === 'admin') && (
          <Link href="/dashboard/coaching/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Coaching Session
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`card p-5 border ${kpi.border}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`w-10 h-10 rounded-lg ${kpi.color} flex items-center justify-center text-lg`}>
                {kpi.icon}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-sm text-gray-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Sessions */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Sessions</h2>
          <Link href="/dashboard/coaching" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            View all →
          </Link>
        </div>

        {records.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 text-sm">No coaching sessions yet.</p>
            {(profile.role === 'manager' || profile.role === 'admin') && (
              <Link href="/dashboard/coaching/new" className="btn-primary mt-4 inline-flex">
                Create first session
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {records.slice(0, 8).map((record: any) => (
              <div key={record.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <span className="text-brand-700 text-sm font-semibold">
                    {record.employee?.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{record.employee?.name}</p>
                  <p className="text-xs text-gray-500">
                    {coachingTypeLabels[record.coaching_type]} · by {record.coach?.name}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={record.status === 'acknowledged' ? 'badge-acknowledged' : 'badge-pending'}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {record.status === 'acknowledged' ? 'Acknowledged' : 'Pending'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                  </span>
                  <Link href={`/dashboard/coaching/${record.id}`} className="text-xs text-brand-600 hover:underline">
                    View
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
