import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Coaching Session' };

const coachingTypeLabels: Record<string, string> = {
  performance: 'Performance', development: 'Development', behavioral: 'Behavioral',
  goal_setting: 'Goal Setting', feedback: 'Feedback', disciplinary: 'Disciplinary', other: 'Other',
};

export default async function CoachingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  const { data: record } = await supabase
    .from('coaching_records')
    .select(`
      *,
      employee:employees(id, name, email, department, position),
      coach:profiles(id, name, email, avatar_url)
    `)
    .eq('id', params.id)
    .single();

  if (!record) notFound();

  const canEdit = (profile as any)?.role === 'admin' || ((profile as any)?.role === 'manager' && (record as any).coach?.id === user.id);
  
  // Check if current user is the employee of this record
  const { data: employeeRecord } = await supabase
    .from('employees')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  const isEmployee = employeeRecord?.id === (record as any).employee?.id;
  const canAcknowledge = isEmployee && (record as any).status === 'pending';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/coaching" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2">
            ← Back to records
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {coachingTypeLabels[(record as any).coaching_type]} Session
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {format(new Date((record as any).created_at), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={(record as any).status === 'acknowledged' ? 'badge-acknowledged' : 'badge-pending'}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {(record as any).status === 'acknowledged' ? 'Acknowledged' : 'Pending'}
          </span>
          {canEdit && (
            <Link href={`/dashboard/coaching/${params.id}/edit`} className="btn-secondary">
              Edit
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Employee</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-brand-700 font-semibold">
                {(record as any).employee?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{(record as any).employee?.name}</p>
              <p className="text-sm text-gray-500">{(record as any).employee?.email}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Coach / Manager</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-700 font-semibold">
                {(record as any).coach?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{(record as any).coach?.name}</p>
              <p className="text-sm text-gray-500">{(record as any).coach?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Session Notes</p>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{(record as any).notes}</p>
      </div>

      {(record as any).action_plan && (
        <div className="card p-6 border-brand-100 border">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-3">Action Plan</p>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{(record as any).action_plan}</p>
        </div>
      )}

      {/* Acknowledge button for employee */}
      {canAcknowledge && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-medium text-amber-800">Action required</p>
              <p className="text-sm text-amber-600">Please acknowledge that you have read this coaching record.</p>
            </div>
          </div>
          <Link
            href={`/acknowledge/${(record as any).acknowledgment_token}`}
            className="btn-primary shrink-0"
          >
            Acknowledge
          </Link>
        </div>
      )}

      {(record as any).status === 'acknowledged' && (record as any).acknowledged_at && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-medium text-emerald-800">Acknowledged by employee</p>
            <p className="text-sm text-emerald-600">
              {format(new Date((record as any).acknowledged_at), 'MMMM d, yyyy · h:mm a')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
