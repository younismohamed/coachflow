import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import EmployeeForm from '@/components/employees/EmployeeForm';

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role === 'employee') redirect('/dashboard');

  const { data: employee } = await supabase
    .from('employees')
    .select('id, name, email, department, position, manager_id, is_active')
    .eq('id', params.id)
    .single();

  if (!employee) notFound();

  const { data: managers } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('role', ['manager', 'admin'])
    .order('name');

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Employee</h1>
        <p className="text-gray-500 text-sm mt-0.5">Update employee details.</p>
      </div>
      <EmployeeForm managers={managers ?? []} currentUserId={user.id} initialData={employee} />
    </div>
  );
}
