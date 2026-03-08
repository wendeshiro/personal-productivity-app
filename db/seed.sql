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

SELECT setval(
  pg_get_serial_sequence('categories', 'id'),
  (SELECT MAX(id) FROM categories)
);

/*
DEMO ACTIVITIES
Date Range: 2026-03-02 → 2026-03-08
*/
INSERT INTO
  activities (title, category_id, note, start_time, end_time)
VALUES
  (
    'React project deep work',
    2,
    'Implement dashboard',
    '2026-03-02 09:00:00-08',
    '2026-03-02 11:30:00-08'
  ),
  (
    'Weekly planning',
    3,
    NULL,
    '2026-03-02 13:00:00-08',
    '2026-03-02 13:45:00-08'
  ),
  (
    'Study SQL basics',
    5,
    'PostgreSQL tutorial',
    '2026-03-02 15:00:00-08',
    '2026-03-02 16:30:00-08'
  ),
  (
    'Feature development',
    2,
    'Timer logic',
    '2026-03-03 09:30:00-08',
    '2026-03-03 11:00:00-08'
  ),
  (
    'Team meeting',
    4,
    NULL,
    '2026-03-03 11:30:00-08',
    '2026-03-03 12:00:00-08'
  ),
  (
    'Database learning',
    5,
    'Indexes and joins',
    '2026-03-03 14:00:00-08',
    '2026-03-03 15:30:00-08'
  ),
  (
    'Coding productivity app',
    2,
    NULL,
    '2026-03-04 10:00:00-08',
    '2026-03-04 12:00:00-08'
  ),
  (
    'Sprint planning',
    3,
    NULL,
    '2026-03-04 13:30:00-08',
    '2026-03-04 14:00:00-08'
  ),
  (
    'Design chart UI',
    6,
    'Pie chart layout',
    '2026-03-04 16:00:00-08',
    '2026-03-04 17:00:00-08'
  ),
  (
    'Watch system design lecture',
    5,
    NULL,
    '2026-03-05 09:00:00-08',
    '2026-03-05 10:30:00-08'
  ),
  (
    'Debug API',
    2,
    'Fix timer bug',
    '2026-03-05 11:00:00-08',
    '2026-03-05 12:30:00-08'
  ),
  (
    'Admin emails',
    7,
    NULL,
    '2026-03-05 15:00:00-08',
    '2026-03-05 15:30:00-08'
  ),
  (
    'Implement timer feature',
    2,
    NULL,
    '2026-03-06 10:00:00-08',
    '2026-03-06 12:30:00-08'
  ),
  (
    'Client communication',
    4,
    'Project update',
    '2026-03-06 13:30:00-08',
    '2026-03-06 14:00:00-08'
  ),
  (
    'Read tech article',
    5,
    NULL,
    '2026-03-06 16:00:00-08',
    '2026-03-06 17:00:00-08'
  ),
  (
    'Design UI improvements',
    6,
    NULL,
    '2026-03-07 11:00:00-08',
    '2026-03-07 12:30:00-08'
  ),
  (
    'Build dashboard page',
    2,
    NULL,
    '2026-03-07 14:00:00-08',
    '2026-03-07 16:00:00-08'
  ),
  (
    'Weekly review',
    3,
    NULL,
    '2026-03-08 10:00:00-07',
    '2026-03-08 11:00:00-07'
  ),
  (
    'Study data visualization',
    5,
    NULL,
    '2026-03-08 13:00:00-07',
    '2026-03-08 14:30:00-07'
  );
