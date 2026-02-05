import { Resend } from 'resend'

// Lazy initialization to avoid issues with missing API key at module load time
let resendInstance: Resend | null = null

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://billmint.io'
const FROM_EMAIL = process.env.EMAIL_FROM || 'Eduard from BillMint <noreply@billmint.io>'
const HELLO_EMAIL = 'Eduard from BillMint <hello@billmint.io>'
const INVOICES_EMAIL = 'invoices@billmint.io'

// ============================================================================
// Interfaces
// ============================================================================

export interface WelcomeEmailData {
  to: string
  name: string
}

export interface WeeklySummaryEmailData {
  to: string
  weekStart: string
  weekEnd: string
  totalHours: string
  billableHours: string
  billableAmount: string
  projectCount: number
  unbilledAmount?: string
}

export interface TimerAutoPausedEmailData {
  to: string
  maxHours: number
  description: string
  projectName: string
  duration: string
  startedAt: string
}

export interface TimerReminderEmailData {
  to: string
  duration: string
  description: string
  projectName: string
  startedAt: string
  maxHours: number
}

export interface InvoiceOverdueEmailData {
  to: string
  invoiceNumber: string
  clientName: string
  daysOverdue: number
  amount: string
  dueDate: string
  invoiceId: string
  clientEmail: string
}

export interface MonthlySummaryEmailData {
  to: string
  monthName: string
  totalHours: string
  billableAmount: string
  invoicesSent: number
  totalInvoiced: string
  totalPaid: string
  unbilledAmount?: string
  overdueCount?: number
  overdueAmount?: string
  nextMonthName: string
}

export interface InvoiceSentEmailData {
  to: string
  clientName: string
  invoiceNumber: string
  amount: string
  issueDate: string
  dueDate: string
  invoiceUrl: string
  fromName: string
}

export interface InvoiceReminderEmailData {
  to: string
  clientName: string
  invoiceNumber: string
  amount: string
  issueDate: string
  dueDate: string
  dueDateColor: string
  statusText: string
  invoiceUrl: string
  fromName: string
}

export interface PasswordResetEmailData {
  to: string
  resetUrl: string
}

export interface AccountDeletionOtpEmailData {
  to: string
  otpCode: string
}

export interface EmailVerificationEmailData {
  to: string
  name: string
  verificationUrl: string
}

// ============================================================================
// Email Functions
// ============================================================================

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const { to, name } = data

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

      <a href="${APP_URL}" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="${APP_URL}/billmint_logo_wbg.webp" alt="BillMint" width="32" style="height: auto; display: block;"></a>

      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Welcome to BillMint!</h1>

      <p style="margin: 0 0 16px 0; color: #475569;">Hi ${name},</p>

      <p style="margin: 0 0 16px 0; color: #475569;">Thanks for signing up. BillMint helps you track time and send invoices without the bloat.</p>

      <p style="margin: 0 0 12px 0; color: #475569;"><strong>Get started in 3 steps:</strong></p>

      <ol style="color: #475569; padding-left: 20px; margin: 0 0 24px 0;">
        <li style="margin-bottom: 8px;"><strong>Start your first timer</strong> — Just click Start, no setup needed</li>
        <li style="margin-bottom: 8px;"><strong>Add a project</strong> — Set your hourly rate and start tracking to it</li>
        <li style="margin-bottom: 8px;"><strong>Send an invoice</strong> — Turn your tracked time into an invoice in one click</li>
      </ol>

      <a href="${APP_URL}" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Go to Dashboard</a>

      <p style="margin: 24px 0 16px 0; color: #475569;">Questions? Just reply to this email — we read everything.</p>

      <p style="color: #94a3b8; font-size: 14px; margin: 0;">Happy tracking!<br>The BillMint team</p>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0 0 8px 0;">
          <a href="${APP_URL}" style="color: #64748b; text-decoration: none;">BillMint</a> ·
          <a href="${APP_URL}/settings/notifications" style="color: #64748b; text-decoration: none;">Email preferences</a> ·
          <a href="${APP_URL}/help" style="color: #64748b; text-decoration: none;">Help</a>
        </p>
        <p style="margin: 0;">You're receiving this because you have a BillMint account.</p>
      </div>
    </div>
  </div>
