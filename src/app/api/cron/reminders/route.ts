import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendReminderEmail } from '@/lib/email/resend';
import { differenceInDays } from 'date-fns';

// Protect with secret header
// Call via: GET /api/cron/reminders with header x-cron-secret: <CRON_SECRET>
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  // Find pending records older than 3 days where no reminder sent yet
  const { data: records, error } = await supabase
    .from('coaching_records')
    .select(`
      id, coaching_type, acknowledgment_token, created_at, reminder_sent_at,
      employee:employees(name, email),
      coach:profiles(name)
    `)
    .eq('status', 'pending')
    .lt('created_at', threeDaysAgo)
    .is('reminder_sent_at', null);

  if (error) {
    console.error('Cron error fetching records:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const record of records ?? []) {
    try {
      const daysOld = differenceInDays(new Date(), new Date(record.created_at));

      await sendReminderEmail({
        to: (record as any).employee.email,
        employeeName: (record as any).employee.name,
        coachName: (record as any).coach.name,
        coachingType: record.coaching_type,
        token: record.acknowledgment_token,
        daysOld,
      });

      // Update reminder_sent_at
      await supabase
        .from('coaching_records')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', record.id);

      sent++;
    } catch (err: any) {
      console.error(`Failed reminder for record ${record.id}:`, err);
      errors.push(record.id);
    }
  }

  return NextResponse.json({
    ok: true,
    checked: records?.length ?? 0,
    sent,
    errors,
  });
}
