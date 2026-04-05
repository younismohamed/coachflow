import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CoachingForm from '@/components/coaching/CoachingForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Coaching Session' };

export default async function NewCoachingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role === 'employee') redirect('/dashboard');

  // Fetch employees managed by this coach (or all if admin)
  const { data: employees } = await supabase
    .from('employees')
    .select('id, name, email, department')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Coaching Session</h1>
        <p className="text-gray-500 text-sm mt-0.5">Log a coaching session and notify the employee.</p>
      </div>
      <CoachingForm employees={employees ?? []} coachId={user.id} />
    </div>
  );
}
