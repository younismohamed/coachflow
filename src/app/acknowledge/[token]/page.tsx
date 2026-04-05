import { createServiceClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Acknowledge Coaching Session' };

const coachingTypeLabels: Record<string, string> = {
  performance: 'Performance', development: 'Development', behavioral: 'Behavioral',
  goal_setting: 'Goal Setting', feedback: 'Feedback', disciplinary: 'Disciplinary', other: 'Other',
};

export default async function AcknowledgePage({ params }: { params: { token: string } }) {
  const supabase = createServiceClient();

  // Find the record by token
  const { data: record, error } = await supabase
    .from('coaching_records')
    .select(`
      id, coaching_type, notes, action_plan, status, acknowledged_at, created_at,
      employee:employees(name, email),
      coach:profiles(name)
    `)
    .eq('acknowledgment_token', params.token)
    .single();

  // Invalid token
  if (error || !record) {
    return (
      <AckLayout>
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-500">This acknowledgment link is invalid or has expired.</p>
        </div>
      </AckLayout>
    );
  }

  // Already acknowledged
  if (record.status === 'acknowledged') {
    return (
      <AckLayout>
        <div className="text-center py-8">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Acknowledged</h1>
          <p className="text-gray-500">
            You acknowledged this coaching session on{' '}
            <strong>{record.acknowledged_at ? format(new Date(record.acknowledged_at), 'MMMM d, yyyy') : 'a previous date'}</strong>.
          </p>
        </div>
        <RecordSummary record={record} />
      </AckLayout>
    );
  }

  // Mark as acknowledged (using service role to bypass RLS)
  const { error: updateError } = await supabase
    .from('coaching_records')
    .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
    .eq('id', record.id);

  return (
    <AckLayout>
      {updateError ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-500">Please try again or contact your manager.</p>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acknowledged!</h1>
          <p className="text-gray-500">
            Thank you, <strong>{(record as any).employee?.name}</strong>. Your acknowledgment has been recorded.
          </p>
        </div>
      )}
      <RecordSummary record={record} />
    </AckLayout>
  );
}

function AckLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-xl">CoachFlow</span>
        </div>
        <div className="card p-8">{children}</div>
      </div>
    </div>
  );
}

function RecordSummary({ record }: { record: any }) {
  return (
    <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Session Type</span>
        <span className="font-medium text-gray-900">{coachingTypeLabels[record.coaching_type]}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Coach</span>
        <span className="font-medium text-gray-900">{record.coach?.name}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Date</span>
        <span className="font-medium text-gray-900">{format(new Date(record.created_at), 'MMM d, yyyy')}</span>
      </div>
      <div className="pt-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notes</p>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{record.notes}</p>
      </div>
      {record.action_plan && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Action Plan</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{record.action_plan}</p>
        </div>
      )}
    </div>
  );
}
