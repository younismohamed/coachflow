import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import CoachingForm from '@/components/coaching/CoachingForm';

export default async function EditCoachingPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role === 'employee') redirect('/dashboard');

  const { data: record } = await supabase
    .from('coaching_records')
    .select('id, employee_id, coaching_type, notes, action_plan, coach_id')
    .eq('id', params.id)
    .single();

  if (!record) notFound();

  // Only the original coach or admin can edit
  if (profile.role !== 'admin' && record.coach_id !== user.id) redirect('/dashboard/coaching');

  const { data: employees } = await supabase
    .from('employees')
    .select('id, name, email, department')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Session</h1>
        <p className="text-gray-500 text-sm mt-0.5">Update the coaching record details.</p>
      </div>
      <CoachingForm employees={employees ?? []} coachId={user.id} initialData={record} />
    </div>
  );
}