</body>
</html>`

  const text = `Welcome to BillMint!

Hi ${name},

Thanks for signing up. BillMint helps you track time and send invoices without the bloat.

Get started in 3 steps:
1. Start your first timer — Just click Start, no setup needed
2. Add a project — Set your hourly rate and start tracking to it
3. Send an invoice — Turn your tracked time into an invoice in one click

Go to Dashboard: ${APP_URL}

Questions? Just reply to this email — we read everything.

Happy tracking!
The BillMint team`

  const { error } = await getResend().emails.send({
    from: HELLO_EMAIL,
    to,
    subject: 'Welcome to BillMint 🌿',
    html,
    text,
  })

  if (error) {
    console.error('Failed to send welcome email:', error)
    throw error
  }
}

export async function sendWeeklySummaryEmail(data: WeeklySummaryEmailData) {
  const { to, weekStart, weekEnd, totalHours, billableHours, billableAmount, projectCount, unbilledAmount } = data

  const unbilledSection = unbilledAmount
    ? `<p style="margin: 0 0 16px 0; color: #475569;">You have <strong>${unbilledAmount}</strong> in unbilled time. Ready to invoice?</p>
      <a href="${APP_URL}/invoices/new" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Create Invoice</a>`
    : ''

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

      <a href="${APP_URL}" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="${APP_URL}/billmint_logo_wbg.webp" alt="BillMint" width="32" style="height: auto; display: block;"></a>

      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Your week in review</h1>

      <p style="margin: 0 0 16px 0; color: #475569;">Here's how your time tracking looked last week (${weekStart} – ${weekEnd}).</p>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Total time tracked</span>
          <span style="font-weight: 600; color: #14b8a6;">${totalHours}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Billable hours</span>
          <span style="font-weight: 600; color: #1e293b;">${billableHours}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Billable amount</span>
          <span style="font-weight: 600; color: #1e293b;">${billableAmount}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #64748b; font-size: 14px;">Projects worked on</span>
          <span style="font-weight: 600; color: #1e293b;">${projectCount}</span>
        </div>
      </div>

      ${unbilledSection}

      <p style="color: #94a3b8; font-size: 14px; margin: 24px 0 0 0;">Keep up the great work! 💪</p>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0 0 8px 0;">
          <a href="${APP_URL}" style="color: #64748b; text-decoration: none;">BillMint</a> ·
          <a href="${APP_URL}/settings/notifications" style="color: #64748b; text-decoration: none;">Email preferences</a> ·
          <a href="${APP_URL}/help" style="color: #64748b; text-decoration: none;">Help</a>
        </p>
        <p style="margin: 0;">You're receiving this because you have a BillMint account.</p>
      </div>
    </div>
  </div>
</body>
</html>`

  const unbilledText = unbilledAmount
    ? `\nYou have ${unbilledAmount} in unbilled time. Ready to invoice?\nCreate Invoice: ${APP_URL}/invoices/new\n`
    : ''

  const text = `Your week in review

Here's how your time tracking looked last week (${weekStart} – ${weekEnd}).

- Total time tracked: ${totalHours}
- Billable hours: ${billableHours}
- Billable amount: ${billableAmount}
- Projects worked on: ${projectCount}
${unbilledText}
Keep up the great work!`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your week in review: ${totalHours} tracked`,
    html,
    text,
  })

  if (error) {
    console.error('Failed to send weekly summary email:', error)
    throw error
  }
}

export async function sendTimerAutoPausedEmail(data: TimerAutoPausedEmailData) {
  const { to, maxHours, description, projectName, duration, startedAt } = data

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

      <a href="${APP_URL}" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="${APP_URL}/billmint_logo_wbg.webp" alt="BillMint" width="32" style="height: auto; display: block;"></a>

      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Your timer was paused</h1>

      <p style="margin: 0 0 16px 0; color: #475569;">Your timer was automatically paused after running for <strong>${maxHours} hours</strong>.</p>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Task</span>
          <span style="font-weight: 600; color: #1e293b;">${description}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Project</span>
          <span style="font-weight: 600; color: #1e293b;">${projectName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Duration</span>
          <span style="font-weight: 600; color: #14b8a6;">${duration}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #64748b; font-size: 14px;">Started</span>
          <span style="font-weight: 600; color: #1e293b;">${startedAt}</span>
        </div>
      </div>

      <p style="margin: 0 0 16px 0; color: #475569;">Did you forget to stop the timer? Review the entry and save or discard it.</p>

      <a href="${APP_URL}/time" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Review Timer</a>

      <p style="color: #94a3b8; font-size: 14px; margin: 24px 0 0 0;">
        You can change the auto-pause duration in <a href="${APP_URL}/settings" style="color: #64748b;">Settings</a>.
      </p>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0 0 8px 0;">
          <a href="${APP_URL}" style="color: #64748b; text-decoration: none;">BillMint</a> ·
          <a href="${APP_URL}/settings/notifications" style="color: #64748b; text-decoration: none;">Email preferences</a> ·
          <a href="${APP_URL}/help" style="color: #64748b; text-decoration: none;">Help</a>
        </p>
        <p style="margin: 0;">You're receiving this because you have a BillMint account.</p>
      </div>
    </div>
  </div>
</body>
</html>`

  const text = `Your timer was paused

Your timer was automatically paused after running for ${maxHours} hours.

Timer Details:
- Task: ${description}
- Project: ${projectName}
- Duration: ${duration}
- Started: ${startedAt}

Did you forget to stop the timer? Review the entry and save or discard it.

Review Timer: ${APP_URL}/time

You can change the auto-pause duration in Settings: ${APP_URL}/settings`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Your timer was automatically paused',
    html,
    text,
  })

  if (error) {
    console.error('Failed to send timer auto-paused email:', error)
    throw error
  }
}

