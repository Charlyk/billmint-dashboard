-- Update get_invoice_for_email to include issue_date and currency for reminder emails

CREATE OR REPLACE FUNCTION get_invoice_for_email(
    p_user_id UUID,
    p_invoice_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'invoice', json_build_object(
            'id', i.id,
            'invoice_number', i.invoice_number,
            'total', i.total,
            'currency', i.currency,
            'issue_date', i.issue_date,
            'due_date', i.due_date,
            'status', i.status,
            'public_token', i.public_token
        ),
        'client', json_build_object(
            'name', c.name,
            'email', c.email
        ),
        'user', json_build_object(
            'full_name', u.full_name,
            'company_name', u.company_name,
            'email', u.email
        )
    ) INTO v_result
    FROM invoices i
    LEFT JOIN clients c ON c.id = i.client_id
    LEFT JOIN users u ON u.id = i.user_id
    WHERE i.id = p_invoice_id AND i.user_id = p_user_id;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND: Invoice not found';
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
