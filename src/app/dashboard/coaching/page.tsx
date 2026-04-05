import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Coaching Records' };

const coachingTypeLabels: Record<string, string> = {
  performance: 'Performance', development: 'Development', behavioral: 'Behavioral',
  goal_setting: 'Goal Setting', feedback: 'Feedback', disciplinary: 'Disciplinary', other: 'Other',
};

export default async function CoachingRecordsPage({
  searchParams,
}: {
  searchParams: { status?: string; employee?: string; from?: string; to?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile) redirect('/login');

  let query = supabase
    .from('coaching_records')
    .select(`
      id, coaching_type, notes, status, created_at, acknowledged_at,
      employee:employees(id, name, email, department),
      coach:profiles(id, name, email)
    `)
    .order('created_at', { ascending: false });

  if (searchParams.status) query = query.eq('status', searchParams.status);
  if (searchParams.from) query = query.gte('created_at', searchParams.from);
  if (searchParams.to) query = query.lte('created_at', searchParams.to + 'T23:59:59');

  const { data: records } = await query;

  const filtered = searchParams.employee
    ? (records ?? []).filter((r: any) =>
        r.employee?.name?.toLowerCase().includes(searchParams.employee!.toLowerCase())
      )
    : records ?? [];

  const canEdit = profile.role === 'admin' || profile.role === 'manager';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coaching Records</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} session{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        {canEdit && (
          <Link href="/dashboard/coaching/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Session
          </Link>
        )}
      </div>

      {/* Filters */}
      <form className="card p-4 flex flex-wrap gap-3">
        <input
          name="employee"
          placeholder="Filter by employee…"
          defaultValue={searchParams.employee}
          className="form-input flex-1 min-w-40"
        />
        <select name="status" defaultValue={searchParams.status} className="form-select w-44">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="acknowledged">Acknowledged</option>
        </select>
        <input type="date" name="from" defaultValue={searchParams.from} className="form-input w-40" />
        <input type="date" name="to" defaultValue={searchParams.to} className="form-input w-40" />
        <button type="submit" className="btn-secondary">Filter</button>
        <Link href="/dashboard/coaching" className="btn-secondary">Clear</Link>
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500">No coaching records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Coach</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((record: any) => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                          <span className="text-brand-700 text-xs font-semibold">
                            {record.employee?.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{record.employee?.name}</p>
                          <p className="text-xs text-gray-500">{record.employee?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                        {coachingTypeLabels[record.coaching_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{record.coach?.name}</td>
                    <td className="px-6 py-4">
                      <span className={record.status === 'acknowledged' ? 'badge-acknowledged' : 'badge-pending'}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {record.status === 'acknowledged' ? 'Acknowledged' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {format(new Date(record.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/dashboard/coaching/${record.id}`} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                          View
                        </Link>
                        {canEdit && (
                          <Link href={`/dashboard/coaching/${record.id}/edit`} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                            Edit
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
