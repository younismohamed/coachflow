import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'coaching@yourcompany.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const coachingTypeLabels: Record<string, string> = {
  performance: 'Performance', development: 'Development', behavioral: 'Behavioral',
  goal_setting: 'Goal Setting', feedback: 'Feedback', disciplinary: 'Disciplinary', other: 'Other',
};

interface CoachingEmailPayload {
  to: string;
  employeeName: string;
  coachName: string;
  coachingType: string;
  notes: string;
  actionPlan?: string | null;
  token: string;
}

export async function sendCoachingEmail(payload: CoachingEmailPayload) {
  const { to, employeeName, coachName, coachingType, notes, actionPlan, token } = payload;
  const ackLink = `${APP_URL}/acknowledge/${token}`;
  const typeLabel = coachingTypeLabels[coachingType] ?? coachingType;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: 'DM Sans', -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4044cc 0%, #6272f3 100%); padding: 32px 36px; }
    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.75); margin: 4px 0 0; font-size: 14px; }
    .body { padding: 32px 36px; }
    .greeting { font-size: 16px; color: #111827; margin-bottom: 20px; }
    .section { margin-bottom: 20px; }
    .section-label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .section-content { font-size: 14px; color: #374151; line-height: 1.6; background: #f9fafb; border-radius: 8px; padding: 12px 14px; }
    .badge { display: inline-block; background: #e0e9ff; color: #4044cc; padding: 2px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }
    .cta { text-align: center; padding: 28px 36px; border-top: 1px solid #f3f4f6; background: #fafafa; }
    .cta p { color: #6b7280; font-size: 13px; margin: 0 0 16px; }
    .btn { display: inline-block; background: #4044cc; color: white; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .footer { padding: 20px 36px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Coaching Session Recorded</h1>
      <p>CoachFlow · Employee Coaching Management</p>
    </div>
    <div class="body">
      <p class="greeting">Hi <strong>${employeeName}</strong>,</p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin-bottom:24px;">
        Your manager <strong>${coachName}</strong> has logged a coaching session with you.
        Please review the details below and acknowledge receipt.
      </p>

      <div class="section">
        <div class="section-label">Session Type</div>
        <span class="badge">${typeLabel}</span>
      </div>

      <div class="section">
        <div class="section-label">Session Notes</div>
        <div class="section-content">${notes.replace(/\n/g, '<br>')}</div>
      </div>

      ${actionPlan ? `
      <div class="section">
        <div class="section-label">Action Plan</div>
        <div class="section-content">${actionPlan.replace(/\n/g, '<br>')}</div>
      </div>` : ''}
    </div>

    <div class="cta">
      <p>Please acknowledge that you have read and understood this coaching record.</p>
      <a href="${ackLink}" class="btn">Acknowledge Receipt →</a>
    </div>

    <div class="footer">
      This email was sent by CoachFlow. If you have any concerns about this record, please speak with your HR department.
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Coaching Session Recorded — ${typeLabel}`,
    html,
  });
}

interface ReminderEmailPayload {
  to: string;
  employeeName: string;
  coachName: string;
  coachingType: string;
  token: string;
  daysOld: number;
}

export async function sendReminderEmail(payload: ReminderEmailPayload) {
  const { to, employeeName, coachName, coachingType, token, daysOld } = payload;
  const ackLink = `${APP_URL}/acknowledge/${token}`;
  const typeLabel = coachingTypeLabels[coachingType] ?? coachingType;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 28px 36px; }
    .header h1 { color: white; margin: 0; font-size: 20px; font-weight: 700; }
    .body { padding: 32px 36px; font-size: 15px; color: #374151; line-height: 1.6; }
    .btn { display: inline-block; background: #d97706; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .footer { padding: 16px 36px; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>⏰ Reminder: Coaching Acknowledgment Pending</h1></div>
    <div class="body">
      <p>Hi <strong>${employeeName}</strong>,</p>
      <p>This is a reminder that a <strong>${typeLabel}</strong> coaching session logged by <strong>${coachName}</strong> is still awaiting your acknowledgment after ${daysOld} days.</p>
      <p style="text-align:center;margin-top:28px;"><a href="${ackLink}" class="btn">Acknowledge Now →</a></p>
    </div>
    <div class="footer">CoachFlow · Employee Coaching Management</div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Reminder: Please Acknowledge Your Coaching Record`,
    html,
  });
}
