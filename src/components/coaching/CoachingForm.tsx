'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Employee } from '@/lib/supabase/types';

interface CoachingFormProps {
  employees: Pick<Employee, 'id' | 'name' | 'email' | 'department'>[];
  coachId: string;
  initialData?: {
    id: string;
    employee_id: string;
    coaching_type: string;
    notes: string;
    action_plan: string | null;
  };
}

const coachingTypes = [
  { value: 'performance', label: 'Performance' },
  { value: 'development', label: 'Development' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'goal_setting', label: 'Goal Setting' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'disciplinary', label: 'Disciplinary' },
  { value: 'other', label: 'Other' },
];

export default function CoachingForm({ employees, coachId, initialData }: CoachingFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    employee_id: initialData?.employee_id ?? '',
    coaching_type: initialData?.coaching_type ?? '',
    notes: initialData?.notes ?? '',
    action_plan: initialData?.action_plan ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!form.employee_id || !form.coaching_type || !form.notes) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isEdit ? `/api/coaching/${initialData!.id}` : '/api/coaching';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, coach_id: coachId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Something went wrong');

      setSuccess(isEdit ? 'Record updated!' : 'Coaching session created and email sent!');
      setTimeout(() => router.push('/dashboard/coaching'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5">
      {/* Employee */}
      <div>
        <label className="form-label">Employee <span className="text-red-500">*</span></label>
        <select
          name="employee_id"
          value={form.employee_id}
          onChange={handleChange}
          className="form-select"
          disabled={isEdit}
          required
        >
          <option value="">Select employee…</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} {emp.department ? `— ${emp.department}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Coaching Type */}
      <div>
        <label className="form-label">Coaching Type <span className="text-red-500">*</span></label>
        <select
          name="coaching_type"
          value={form.coaching_type}
          onChange={handleChange}
          className="form-select"
          required
        >
          <option value="">Select type…</option>
          {coachingTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="form-label">Session Notes <span className="text-red-500">*</span></label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Describe what was discussed in this coaching session…"
          rows={5}
          className="form-textarea"
          required
        />
      </div>

      {/* Action Plan */}
      <div>
        <label className="form-label">Action Plan</label>
        <textarea
          name="action_plan"
          value={form.action_plan}
          onChange={handleChange}
          placeholder="List specific action items for the employee to follow up on…"
          rows={4}
          className="form-textarea"
        />
      </div>

      {/* Feedback */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
          {success}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {isEdit ? 'Saving…' : 'Submitting…'}
            </>
          ) : (
            isEdit ? 'Save Changes' : 'Create & Send Email'
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
