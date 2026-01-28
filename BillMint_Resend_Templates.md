# BillMint Resend Email Templates

Copy each template directly into Resend.

---

## Base Layout (reusable)

Create this as a reusable layout in Resend, then reference it in each template.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
<div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

    <a href="https://billmint.io" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="https://billmint.io/billmint_logo_wbg.webp" alt="BillMint" width="140" style="height: auto; display: block;"></a>

    {{content}}

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
      <p style="margin: 0 0 8px 0;">
        <a href="https://billmint.io" style="color: #64748b; text-decoration: none;">BillMint</a> ·
        <a href="https://billmint.io/settings/notifications" style="color: #64748b; text-decoration: none;">Email preferences</a> ·
        <a href="https://billmint.io/help" style="color: #64748b; text-decoration: none;">Help</a>
      </p>
      <p style="margin: 0;">You're receiving this because you have a BillMint account.</p>
    </div>
  </div>
</div>
</body>
</html>
```

---

## 1. Welcome Email

**Template Name:** `welcome`
**Subject:** `Welcome to BillMint 🌿`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
<div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

    <a href="https://billmint.io" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="https://billmint.io/billmint_logo_wbg.webp" alt="BillMint" width="140" style="height: auto; display: block;"></a>

    <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Welcome to BillMint!</h1>

    <p style="margin: 0 0 16px 0; color: #475569;">Hi {{name}},</p>

    <p style="margin: 0 0 16px 0; color: #475569;">Thanks for signing up. BillMint helps you track time and send invoices without the bloat.</p>

    <p style="margin: 0 0 12px 0; color: #475569;"><strong>Get started in 3 steps:</strong></p>

    <ol style="color: #475569; padding-left: 20px; margin: 0 0 24px 0;">
      <li style="margin-bottom: 8px;"><strong>Start your first timer</strong> — Just click Start, no setup needed</li>
      <li style="margin-bottom: 8px;"><strong>Add a project</strong> — Set your hourly rate and start tracking to it</li>
      <li style="margin-bottom: 8px;"><strong>Send an invoice</strong> — Turn your tracked time into an invoice in one click</li>
    </ol>

    <a href="https://billmint.io" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Go to Dashboard</a>

    <p style="margin: 24px 0 16px 0; color: #475569;">Questions? Just reply to this email — we read everything.</p>

    <p style="color: #94a3b8; font-size: 14px; margin: 0;">Happy tracking!<br>The BillMint team</p>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
      <p style="margin: 0 0 8px 0;">
        <a href="https://billmint.io" style="color: #64748b; text-decoration: none;">BillMint</a> ·
        <a href="https://billmint.io/settings/notifications" style="color: #64748b; text-decoration: none;">Email preferences</a> ·
        <a href="https://billmint.io/help" style="color: #64748b; text-decoration: none;">Help</a>
      </p>
      <p style="margin: 0;">You're receiving this because you have a BillMint account.</p>
    </div>
  </div>
</div>
</body>
</html>
```

**Variables:**
- `{{name}}` - User's first name

---

## 2. Weekly Summary

