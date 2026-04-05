import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';

const coachingTypeLabels: Record<string, string> = {
  performance: 'Performance', development: 'Development', behavioral: 'Behavioral',
  goal_setting: 'Goal Setting', feedback: 'Feedback', disciplinary: 'Disciplinary', other: 'Other',
};

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role === 'employee') redirect('/dashboard');

  const { data: employee } = await supabase
    .from('employees')
    .select(`
      id, name, email, department, position, is_active, created_at,
      manager:profiles!manager_id(id, name, email)
    `)
    .eq('id', params.id)
    .single();

  if (!employee) notFound();

  const { data: records } = await supabase
    .from('coaching_records')
    .select(`
      id, coaching_type, status, notes, created_at, acknowledged_at,
      coach:profiles(name)
    `)
    .eq('employee_id', params.id)
    .order('created_at', { ascending: false });

  const total = records?.length ?? 0;
  const pending = records?.filter((r) => r.status === 'pending').length ?? 0;
  const acknowledged = records?.filter((r) => r.status === 'acknowledged').length ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/employees" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2">
            ← Back to employees
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{(employee as any).name}</h1>
          <p className="text-gray-500 text-sm">{(employee as any).email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
            (employee as any).is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {(employee as any).is_active ? 'Active' : 'Inactive'}
          </span>
          <Link href={`/dashboard/employees/${params.id}/edit`} className="btn-secondary">Edit</Link>
          <Link href={`/dashboard/coaching/new`} className="btn-primary">New Session</Link>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Department</p>
          <p className="font-semibold text-gray-900">{(employee as any).department ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Position</p>
          <p className="font-semibold text-gray-900">{(employee as any).position ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Manager</p>
          <p className="font-semibold text-gray-900">{(employee as any).manager?.name ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Added</p>
          <p className="font-semibold text-gray-900">{format(new Date((employee as any).created_at), 'MMM d, yyyy')}</p>
        </div>
      </div>

      {/* Coaching summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sessions', value: total, color: 'text-gray-900' },
          { label: 'Pending', value: pending, color: 'text-amber-600' },
          { label: 'Acknowledged', value: acknowledged, color: 'text-emerald-600' },
        ].map((stat) => (
          <div key={stat.label} className="card p-5 text-center">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Coaching history */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Coaching History</h2>
        </div>
        {!records?.length ? (
          <div className="py-12 text-center text-gray-500">No coaching sessions yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {records.map((record: any) => (
              <div key={record.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="mt-0.5">
                  <span className={record.status === 'acknowledged' ? 'badge-acknowledged' : 'badge-pending'}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {record.status === 'acknowledged' ? 'Acknowledged' : 'Pending'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {coachingTypeLabels[record.coaching_type]}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">by {record.coach?.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{record.notes}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Link href={`/dashboard/coaching/${record.id}`} className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0">
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