export async function sendTimerReminderEmail(data: TimerReminderEmailData) {
  const { to, duration, description, projectName, startedAt, maxHours } = data

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

      <a href="${APP_URL}" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="${APP_URL}/billmint_logo_wbg.webp" alt="BillMint" width="32" style="height: auto; display: block;"></a>

      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Timer check-in</h1>

      <p style="margin: 0 0 16px 0; color: #475569;">Just a friendly reminder — your timer has been running for <strong>${duration}</strong>.</p>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Task</span>
          <span style="font-weight: 600; color: #1e293b;">${description}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Project</span>
          <span style="font-weight: 600; color: #1e293b;">${projectName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #64748b; font-size: 14px;">Running since</span>
          <span style="font-weight: 600; color: #1e293b;">${startedAt}</span>
        </div>
      </div>

      <p style="margin: 0 0 16px 0; color: #475569;">If this is intentional, keep going! If not, you might want to stop or pause it.</p>

      <a href="${APP_URL}" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Timer</a>

      <p style="color: #94a3b8; font-size: 14px; margin: 24px 0 0 0;">
        Your timer will auto-pause after ${maxHours} hours. <a href="${APP_URL}/settings" style="color: #64748b;">Change this setting</a>.
      </p>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0 0 8px 0;">
          <a href="${APP_URL}" style="color: #64748b; text-decoration: none;">BillMint</a> ·
          <a href="${APP_URL}/settings/notifications" style="color: #64748b; text-decoration: none;">Email preferences</a> ·
          <a href="${APP_URL}/help" style="color: #64748b; text-decoration: none;">Help</a>
        </p>
        <p style="margin: 0;">You're receiving this because you have a BillMint account.</p>
      </div>
    </div>
  </div>
</body>
</html>`

  const text = `Timer check-in

Just a friendly reminder — your timer has been running for ${duration}.

Timer Details:
- Task: ${description}
- Project: ${projectName}
- Running since: ${startedAt}

If this is intentional, keep going! If not, you might want to stop or pause it.

View Timer: ${APP_URL}

Your timer will auto-pause after ${maxHours} hours. Change this setting: ${APP_URL}/settings`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `⏱️ Your timer is still running (${duration})`,
    html,
    text,
  })

  if (error) {
    console.error('Failed to send timer reminder email:', error)
    throw error
  }
}

export async function sendInvoiceOverdueEmail(data: InvoiceOverdueEmailData) {
  const { to, invoiceNumber, clientName, daysOverdue, amount, dueDate, invoiceId, clientEmail } = data

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

      <a href="${APP_URL}" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="${APP_URL}/billmint_logo_wbg.webp" alt="BillMint" width="32" style="height: auto; display: block;"></a>

      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Invoice overdue</h1>

      <p style="margin: 0 0 16px 0; color: #475569;">Invoice <strong>${invoiceNumber}</strong> to ${clientName} is now <strong>${daysOverdue} days overdue</strong>.</p>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Invoice</span>
          <span style="font-weight: 600; color: #1e293b;">${invoiceNumber}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Client</span>
          <span style="font-weight: 600; color: #1e293b;">${clientName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Amount</span>
          <span style="font-weight: 600; color: #14b8a6;">${amount}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #64748b; font-size: 14px;">Due date</span>
          <span style="font-weight: 600; color: #1e293b;">${dueDate}</span>
        </div>
      </div>

      <p style="margin: 0 0 16px 0; color: #475569;">You may want to follow up with your client.</p>

      <a href="${APP_URL}/invoices/${invoiceId}" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-right: 8px;">View Invoice</a>
      <a href="mailto:${clientEmail}?subject=Following up on invoice ${invoiceNumber}" style="display: inline-block; background: transparent; border: 1px solid #e2e8f0; color: #1e293b; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Email Client</a>

      <p style="color: #94a3b8; font-size: 14px; margin: 24px 0 0 0;">
        Already paid? <a href="${APP_URL}/invoices/${invoiceId}" style="color: #64748b;">Mark as paid</a>.
      </p>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0 0 8px 0;">
          <a href="${APP_URL}" style="color: #64748b; text-decoration: none;">BillMint</a> ·
          <a href="${APP_URL}/settings/notifications" style="color: #64748b; text-decoration: none;">Email preferences</a> ·
          <a href="${APP_URL}/help" style="color: #64748b; text-decoration: none;">Help</a>
        </p>
        <p style="margin: 0;">You're receiving this because you have a BillMint account.</p>
      </div>
    </div>
  </div>
</body>
</html>`

  const text = `Invoice overdue

Invoice ${invoiceNumber} to ${clientName} is now ${daysOverdue} days overdue.

Invoice Details:
- Invoice: ${invoiceNumber}
- Client: ${clientName}
- Amount: ${amount}
- Due date: ${dueDate}

You may want to follow up with your client.

View Invoice: ${APP_URL}/invoices/${invoiceId}
Email Client: mailto:${clientEmail}?subject=Following up on invoice ${invoiceNumber}

Already paid? Mark as paid: ${APP_URL}/invoices/${invoiceId}`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Invoice ${invoiceNumber} is overdue`,
    html,
    text,
  })

  if (error) {
    console.error('Failed to send invoice overdue email:', error)
    throw error
  }
}

export async function sendMonthlySummaryEmail(data: MonthlySummaryEmailData) {
  const {
    to,
    monthName,
    totalHours,
    billableAmount,
    invoicesSent,
    totalInvoiced,
    totalPaid,
    unbilledAmount,
    overdueCount,
    overdueAmount,
    nextMonthName,
  } = data

  const unbilledSection = unbilledAmount
    ? `<div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #92400e; margin: 0;">⚠️ You have <strong>${unbilledAmount}</strong> in unbilled time from ${monthName}.</p>
      </div>
      <a href="${APP_URL}/invoices/new" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Create Invoice</a>`
    : ''

  const overdueSection = overdueCount && overdueAmount
    ? `<div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #92400e; margin: 0;">⚠️ ${overdueCount} invoice(s) are overdue, totaling <strong>${overdueAmount}</strong>.</p>
      </div>
      <a href="${APP_URL}/invoices?status=overdue" style="display: inline-block; background: transparent; border: 1px solid #e2e8f0; color: #1e293b; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Overdue</a>`
    : ''

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

      <a href="${APP_URL}" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="${APP_URL}/billmint_logo_wbg.webp" alt="BillMint" width="32" style="height: auto; display: block;"></a>

      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">${monthName} in review</h1>

      <p style="margin: 0 0 16px 0; color: #475569;">Here's your monthly summary.</p>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Time tracked</span>
          <span style="font-weight: 600; color: #14b8a6;">${totalHours}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Billable amount</span>
          <span style="font-weight: 600; color: #1e293b;">${billableAmount}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Invoices sent</span>
          <span style="font-weight: 600; color: #1e293b;">${invoicesSent}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Amount invoiced</span>
          <span style="font-weight: 600; color: #1e293b;">${totalInvoiced}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #64748b; font-size: 14px;">Amount paid</span>
          <span style="font-weight: 600; color: #1e293b;">${totalPaid}</span>
        </div>
      </div>

      ${unbilledSection}

      ${overdueSection}

      <p style="color: #94a3b8; font-size: 14px; margin: 24px 0 0 0;">Here's to a great ${nextMonthName}! 🚀</p>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0 0 8px 0;">
          <a href="${APP_URL}" style="color: #64748b; text-decoration: none;">BillMint</a> ·
          <a href="${APP_URL}/settings/notifications" style="color: #64748b; text-decoration: none;">Email preferences</a> ·
          <a href="${APP_URL}/help" style="color: #64748b; text-decoration: none;">Help</a>
        </p>
        <p style="margin: 0;">You're receiving this because you have a BillMint account.</p>
      </div>
    </div>
  </div>
</body>
</html>`

  const unbilledText = unbilledAmount
    ? `\n⚠️ You have ${unbilledAmount} in unbilled time from ${monthName}.\nCreate Invoice: ${APP_URL}/invoices/new\n`
    : ''

  const overdueText = overdueCount && overdueAmount
    ? `\n⚠️ ${overdueCount} invoice(s) are overdue, totaling ${overdueAmount}.\nView Overdue: ${APP_URL}/invoices?status=overdue\n`
    : ''

  const text = `${monthName} in review

Here's your monthly summary.

- Time tracked: ${totalHours}
- Billable amount: ${billableAmount}
- Invoices sent: ${invoicesSent}
- Amount invoiced: ${totalInvoiced}
- Amount paid: ${totalPaid}
${unbilledText}${overdueText}
Here's to a great ${nextMonthName}!`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your ${monthName} recap: ${totalHours} tracked, ${totalInvoiced} invoiced`,
    html,
    text,
  })

  if (error) {
    console.error('Failed to send monthly summary email:', error)
    throw error
  }
}