**Template Name:** `weekly-summary`
**Subject:** `Your week in review: {{total_hours}} tracked`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
<div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

    <a href="https://billmint.io" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="https://billmint.io/billmint_logo_wbg.webp" alt="BillMint" width="140" style="height: auto; display: block;"></a>

    <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Your week in review</h1>

    <p style="margin: 0 0 16px 0; color: #475569;">Here's how your time tracking looked last week ({{week_start}} – {{week_end}}).</p>

    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Total time tracked</span>
        <span style="font-weight: 600; color: #14b8a6;">{{total_hours}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Billable hours</span>
        <span style="font-weight: 600; color: #1e293b;">{{billable_hours}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Billable amount</span>
        <span style="font-weight: 600; color: #1e293b;">{{billable_amount}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span style="color: #64748b; font-size: 14px;">Projects worked on</span>
        <span style="font-weight: 600; color: #1e293b;">{{project_count}}</span>
      </div>
    </div>

    {{#if unbilled_amount}}
    <p style="margin: 0 0 16px 0; color: #475569;">You have <strong>{{unbilled_amount}}</strong> in unbilled time. Ready to invoice?</p>
    <a href="https://billmint.io/invoices/new" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Create Invoice</a>
    {{/if}}

    <p style="color: #94a3b8; font-size: 14px; margin: 24px 0 0 0;">Keep up the great work! 💪</p>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
      <p style="margin: 0 0 8px 0;">
        <a href="https://billmint.io" style="color: #64748b; text-decoration: none;">BillMint</a> ·
        <a href="https://billmint.io/settings/notifications" style="color: #64748b; text-decoration: none;">Email preferences</a> ·
        <a href="https://billmint.io/help" style="color: #64748b; text-decoration: none;">Help</a>
      </p>
      <p style="margin: 0;">You're receiving this because you have a BillMint account.</p>
    </div>
  </div>
</div>
</body>
</html>
```

**Variables:**
- `{{week_start}}` - e.g., "Jan 13"
- `{{week_end}}` - e.g., "Jan 19"
- `{{total_hours}}` - e.g., "32h 15m"
- `{{billable_hours}}` - e.g., "28h 30m"
- `{{billable_amount}}` - e.g., "$2,137.50"
- `{{project_count}}` - e.g., "4"
- `{{unbilled_amount}}` - e.g., "$850.00" (optional)

---

## 3. Timer Auto-Paused

**Template Name:** `timer-auto-paused`
**Subject:** `Your timer was automatically paused`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
<div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

    <a href="https://billmint.io" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="https://billmint.io/billmint_logo_wbg.webp" alt="BillMint" width="140" style="height: auto; display: block;"></a>

    <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Your timer was paused</h1>

    <p style="margin: 0 0 16px 0; color: #475569;">Your timer was automatically paused after running for <strong>{{max_hours}} hours</strong>.</p>

    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Task</span>
        <span style="font-weight: 600; color: #1e293b;">{{description}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Project</span>
        <span style="font-weight: 600; color: #1e293b;">{{project_name}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Duration</span>
        <span style="font-weight: 600; color: #14b8a6;">{{duration}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span style="color: #64748b; font-size: 14px;">Started</span>
        <span style="font-weight: 600; color: #1e293b;">{{started_at}}</span>
      </div>
    </div>

    <p style="margin: 0 0 16px 0; color: #475569;">Did you forget to stop the timer? Review the entry and save or discard it.</p>

    <a href="https://billmint.io/time" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Review Timer</a>

    <p style="color: #94a3b8; font-size: 14px; margin: 24px 0 0 0;">
      You can change the auto-pause duration in <a href="https://billmint.io/settings" style="color: #64748b;">Settings</a>.
    </p>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
      <p style="margin: 0 0 8px 0;">
        <a href="https://billmint.io" style="color: #64748b; text-decoration: none;">BillMint</a> ·
        <a href="https://billmint.io/settings/notifications" style="color: #64748b; text-decoration: none;">Email preferences</a> ·
        <a href="https://billmint.io/help" style="color: #64748b; text-decoration: none;">Help</a>
      </p>
      <p style="margin: 0;">You're receiving this because you have a BillMint account.</p>
    </div>
  </div>
</div>
</body>
</html>
```

**Variables:**
- `{{max_hours}}` - e.g., "8"
- `{{description}}` - e.g., "API integration" or "No description"
- `{{project_name}}` - e.g., "Website Redesign" or "No project"
- `{{duration}}` - e.g., "8h 00m"
- `{{started_at}}` - e.g., "Jan 20 at 9:00 AM"

---

## 4. Timer Still Running

**Template Name:** `timer-reminder`
**Subject:** `⏱️ Your timer is still running ({{duration}})`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
<div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

    <a href="https://billmint.io" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="https://billmint.io/billmint_logo_wbg.webp" alt="BillMint" width="140" style="height: auto; display: block;"></a>

    <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Timer check-in</h1>

    <p style="margin: 0 0 16px 0; color: #475569;">Just a friendly reminder — your timer has been running for <strong>{{duration}}</strong>.</p>

    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Task</span>
        <span style="font-weight: 600; color: #1e293b;">{{description}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Project</span>
        <span style="font-weight: 600; color: #1e293b;">{{project_name}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span style="color: #64748b; font-size: 14px;">Running since</span>
        <span style="font-weight: 600; color: #1e293b;">{{started_at}}</span>
      </div>
    </div>

    <p style="margin: 0 0 16px 0; color: #475569;">If this is intentional, keep going! If not, you might want to stop or pause it.</p>

    <a href="https://billmint.io" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Timer</a>

    <p style="color: #94a3b8; font-size: 14px; margin: 24px 0 0 0;">
      Your timer will auto-pause after {{max_hours}} hours. <a href="https://billmint.io/settings" style="color: #64748b;">Change this setting</a>.
    </p>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
      <p style="margin: 0 0 8px 0;">
        <a href="https://billmint.io" style="color: #64748b; text-decoration: none;">BillMint</a> ·
        <a href="https://billmint.io/settings/notifications" style="color: #64748b; text-decoration: none;">Email preferences</a> ·
        <a href="https://billmint.io/help" style="color: #64748b; text-decoration: none;">Help</a>
      </p>
      <p style="margin: 0;">You're receiving this because you have a BillMint account.</p>
    </div>
  </div>
</div>
</body>
</html>
```

**Variables:**
- `{{duration}}` - e.g., "4h 30m"
- `{{description}}` - e.g., "API integration" or "No description"
- `{{project_name}}` - e.g., "Website Redesign" or "No project"
- `{{started_at}}` - e.g., "Jan 20 at 9:00 AM"
- `{{max_hours}}` - e.g., "8"

---

## 5. Invoice Overdue

**Template Name:** `invoice-overdue`
**Subject:** `Invoice {{invoice_number}} is overdue`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
<div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

    <a href="https://billmint.io" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="https://billmint.io/billmint_logo_wbg.webp" alt="BillMint" width="140" style="height: auto; display: block;"></a>

    <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Invoice overdue</h1>

    <p style="margin: 0 0 16px 0; color: #475569;">Invoice <strong>{{invoice_number}}</strong> to {{client_name}} is now <strong>{{days_overdue}} days overdue</strong>.</p>

    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Invoice</span>
        <span style="font-weight: 600; color: #1e293b;">{{invoice_number}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Client</span>
        <span style="font-weight: 600; color: #1e293b;">{{client_name}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Amount</span>
        <span style="font-weight: 600; color: #14b8a6;">{{amount}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span style="color: #64748b; font-size: 14px;">Due date</span>
        <span style="font-weight: 600; color: #1e293b;">{{due_date}}</span>
      </div>
    </div>

    <p style="margin: 0 0 16px 0; color: #475569;">You may want to follow up with your client.</p>

    <a href="https://billmint.io/invoices/{{invoice_id}}" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-right: 8px;">View Invoice</a>
    <a href="mailto:{{client_email}}?subject=Following up on invoice {{invoice_number}}" style="display: inline-block; background: transparent; border: 1px solid #e2e8f0; color: #1e293b; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Email Client</a>

    <p style="color: #94a3b8; font-size: 14px; margin: 24px 0 0 0;">
      Already paid? <a href="https://billmint.io/invoices/{{invoice_id}}" style="color: #64748b;">Mark as paid</a>.
    </p>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
      <p style="margin: 0 0 8px 0;">
        <a href="https://billmint.io" style="color: #64748b; text-decoration: none;">BillMint</a> ·
        <a href="https://billmint.io/settings/notifications" style="color: #64748b; text-decoration: none;">Email preferences</a> ·
        <a href="https://billmint.io/help" style="color: #64748b; text-decoration: none;">Help</a>
      </p>
      <p style="margin: 0;">You're receiving this because you have a BillMint account.</p>
    </div>
  </div>
</div>
</body>
</html>
```

**Variables:**
- `{{invoice_number}}` - e.g., "INV-2026-0012"
- `{{client_name}}` - e.g., "Acme Corp"
- `{{days_overdue}}` - e.g., "7"
- `{{amount}}` - e.g., "$1,200.00"
- `{{due_date}}` - e.g., "Jan 15, 2026"
- `{{invoice_id}}` - UUID for link
- `{{client_email}}` - e.g., "john@acme.com"

---

## 6. Monthly Summary

**Template Name:** `monthly-summary`
**Subject:** `Your {{month_name}} recap: {{total_hours}} tracked, {{total_invoiced}} invoiced`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
<div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

    <a href="https://billmint.io" style="text-decoration: none; margin-bottom: 24px; display: block;"><img src="https://billmint.io/billmint_logo_wbg.webp" alt="BillMint" width="140" style="height: auto; display: block;"></a>

    <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">{{month_name}} in review</h1>

    <p style="margin: 0 0 16px 0; color: #475569;">Here's your monthly summary.</p>

    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Time tracked</span>
        <span style="font-weight: 600; color: #14b8a6;">{{total_hours}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Billable amount</span>
        <span style="font-weight: 600; color: #1e293b;">{{billable_amount}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Invoices sent</span>
        <span style="font-weight: 600; color: #1e293b;">{{invoices_sent}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #64748b; font-size: 14px;">Amount invoiced</span>
        <span style="font-weight: 600; color: #1e293b;">{{total_invoiced}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span style="color: #64748b; font-size: 14px;">Amount paid</span>
        <span style="font-weight: 600; color: #1e293b;">{{total_paid}}</span>
      </div>
    </div>

    {{#if unbilled_amount}}
    <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="color: #92400e; margin: 0;">⚠️ You have <strong>{{unbilled_amount}}</strong> in unbilled time from {{month_name}}.</p>
    </div>
    <a href="https://billmint.io/invoices/new" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Create Invoice</a>
    {{/if}}

    {{#if overdue_count}}
    <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="color: #92400e; margin: 0;">⚠️ {{overdue_count}} invoice(s) are overdue, totaling <strong>{{overdue_amount}}</strong>.</p>
    </div>
    <a href="https://billmint.io/invoices?status=overdue" style="display: inline-block; background: transparent; border: 1px solid #e2e8f0; color: #1e293b; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Overdue</a>
    {{/if}}

    <p style="color: #94a3b8; font-size: 14px; margin: 24px 0 0 0;">Here's to a great {{next_month_name}}! 🚀</p>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
      <p style="margin: 0 0 8px 0;">
        <a href="https://billmint.io" style="color: #64748b; text-decoration: none;">BillMint</a> ·
        <a href="https://billmint.io/settings/notifications" style="color: #64748b; text-decoration: none;">Email preferences</a> ·
        <a href="https://billmint.io/help" style="color: #64748b; text-decoration: none;">Help</a>
      </p>
      <p style="margin: 0;">You're receiving this because you have a BillMint account.</p>
    </div>
  </div>
</div>
</body>
</html>
```

**Variables:**
- `{{month_name}}` - e.g., "December"
- `{{total_hours}}` - e.g., "142h 30m"
- `{{billable_amount}}` - e.g., "$10,687.50"
- `{{invoices_sent}}` - e.g., "5"
- `{{total_invoiced}}` - e.g., "$9,500.00"
- `{{total_paid}}` - e.g., "$8,200.00"
- `{{unbilled_amount}}` - e.g., "$1,187.50" (optional)
- `{{overdue_count}}` - e.g., "2" (optional)
- `{{overdue_amount}}` - e.g., "$2,400.00" (optional)
- `{{next_month_name}}` - e.g., "January"

---

## 7. Invoice Reminder (Send to Client)

**Template Name:** `invoice-reminder`
**Subject:** `Reminder: Invoice {{invoice_number}} from {{from_name}}`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">
      
      <a href="https://billmint.io" style="text-decoration: none; margin-bottom: 24px; display: block;">
        <img src="https://billmint.io/billmint_logo_wbg.webp" alt="BillMint" width="32" style="height: auto; display: block;">
      </a>
      
      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Payment Reminder</h1>
      
      <p style="margin: 0 0 16px 0; color: #475569;">Hi {{client_name}},</p>
      
      <p style="margin: 0 0 16px 0; color: #475569;">This is a friendly reminder that invoice <strong>{{invoice_number}}</strong> is {{status_text}}.</p>
      
      <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Invoice</span>
          <span style="font-weight: 600; color: #1e293b;">{{invoice_number}}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Amount Due</span>
          <span style="font-weight: 600; color: #14b8a6;">{{amount}}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 14px;">Issue Date</span>
          <span style="font-weight: 600; color: #1e293b;">{{issue_date}}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #64748b; font-size: 14px;">Due Date</span>
          <span style="font-weight: 600; color: {{due_date_color}};">{{due_date}}</span>
        </div>
      </div>
      
      <a href="{{invoice_url}}" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Invoice</a>
      
      <p style="margin: 24px 0 0 0; color: #475569;">If you've already sent payment, please disregard this reminder.</p>
      
      <p style="margin: 16px 0 0 0; color: #475569;">Thanks,<br>{{from_name}}</p>
      
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0;">Sent via <a href="https://billmint.io" style="color: #64748b; text-decoration: none;">BillMint</a></p>
      </div>
    </div>
  </div>
</body>
</html>
```

**Variables:**
- `{{client_name}}` - e.g., "John"
- `{{invoice_number}}` - e.g., "INV-2026-0012"
- `{{amount}}` - e.g., "$1,200.00"
- `{{issue_date}}` - e.g., "Jan 15, 2026"
- `{{due_date}}` - e.g., "Jan 30, 2026"
- `{{due_date_color}}` - "#1e293b" for upcoming, "#ef4444" for overdue
- `{{status_text}}` - "due in 3 days" or "7 days overdue"
- `{{invoice_url}}` - Public invoice link
- `{{from_name}}` - User's name/business name

---

## Quick Reference: All Templates

| Template | Subject | Variables |
|----------|---------|-----------|
| `welcome` | Welcome to BillMint 🌿 | name |
| `weekly-summary` | Your week in review: {{total_hours}} tracked | week_start, week_end, total_hours, billable_hours, billable_amount, project_count, unbilled_amount |
| `timer-auto-paused` | Your timer was automatically paused | max_hours, description, project_name, duration, started_at |
| `timer-reminder` | ⏱️ Your timer is still running ({{duration}}) | duration, description, project_name, started_at, max_hours |
| `invoice-overdue` | Invoice {{invoice_number}} is overdue | invoice_number, client_name, days_overdue, amount, due_date, invoice_id, client_email |
| `monthly-summary` | Your {{month_name}} recap: {{total_hours}} tracked, {{total_invoiced}} invoiced | month_name, total_hours, billable_amount, invoices_sent, total_invoiced, total_paid, unbilled_amount, overdue_count, overdue_amount, next_month_name |
| `invoice-reminder` | Reminder: Invoice {{invoice_number}} from {{from_name}} | client_name, invoice_number, amount, issue_date, due_date, due_date_color, status_text, invoice_url, from_name |
