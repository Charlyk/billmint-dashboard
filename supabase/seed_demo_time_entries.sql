-- ============================================
-- BillMint Demo Time Entries Seed
-- Run this in Supabase SQL Editor
-- Generates ~45 realistic time entries over the last 2 weeks
-- Uses your existing user account and projects
-- ============================================

DO $$
DECLARE
    v_user_id UUID;
    v_project_ids UUID[];
    v_project_count INT;
    v_proj_idx INT;
    v_start TIMESTAMPTZ;
    v_end TIMESTAMPTZ;
    v_duration INT;
    v_day DATE;
    v_hour INT;
    v_minute INT;
    v_descriptions TEXT[];
    v_desc_idx INT;
    v_is_billable BOOLEAN;
BEGIN
    -- Get the first user (adjust if you have multiple users)
    SELECT id INTO v_user_id FROM users LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found in the database';
    END IF;

    -- Get all active project IDs for this user
    SELECT ARRAY_AGG(id) INTO v_project_ids
    FROM projects
    WHERE user_id = v_user_id AND is_archived = FALSE;

    v_project_count := COALESCE(array_length(v_project_ids, 1), 0);

    IF v_project_count = 0 THEN
        RAISE EXCEPTION 'No active projects found for user %', v_user_id;
    END IF;

    RAISE NOTICE 'Seeding time entries for user % with % projects', v_user_id, v_project_count;

    -- Software dev task descriptions (realistic variety)
    v_descriptions := ARRAY[
        'Implement user authentication flow',
        'Fix pagination bug on dashboard',
        'Code review: PR #142 payment integration',
        'API endpoint for invoice generation',
        'Refactor database queries for performance',
        'Write unit tests for billing service',
        'Sprint planning meeting',
        'Debug WebSocket connection drops',
        'Update dependencies and security patches',
        'Implement email notification system',
        'Frontend: responsive layout fixes',
        'Set up CI/CD pipeline improvements',
        'Database migration for new schema',
        'Client meeting: requirements review',
        'Implement search functionality',
        'Fix CORS issues on staging',
        'Add error handling to API routes',
        'Design system component updates',
        'Performance optimization: lazy loading',
        'Write integration tests for checkout',
        'Standup meeting',
        'Review and merge feature branch',
        'Implement dark mode toggle',
        'Fix timezone handling in reports',
        'Backend: rate limiting middleware',
        'Frontend: form validation improvements',
        'Deploy to production environment',
        'Investigate memory leak in worker',
        'Add Stripe webhook handlers',
        'Refactor state management logic',
        'Client call: demo and feedback',
        'Bug fix: invoice PDF rendering',
        'Implement file upload feature',
        'Add caching layer for API responses',
        'Update API documentation',
        'Fix mobile navigation issues',
        'Implement export to CSV feature',
        'Security audit and fixes',
        'Optimize Docker build times',
        'Add monitoring and alerting setup',
        'Implement role-based access control',
        'Fix date picker component bug',
        'Backend: batch processing improvements',
        'Frontend: accessibility improvements',
        'Code review: PR #156 dashboard redesign'
    ];

    -- Generate entries for each of the last 14 days (weekdays only, ~3-4 entries per day)
    FOR day_offset IN 0..13 LOOP
        v_day := CURRENT_DATE - day_offset;

        -- Skip weekends (0 = Sunday, 6 = Saturday)
        IF EXTRACT(DOW FROM v_day) IN (0, 6) THEN
            CONTINUE;
        END IF;

        -- Morning block 1 (8:30-10:30 range)
        v_hour := 8 + floor(random())::INT;
        v_minute := (floor(random() * 4) * 15)::INT; -- 0, 15, 30, 45
        v_duration := (60 + floor(random() * 90))::INT * 60; -- 60-150 min in seconds
        v_start := (v_day || ' ' || LPAD(v_hour::TEXT, 2, '0') || ':' || LPAD(v_minute::TEXT, 2, '0') || ':00')::TIMESTAMPTZ;
        v_end := v_start + (v_duration || ' seconds')::INTERVAL;
        v_desc_idx := 1 + floor(random() * array_length(v_descriptions, 1))::INT;
        v_proj_idx := 1 + floor(random() * v_project_count)::INT;

        INSERT INTO time_entries (user_id, project_id, description, start_time, end_time, duration_seconds, is_billable, hourly_rate)
        SELECT v_user_id, v_project_ids[v_proj_idx], v_descriptions[v_desc_idx], v_start, v_end, v_duration, TRUE, p.hourly_rate
        FROM projects p WHERE p.id = v_project_ids[v_proj_idx];

        -- Morning block 2 (10:30-12:30 range)
        v_hour := 10 + floor(random())::INT;
        v_minute := 30 + (floor(random() * 2) * 15)::INT;
        v_duration := (45 + floor(random() * 75))::INT * 60; -- 45-120 min
        v_start := (v_day || ' ' || LPAD(v_hour::TEXT, 2, '0') || ':' || LPAD(v_minute::TEXT, 2, '0') || ':00')::TIMESTAMPTZ;
        v_end := v_start + (v_duration || ' seconds')::INTERVAL;
        v_desc_idx := 1 + floor(random() * array_length(v_descriptions, 1))::INT;
        v_proj_idx := 1 + floor(random() * v_project_count)::INT;
        -- Meetings and standups are non-billable
        v_is_billable := NOT (v_descriptions[v_desc_idx] ILIKE '%meeting%' OR v_descriptions[v_desc_idx] ILIKE '%standup%');

        INSERT INTO time_entries (user_id, project_id, description, start_time, end_time, duration_seconds, is_billable, hourly_rate)
        SELECT v_user_id, v_project_ids[v_proj_idx], v_descriptions[v_desc_idx], v_start, v_end, v_duration,
               v_is_billable, CASE WHEN v_is_billable THEN p.hourly_rate ELSE NULL END
        FROM projects p WHERE p.id = v_project_ids[v_proj_idx];

        -- Afternoon block 1 (13:00-15:00 range)
        v_hour := 13 + floor(random())::INT;
        v_minute := (floor(random() * 4) * 15)::INT;
        v_duration := (60 + floor(random() * 120))::INT * 60; -- 60-180 min
        v_start := (v_day || ' ' || LPAD(v_hour::TEXT, 2, '0') || ':' || LPAD(v_minute::TEXT, 2, '0') || ':00')::TIMESTAMPTZ;
        v_end := v_start + (v_duration || ' seconds')::INTERVAL;
        v_desc_idx := 1 + floor(random() * array_length(v_descriptions, 1))::INT;
        v_proj_idx := 1 + floor(random() * v_project_count)::INT;

        INSERT INTO time_entries (user_id, project_id, description, start_time, end_time, duration_seconds, is_billable, hourly_rate)
        SELECT v_user_id, v_project_ids[v_proj_idx], v_descriptions[v_desc_idx], v_start, v_end, v_duration, TRUE, p.hourly_rate
        FROM projects p WHERE p.id = v_project_ids[v_proj_idx];

        -- Afternoon block 2 (15:00-17:30 range) — only ~70% of days
        IF random() < 0.7 THEN
            v_hour := 15 + floor(random() * 2)::INT;
            v_minute := (floor(random() * 4) * 15)::INT;
            v_duration := (30 + floor(random() * 90))::INT * 60; -- 30-120 min
            v_start := (v_day || ' ' || LPAD(v_hour::TEXT, 2, '0') || ':' || LPAD(v_minute::TEXT, 2, '0') || ':00')::TIMESTAMPTZ;
            v_end := v_start + (v_duration || ' seconds')::INTERVAL;
            v_desc_idx := 1 + floor(random() * array_length(v_descriptions, 1))::INT;
            v_proj_idx := 1 + floor(random() * v_project_count)::INT;
            v_is_billable := NOT (v_descriptions[v_desc_idx] ILIKE '%meeting%' OR v_descriptions[v_desc_idx] ILIKE '%standup%' OR v_descriptions[v_desc_idx] ILIKE '%client call%');

            INSERT INTO time_entries (user_id, project_id, description, start_time, end_time, duration_seconds, is_billable, hourly_rate)
            SELECT v_user_id, v_project_ids[v_proj_idx], v_descriptions[v_desc_idx], v_start, v_end, v_duration,
                   v_is_billable, CASE WHEN v_is_billable THEN p.hourly_rate ELSE NULL END
            FROM projects p WHERE p.id = v_project_ids[v_proj_idx];
        END IF;
    END LOOP;

    RAISE NOTICE 'Done! Time entries seeded successfully.';
END $$;

-- Verify: count entries created in the last 14 days
SELECT COUNT(*) as entries_created,
       ROUND(SUM(duration_seconds)::NUMERIC / 3600, 1) as total_hours,
       COUNT(DISTINCT project_id) as projects_used
FROM time_entries
WHERE start_time >= CURRENT_DATE - INTERVAL '14 days';