export async function sendInvoiceSentEmail(data: InvoiceSentEmailData) {
  const { to, clientName, invoiceNumber, amount, issueDate, dueDate, invoiceUrl, fromName } = data

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

      <a href="${APP_URL}" style="text-decoration: none; margin-bottom: 24px; display: block;">
        <img src="${APP_URL}/billmint_logo_wbg.webp" alt="BillMint" width="32" style="height: auto; display: block;">
      </a>

      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">You have a new invoice</h1>

      <p style="margin: 0 0 16px 0; color: #475569;">Hi ${clientName},</p>

      <p style="margin: 0 0 16px 0; color: #475569;">Please find below the details of your invoice from <strong>${fromName}</strong>.</p>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #64748b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Invoice</td>
            <td style="font-weight: 600; color: #1e293b; text-align: right; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Amount Due</td>
            <td style="font-weight: 600; color: #14b8a6; text-align: right; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${amount}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Issue Date</td>
            <td style="font-weight: 600; color: #1e293b; text-align: right; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${issueDate}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 14px; padding: 8px 0;">Due Date</td>
            <td style="font-weight: 600; color: #1e293b; text-align: right; padding: 8px 0;">${dueDate}</td>
          </tr>
        </table>
      </div>

      <a href="${invoiceUrl}" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Invoice</a>

      <p style="margin: 24px 0 0 0; color: #475569;">Thanks,<br>${fromName}</p>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0;">Sent via <a href="${APP_URL}" style="color: #64748b; text-decoration: none;">BillMint</a></p>
      </div>
    </div>
  </div>
</body>
</html>`

  const text = `You have a new invoice

Hi ${clientName},

Please find below the details of your invoice from ${fromName}.

Invoice Details:
- Invoice: ${invoiceNumber}
- Amount Due: ${amount}
- Issue Date: ${issueDate}
- Due Date: ${dueDate}

View Invoice: ${invoiceUrl}

Thanks,
${fromName}`

  const { error } = await getResend().emails.send({
    from: `${fromName} via BillMint <${INVOICES_EMAIL}>`,
    to,
    subject: `Invoice ${invoiceNumber} from ${fromName}`,
    html,
    text,
  })

  if (error) {
    console.error('Failed to send invoice email:', error)
    throw error
  }
}

export async function sendInvoiceReminderEmail(data: InvoiceReminderEmailData) {
  const { to, clientName, invoiceNumber, amount, issueDate, dueDate, dueDateColor, statusText, invoiceUrl, fromName } = data

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

      <a href="${APP_URL}" style="text-decoration: none; margin-bottom: 24px; display: block;">
        <img src="${APP_URL}/billmint_logo_wbg.webp" alt="BillMint" width="32" style="height: auto; display: block;">
      </a>

      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Payment Reminder</h1>

      <p style="margin: 0 0 16px 0; color: #475569;">Hi ${clientName},</p>

      <p style="margin: 0 0 16px 0; color: #475569;">This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> is ${statusText}.</p>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #64748b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Invoice</td>
            <td style="font-weight: 600; color: #1e293b; text-align: right; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Amount Due</td>
            <td style="font-weight: 600; color: #14b8a6; text-align: right; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${amount}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Issue Date</td>
            <td style="font-weight: 600; color: #1e293b; text-align: right; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${issueDate}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 14px; padding: 8px 0;">Due Date</td>
            <td style="font-weight: 600; color: ${dueDateColor}; text-align: right; padding: 8px 0;">${dueDate}</td>
          </tr>
        </table>
      </div>

      <a href="${invoiceUrl}" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Invoice</a>

      <p style="margin: 24px 0 0 0; color: #475569;">If you've already sent payment, please disregard this reminder.</p>

      <p style="margin: 16px 0 0 0; color: #475569;">Thanks,<br>${fromName}</p>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0;">Sent via <a href="${APP_URL}" style="color: #64748b; text-decoration: none;">BillMint</a></p>
      </div>
    </div>
  </div>
</body>
</html>`

  const text = `Payment Reminder

Hi ${clientName},

This is a friendly reminder that invoice ${invoiceNumber} is ${statusText}.

Invoice Details:
- Invoice: ${invoiceNumber}
- Amount Due: ${amount}
- Issue Date: ${issueDate}
- Due Date: ${dueDate}

View Invoice: ${invoiceUrl}

If you've already sent payment, please disregard this reminder.

Thanks,
${fromName}`

  const { error } = await getResend().emails.send({
    from: `${fromName} via BillMint <${INVOICES_EMAIL}>`,
    to,
    subject: `Reminder: Invoice ${invoiceNumber} from ${fromName}`,
    html,
    text,
  })

  if (error) {
    console.error('Failed to send invoice reminder email:', error)
    throw error
  }
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  const { to, resetUrl } = data

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

      <a href="${APP_URL}" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="${APP_URL}/billmint_logo_wbg.webp" alt="BillMint" width="32" style="height: auto; display: block;"></a>

      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Reset your password</h1>

      <p style="margin: 0 0 16px 0; color: #475569;">We received a request to reset your password. Click the button below to choose a new password.</p>

      <a href="${resetUrl}" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Reset Password</a>

      <p style="margin: 24px 0 16px 0; color: #475569;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>

      <p style="color: #94a3b8; font-size: 14px; margin: 0;">— The BillMint team</p>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0 0 8px 0;">
          <a href="${APP_URL}" style="color: #64748b; text-decoration: none;">BillMint</a> ·
          <a href="${APP_URL}/help" style="color: #64748b; text-decoration: none;">Help</a>
        </p>
        <p style="margin: 0;">You're receiving this because a password reset was requested for your account.</p>
      </div>
    </div>
  </div>
</body>
</html>`

  const text = `Reset your password

We received a request to reset your password. Click the link below to choose a new password:

${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.

— The BillMint team`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Reset your password',
    html,
    text,
  })

  if (error) {
    console.error('Failed to send password reset email:', error)
    throw error
  }
}

export async function sendAccountDeletionOtpEmail(data: AccountDeletionOtpEmailData) {
  const { to, otpCode } = data

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

      <a href="${APP_URL}" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="${APP_URL}/billmint_logo_wbg.webp" alt="BillMint" width="32" style="height: auto; display: block;"></a>

      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #dc2626;">Account Deletion Request</h1>

      <p style="margin: 0 0 16px 0; color: #475569;">You requested to delete your BillMint account. Use the code below to confirm this action:</p>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 0; color: #1e293b; font-family: monospace;">${otpCode}</p>
      </div>

      <p style="margin: 0 0 16px 0; color: #475569;">This code will expire in <strong>10 minutes</strong>.</p>

      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #991b1b; margin: 0; font-size: 14px;"><strong>Warning:</strong> This action is permanent and cannot be undone. All your data including time entries, projects, clients, and invoices will be permanently deleted.</p>
      </div>

      <p style="margin: 16px 0 0 0; color: #475569;">If you didn't request this, please ignore this email or contact support immediately.</p>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0 0 8px 0;">
          <a href="${APP_URL}" style="color: #64748b; text-decoration: none;">BillMint</a> ·
          <a href="${APP_URL}/help" style="color: #64748b; text-decoration: none;">Help</a>
        </p>
        <p style="margin: 0;">You're receiving this because an account deletion was requested.</p>
      </div>
    </div>
  </div>
</body>
</html>`

  const text = `Account Deletion Request

You requested to delete your BillMint account. Use the code below to confirm this action:

${otpCode}

This code will expire in 10 minutes.

WARNING: This action is permanent and cannot be undone. All your data including time entries, projects, clients, and invoices will be permanently deleted.

If you didn't request this, please ignore this email or contact support immediately.

— The BillMint team`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Confirm Account Deletion',
    html,
    text,
  })

  if (error) {
    console.error('Failed to send account deletion OTP email:', error)
    throw error
  }
}

