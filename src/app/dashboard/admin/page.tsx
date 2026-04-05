import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminRoleManager from '@/components/admin/AdminRoleManager';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin' };

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, email, role, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage user roles and system settings.</p>
      </div>
      <AdminRoleManager profiles={profiles ?? []} />
    </div>
  );
}
