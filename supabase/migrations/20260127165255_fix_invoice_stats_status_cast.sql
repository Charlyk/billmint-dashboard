-- Fix get_invoice_stats function to properly cast status to invoice_status enum

CREATE OR REPLACE FUNCTION get_invoice_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'outstanding', json_build_object(
            'amounts', COALESCE((
                SELECT json_agg(json_build_object('currency', currency, 'amount', total_amount))
                FROM (
                    SELECT currency, SUM(total) as total_amount
                    FROM invoices
                    WHERE user_id = p_user_id
                      AND status IN ('sent'::invoice_status, 'overdue'::invoice_status)
                    GROUP BY currency
                ) t
            ), '[]'::json),
            'count', (
                SELECT COUNT(*)
                FROM invoices
                WHERE user_id = p_user_id
                  AND status IN ('sent'::invoice_status, 'overdue'::invoice_status)
            )
        ),
        'overdue', json_build_object(
            'amounts', COALESCE((
                SELECT json_agg(json_build_object('currency', currency, 'amount', total_amount))
                FROM (
                    SELECT currency, SUM(total) as total_amount
                    FROM invoices
                    WHERE user_id = p_user_id
                      AND status = 'overdue'::invoice_status
                    GROUP BY currency
                ) t
            ), '[]'::json),
            'count', (
                SELECT COUNT(*)
                FROM invoices
                WHERE user_id = p_user_id
                  AND status = 'overdue'::invoice_status
            )
        ),
        'paid_this_year', json_build_object(
            'amounts', COALESCE((
                SELECT json_agg(json_build_object('currency', currency, 'amount', total_amount))
                FROM (
                    SELECT currency, SUM(total) as total_amount
                    FROM invoices
                    WHERE user_id = p_user_id
                      AND status = 'paid'::invoice_status
                      AND EXTRACT(YEAR FROM paid_date) = EXTRACT(YEAR FROM CURRENT_DATE)
                    GROUP BY currency
                ) t
            ), '[]'::json),
            'count', (
                SELECT COUNT(*)
                FROM invoices
                WHERE user_id = p_user_id
                  AND status = 'paid'::invoice_status
                  AND EXTRACT(YEAR FROM paid_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            )
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
