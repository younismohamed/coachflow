'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EmployeeFormProps {
  managers: { id: string; name: string; email: string }[];
  currentUserId: string;
  initialData?: {
    id: string;
    name: string;
    email: string;
    department: string | null;
    position: string | null;
    manager_id: string | null;
    is_active: boolean;
  };
}

export default function EmployeeForm({ managers, currentUserId, initialData }: EmployeeFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    email: initialData?.email ?? '',
    department: initialData?.department ?? '',
    position: initialData?.position ?? '',
    manager_id: initialData?.manager_id ?? currentUserId,
    is_active: initialData?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isEdit ? `/api/employees/${initialData!.id}` : '/api/employees';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setSuccess(isEdit ? 'Employee updated!' : 'Employee added!');
      setTimeout(() => router.push('/dashboard/employees'), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Full Name <span className="text-red-500">*</span></label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Jane Smith" className="form-input" required />
        </div>
        <div>
          <label className="form-label">Email <span className="text-red-500">*</span></label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@company.com" className="form-input" required disabled={isEdit} />
        </div>
        <div>
          <label className="form-label">Department</label>
          <input name="department" value={form.department} onChange={handleChange} placeholder="Engineering" className="form-input" />
        </div>
        <div>
          <label className="form-label">Position</label>
          <input name="position" value={form.position} onChange={handleChange} placeholder="Software Engineer" className="form-input" />
        </div>
      </div>

      <div>
        <label className="form-label">Assigned Manager</label>
        <select name="manager_id" value={form.manager_id} onChange={handleChange} className="form-select">
          <option value="">No manager</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
          ))}
        </select>
      </div>

      {isEdit && (
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" name="is_active" checked={form.is_active} onChange={handleChange} className="rounded border-gray-300 text-brand-600" />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active employee</label>
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}
      {success && <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">{success}</div>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Employee'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}
