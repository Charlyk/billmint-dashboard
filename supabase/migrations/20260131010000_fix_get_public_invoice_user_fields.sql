-- Fix get_public_invoice to use correct user fields
-- The users table doesn't have phone, address, or logo_url
-- logo_url is in user_settings table

CREATE OR REPLACE FUNCTION get_public_invoice(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_invoice RECORD;
    v_user RECORD;
    v_user_settings RECORD;
    v_line_items JSON;
    v_result JSON;
BEGIN
    -- First, update the invoice to overdue if needed
    UPDATE invoices
    SET status = 'overdue', updated_at = NOW()
    WHERE public_token = p_token
      AND status = 'sent'
      AND due_date < CURRENT_DATE;

    -- Get invoice with client
    SELECT
        i.*,
        json_build_object('id', c.id, 'name', c.name, 'email', c.email) as client_json
    INTO v_invoice
    FROM invoices i
    LEFT JOIN clients c ON c.id = i.client_id
    WHERE i.public_token = p_token;

    IF v_invoice.id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get user info
    SELECT full_name, company_name, email INTO v_user
    FROM users
    WHERE id = v_invoice.user_id;

    -- Get user settings for logo_url
    SELECT logo_url INTO v_user_settings
    FROM user_settings
    WHERE user_id = v_invoice.user_id;

    -- Get line items
    SELECT json_agg(
        json_build_object(
            'id', id,
            'description', description,
            'quantity', quantity,
            'unit_price', unit_price,
            'amount', amount
        ) ORDER BY created_at
    )
    INTO v_line_items
    FROM invoice_line_items
    WHERE invoice_id = v_invoice.id;

    -- Build result
    SELECT json_build_object(
        'invoice', json_build_object(
            'id', v_invoice.id,
            'invoice_number', v_invoice.invoice_number,
            'status', v_invoice.status,
            'issue_date', v_invoice.issue_date,
            'due_date', v_invoice.due_date,
            'paid_date', v_invoice.paid_date,
            'sent_at', v_invoice.sent_at,
            'subtotal', v_invoice.subtotal,
            'tax_rate', v_invoice.tax_rate,
            'tax_amount', v_invoice.tax_amount,
            'discount_amount', v_invoice.discount_amount,
            'total', v_invoice.total,
            'currency', v_invoice.currency,
            'notes', v_invoice.notes,
            'terms', v_invoice.terms,
            'public_token', v_invoice.public_token,
            'client', v_invoice.client_json,
            'line_items', COALESCE(v_line_items, '[]'::json)
        ),
        'user', json_build_object(
            'full_name', v_user.full_name,
            'company_name', v_user.company_name,
            'email', v_user.email,
            'logo_url', v_user_settings.logo_url
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
