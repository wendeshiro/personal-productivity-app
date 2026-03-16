-- RESET TABLES
TRUNCATE activities RESTART IDENTITY CASCADE;

TRUNCATE categories RESTART IDENTITY CASCADE;

-- SEED CATEGORIES
INSERT INTO
  categories (id, name)
VALUES
  (1, 'Uncategorized'),
  (2, 'Focus'),
  (3, 'Planning'),
  (4, 'Communication'),
  (5, 'Learning'),
  (6, 'Creative'),
  (7, 'Life Admin');

SELECT
  setval (
    pg_get_serial_sequence ('categories', 'id'),
    (
      SELECT
        MAX(id)
      FROM
        categories
    )
  );

/*
DEMO ACTIVITIES
Date Range: 2026-03-09 → 2026-03-15
*/
INSERT INTO
  activities (
    title,
    category_id,
    note,
    start_time,
    end_time,
    is_completed
  )
VALUES
  (
    'Plan weekly priorities',
    3,
    'Sprint planning and task breakdown',
    '2026-03-09 09:00:00-07',
    '2026-03-09 10:00:00-07',
    TRUE
  ),
  (
    'Deep work on API module',
    2,
    NULL,
    '2026-03-10 10:30:00-07',
    '2026-03-10 12:30:00-07',
    TRUE
  ),
  (
    'Team sync meeting',
    4,
    NULL,
    '2026-03-10 14:00:00-07',
    '2026-03-10 14:30:00-07',
    TRUE
  ),
  (
    'Study SQL basics',
    5,
    'PostgreSQL tutorial',
    '2026-03-11 15:00:00-07',
    '2026-03-11 16:30:00-07',
    TRUE
  ),
  (
    'Design UI improvements',
    6,
    'Refine dashboard spacing and typography',
    '2026-03-12 11:00:00-07',
    '2026-03-12 12:30:00-07',
    TRUE
  ),
  (
    'Life admin errands',
    7,
    'Bank and utility follow-up',
    '2026-03-13 13:00:00-07',
    '2026-03-13 13:45:00-07',
    TRUE
  ),
  (
    'Client communication',
    4,
    'Project update and requirements confirmation',
    '2026-03-14 10:00:00-07',
    '2026-03-14 10:40:00-07',
    TRUE
  ),
  (
    'Read tech article',
    5,
    NULL,
    '2026-03-14 16:00:00-07',
    '2026-03-14 16:50:00-07',
    TRUE
  ),
  (
    'Build dashboard page',
    2,
    'Finalize charts and summary cards',
    '2026-03-15 14:00:00-07',
    '2026-03-15 16:00:00-07',
    TRUE
  );

/*
TODAY ACTIVE ACTIVITIES
Date: 2026-03-16
*/
INSERT INTO
  activities (
    title,
    category_id,
    note,
    start_time,
    end_time,
    is_completed
  )
VALUES
  (
    'Morning focus block',
    2,
    'Ship controller improvements',
    '2026-03-16 09:00:00-07',
    '2026-03-16 10:30:00-07',
    FALSE
  ),
  (
    'Plan next sprint tasks',
    3,
    NULL,
    '2026-03-16 10:45:00-07',
    '2026-03-16 11:20:00-07',
    FALSE
  ),
  (
    'Client follow-up messages',
    4,
    'Clarify API delivery timeline',
    '2026-03-16 13:00:00-07',
    '2026-03-16 13:40:00-07',
    FALSE
  ),
  (
    'Read architecture notes',
    5,
    NULL,
    '2026-03-16 14:00:00-07',
    '2026-03-16 15:00:00-07',
    FALSE
  ),
  (
    'Read test notes',
    7,
    NULL,
    '2026-03-16 18:00:00-07',
    '2026-03-16 19:00:00-07',
    TRUE
  ),
  (
    'UI sketch iteration',
    6,
    'Try alternate home layout ideas',
    '2026-03-16 15:30:00-07',
    '2026-03-16 16:15:00-07',
    FALSE
  );
