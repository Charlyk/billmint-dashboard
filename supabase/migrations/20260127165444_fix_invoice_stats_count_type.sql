-- Fix get_invoice_stats function - cast count to INTEGER

CREATE OR REPLACE FUNCTION get_invoice_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'outstanding', json_build_object(
            'amounts', COALESCE((
                SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(total_amount::NUMERIC, 2)))
                FROM (
                    SELECT currency, SUM(total) as total_amount
                    FROM invoices
                    WHERE user_id = p_user_id
                      AND status IN ('sent', 'overdue')
                    GROUP BY currency
                    HAVING SUM(total) > 0
                ) t
            ), '[]'::json),
            'count', (
                SELECT COUNT(*)::INTEGER
                FROM invoices
                WHERE user_id = p_user_id
                  AND status IN ('sent', 'overdue')
            )
        ),
        'overdue', json_build_object(
            'amounts', COALESCE((
                SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(total_amount::NUMERIC, 2)))
                FROM (
                    SELECT currency, SUM(total) as total_amount
                    FROM invoices
                    WHERE user_id = p_user_id
                      AND status = 'overdue'
                    GROUP BY currency
                    HAVING SUM(total) > 0
                ) t
            ), '[]'::json),
            'count', (
                SELECT COUNT(*)::INTEGER
                FROM invoices
                WHERE user_id = p_user_id
                  AND status = 'overdue'
            )
        ),
        'paid_this_year', json_build_object(
            'amounts', COALESCE((
                SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(total_amount::NUMERIC, 2)))
                FROM (
                    SELECT currency, SUM(total) as total_amount
                    FROM invoices
                    WHERE user_id = p_user_id
                      AND status = 'paid'
                      AND EXTRACT(YEAR FROM paid_date) = EXTRACT(YEAR FROM CURRENT_DATE)
                    GROUP BY currency
                    HAVING SUM(total) > 0
                ) t
            ), '[]'::json),
            'count', (
                SELECT COUNT(*)::INTEGER
                FROM invoices
                WHERE user_id = p_user_id
                  AND status = 'paid'
                  AND EXTRACT(YEAR FROM paid_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            )
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
