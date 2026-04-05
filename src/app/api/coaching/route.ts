import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendCoachingEmail } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role === 'employee') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { employee_id, coaching_type, notes, action_plan } = body;

    if (!employee_id || !coaching_type || !notes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert record
    const { data: record, error } = await supabase
      .from('coaching_records')
      .insert({
        employee_id,
        coach_id: user.id,
        coaching_type,
        notes,
        action_plan: action_plan || null,
        status: 'pending',
      })
      .select(`
        id, acknowledgment_token, coaching_type, notes, action_plan,
        employee:employees(name, email),
        coach:profiles(name)
      `)
      .single();

    if (error || !record) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create record' }, { status: 500 });
    }

    // Send email
    await sendCoachingEmail({
      to: (record as any).employee.email,
      employeeName: (record as any).employee.name,
      coachName: (record as any).coach.name,
      coachingType: coaching_type,
      notes,
      actionPlan: action_plan,
      token: (record as any).acknowledgment_token,
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/coaching error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
