import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EmployeeForm from '@/components/employees/EmployeeForm';

export default async function NewEmployeePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role === 'employee') redirect('/dashboard');

  // Fetch managers (profiles with role = manager or admin)
  const { data: managers } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('role', ['manager', 'admin'])
    .order('name');

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Employee</h1>
        <p className="text-gray-500 text-sm mt-0.5">Register a new employee in the system.</p>
      </div>
      <EmployeeForm managers={managers ?? []} currentUserId={user.id} />
    </div>
  );
}