export async function sendEmailVerificationEmail(data: EmailVerificationEmailData) {
  const { to, name, verificationUrl } = data

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

      <a href="${APP_URL}" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="${APP_URL}/billmint_logo_wbg.webp" alt="BillMint" width="32" style="height: auto; display: block;"></a>

      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Verify your email</h1>

      <p style="margin: 0 0 16px 0; color: #475569;">Hi ${name},</p>

      <p style="margin: 0 0 16px 0; color: #475569;">Thanks for signing up for BillMint! Please verify your email address by clicking the button below.</p>

      <a href="${verificationUrl}" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Verify Email</a>

      <p style="margin: 24px 0 16px 0; color: #475569;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>

      <p style="color: #94a3b8; font-size: 14px; margin: 0;">— The BillMint team</p>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0 0 8px 0;">
          <a href="${APP_URL}" style="color: #64748b; text-decoration: none;">BillMint</a> ·
          <a href="${APP_URL}/help" style="color: #64748b; text-decoration: none;">Help</a>
        </p>
        <p style="margin: 0;">You're receiving this because you signed up for a BillMint account.</p>
      </div>
    </div>
  </div>
</body>
</html>`

  const text = `Verify your email

Hi ${name},

Thanks for signing up for BillMint! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.

— The BillMint team`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Verify your email address',
    html,
    text,
  })

  if (error) {
    console.error('Failed to send email verification email:', error)
    throw error
  }
}
