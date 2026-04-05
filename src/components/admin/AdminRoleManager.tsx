'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { UserRole } from '@/lib/supabase/types';

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

const roles: UserRole[] = ['admin', 'manager', 'employee'];

export default function AdminRoleManager({ profiles }: { profiles: ProfileRow[] }) {
  const [rows, setRows] = useState(profiles);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const updateRole = async (id: string, role: UserRole) => {
    setSaving(id);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setRows((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
      setMessage('Role updated successfully.');
    } catch {
      setMessage('Failed to update role.');
    } finally {
      setSaving(null);
    }
  };

  const roleBadge = (role: UserRole) => {
    const styles: Record<UserRole, string> = {
      admin: 'bg-purple-50 text-purple-700 border-purple-200',
      manager: 'bg-brand-50 text-brand-700 border-brand-200',
      employee: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[role]}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
          {message}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-surface-50">
          <h2 className="font-semibold text-gray-900">User Roles</h2>
          <p className="text-xs text-gray-500 mt-0.5">{rows.length} registered users</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                        <span className="text-brand-700 text-xs font-semibold">
                          {p.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{roleBadge(p.role)}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {format(new Date(p.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={p.role}
                        disabled={saving === p.id}
                        onChange={(e) => updateRole(p.id, e.target.value as UserRole)}
                        className="form-select w-36 text-sm py-1.5"
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                      {saving === p.id && (
                        <svg className="w-4 h-4 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
