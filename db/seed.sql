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
    FALSE
  ),
  (
    'UI sketch iteration',
    6,
    'Try alternate home layout ideas',
    '2026-03-16 15:30:00-07',
    '2026-03-16 16:15:00-07',
    FALSE
  );

/*
HISTORICAL ACTIVITIES
Date Range: 2026-03-16 → 2026-04-12
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
    'Refactor route handlers',
    2,
    'Cleaned up activity routes',
    '2026-03-16 19:30:00-07',
    '2026-03-16 20:30:00-07',
    TRUE
  ),
  (
    'Write daily plan',
    3,
    NULL,
    '2026-03-17 08:30:00-07',
    '2026-03-17 09:00:00-07',
    TRUE
  ),
  (
    'Implement timer UI polish',
    6,
    'Adjusted spacing and typography',
    '2026-03-17 10:00:00-07',
    '2026-03-17 11:20:00-07',
    TRUE
  ),
  (
    'Database schema review',
    5,
    'Checked indexes and constraints',
    '2026-03-18 09:30:00-07',
    '2026-03-18 10:30:00-07',
    TRUE
  ),
  (
    'Async communication block',
    4,
    'Reply to stakeholder questions',
    '2026-03-18 14:00:00-07',
    '2026-03-18 14:40:00-07',
    TRUE
  ),
  (
    'Focus block: controllers',
    2,
    NULL,
    '2026-03-19 09:00:00-07',
    '2026-03-19 11:00:00-07',
    TRUE
  ),
  (
    'Sprint backlog grooming',
    3,
    NULL,
    '2026-03-19 15:00:00-07',
    '2026-03-19 15:45:00-07',
    TRUE
  ),
  (
    'Read Node.js docs',
    5,
    'Express middleware patterns',
    '2026-03-20 10:30:00-07',
    '2026-03-20 11:20:00-07',
    TRUE
  ),
  (
    'Home page iteration',
    6,
    'Tweaked card spacing',
    '2026-03-20 13:30:00-07',
    '2026-03-20 14:30:00-07',
    TRUE
  ),
  (
    'Weekly review and planning',
    3,
    'Review completed tasks',
    '2026-03-21 09:00:00-07',
    '2026-03-21 10:00:00-07',
    TRUE
  ),
  (
    'Inbox and message cleanup',
    4,
    NULL,
    '2026-03-21 16:00:00-07',
    '2026-03-21 16:35:00-07',
    TRUE
  ),
  (
    'Weekly life admin',
    7,
    'Bills and account checks',
    '2026-03-22 11:00:00-07',
    '2026-03-22 11:45:00-07',
    TRUE
  ),
  (
    'Deep work: trends chart',
    2,
    'Improved chart labels',
    '2026-03-22 14:00:00-07',
    '2026-03-22 15:30:00-07',
    TRUE
  ),
  (
    'Plan Monday priorities',
    3,
    NULL,
    '2026-03-23 08:30:00-07',
    '2026-03-23 09:00:00-07',
    TRUE
  ),
  (
    'Build activity summary features',
    2,
    NULL,
    '2026-03-23 09:30:00-07',
    '2026-03-23 11:30:00-07',
    TRUE
  ),
  (
    'Team update meeting',
    4,
    NULL,
    '2026-03-24 13:00:00-07',
    '2026-03-24 13:30:00-07',
    TRUE
  ),
  (
    'SQL query practice',
    5,
    'Aggregate functions and joins',
    '2026-03-24 15:00:00-07',
    '2026-03-24 16:00:00-07',
    TRUE
  ),
  (
    'Refine continue activity page',
    6,
    NULL,
    '2026-03-25 10:00:00-07',
    '2026-03-25 11:10:00-07',
    TRUE
  ),
  (
    'Catch-up communication',
    4,
    'Follow up on blocked items',
    '2026-03-25 16:00:00-07',
    '2026-03-25 16:40:00-07',
    TRUE
  ),
  (
    'Feature implementation sprint',
    2,
    'Completed timer persistence',
    '2026-03-26 09:00:00-07',
    '2026-03-26 11:30:00-07',
    TRUE
  ),
  (
    'Write technical notes',
    5,
    NULL,
    '2026-03-26 14:30:00-07',
    '2026-03-26 15:15:00-07',
    TRUE
  ),
  (
    'Plan weekend tasks',
    3,
    NULL,
    '2026-03-27 10:00:00-07',
    '2026-03-27 10:30:00-07',
    TRUE
  ),
  (
    'Creative prototyping block',
    6,
    'Experimented with page layout',
    '2026-03-27 13:00:00-07',
    '2026-03-27 14:00:00-07',
    TRUE
  ),
  (
    'Personal errands',
    7,
    NULL,
    '2026-03-28 11:00:00-07',
    '2026-03-28 12:00:00-07',
    TRUE
  ),
  (
    'Focus block: bug fixes',
    2,
    NULL,
    '2026-03-28 15:00:00-07',
    '2026-03-28 16:30:00-07',
    TRUE
  ),
  (
    'Weekly reset planning',
    3,
    NULL,
    '2026-03-29 17:00:00-07',
    '2026-03-29 17:40:00-07',
    TRUE
  ),
  (
    'Read API design article',
    5,
    NULL,
    '2026-03-29 19:00:00-07',
    '2026-03-29 19:45:00-07',
    TRUE
  ),
  (
    'Monday deep focus',
    2,
    'Implemented validation checks',
    '2026-03-30 09:00:00-07',
    '2026-03-30 11:00:00-07',
    TRUE
  ),
  (
    'Project planning review',
    3,
    NULL,
    '2026-03-30 14:00:00-07',
    '2026-03-30 14:50:00-07',
    TRUE
  ),
  (
    'Stakeholder sync',
    4,
    NULL,
    '2026-03-31 10:30:00-07',
    '2026-03-31 11:00:00-07',
    TRUE
  ),
  (
    'UI cleanup pass',
    6,
    'Aligned button sizing',
    '2026-03-31 13:00:00-07',
    '2026-03-31 14:00:00-07',
    TRUE
  ),
  (
    'Refactor data helpers',
    2,
    NULL,
    '2026-04-01 09:30:00-07',
    '2026-04-01 11:00:00-07',
    TRUE
  ),
  (
    'Study PostgreSQL indexes',
    5,
    NULL,
    '2026-04-01 15:00:00-07',
    '2026-04-01 15:50:00-07',
    TRUE
  ),
  (
    'Roadmap planning session',
    3,
    'Q2 scope draft',
    '2026-04-02 09:00:00-07',
    '2026-04-02 10:00:00-07',
    TRUE
  ),
  (
    'Communication follow-ups',
    4,
    NULL,
    '2026-04-02 16:00:00-07',
    '2026-04-02 16:35:00-07',
    TRUE
  ),
  (
    'Feature deep work',
    2,
    'Completed trends filters logic',
    '2026-04-03 10:00:00-07',
    '2026-04-03 12:00:00-07',
    TRUE
  ),
  (
    'Visual iteration',
    6,
    NULL,
    '2026-04-03 14:00:00-07',
    '2026-04-03 15:00:00-07',
    TRUE
  ),
  (
    'Weekend errands',
    7,
    NULL,
    '2026-04-04 10:30:00-07',
    '2026-04-04 11:20:00-07',
    TRUE
  ),
  (
    'Read system design notes',
    5,
    NULL,
    '2026-04-04 13:00:00-07',
    '2026-04-04 13:50:00-07',
    TRUE
  ),
  (
    'Weekly prep',
    3,
    NULL,
    '2026-04-05 17:00:00-07',
    '2026-04-05 17:30:00-07',
    TRUE
  ),
  (
    'Code maintenance block',
    2,
    NULL,
    '2026-04-05 19:00:00-07',
    '2026-04-05 20:10:00-07',
    TRUE
  ),
  (
    'Priority planning',
    3,
    'Set top 3 tasks',
    '2026-04-06 08:45:00-07',
    '2026-04-06 09:15:00-07',
    TRUE
  ),
  (
    'Implement controller tests',
    2,
    NULL,
    '2026-04-06 10:00:00-07',
    '2026-04-06 11:40:00-07',
    TRUE
  ),
  (
    'Team async update',
    4,
    NULL,
    '2026-04-07 13:00:00-07',
    '2026-04-07 13:25:00-07',
    TRUE
  ),
  (
    'Learn EJS partial patterns',
    5,
    NULL,
    '2026-04-07 15:00:00-07',
    '2026-04-07 16:00:00-07',
    TRUE
  ),
  (
    'UI refinement pass',
    6,
    NULL,
    '2026-04-08 11:00:00-07',
    '2026-04-08 12:00:00-07',
    TRUE
  ),
  (
    'Project sync and messaging',
    4,
    'Clarified remaining tasks',
    '2026-04-08 16:30:00-07',
    '2026-04-08 17:10:00-07',
    TRUE
  ),
  (
    'Focus block: routing improvements',
    2,
    NULL,
    '2026-04-09 09:00:00-07',
    '2026-04-09 10:45:00-07',
    TRUE
  ),
  (
    'Planning and estimation',
    3,
    NULL,
    '2026-04-09 14:00:00-07',
    '2026-04-09 14:40:00-07',
    TRUE
  ),
  (
    'Documentation learning block',
    5,
    'Read Express routing guides',
    '2026-04-10 10:00:00-07',
    '2026-04-10 10:50:00-07',
    TRUE
  ),
  (
    'Creative component ideas',
    6,
    NULL,
    '2026-04-10 13:30:00-07',
    '2026-04-10 14:20:00-07',
    TRUE
  ),
  (
    'Life admin session',
    7,
    'Tax and receipts organization',
    '2026-04-11 11:00:00-07',
    '2026-04-11 12:10:00-07',
    TRUE
  ),
  (
    'Deep work: final polish',
    2,
    NULL,
    '2026-04-11 15:00:00-07',
    '2026-04-11 16:30:00-07',
    TRUE
  ),
  (
    'Weekly wrap-up planning',
    3,
    NULL,
    '2026-04-12 17:00:00-07',
    '2026-04-12 17:40:00-07',
    TRUE
  ),
  (
    'Read and review notes',
    5,
    NULL,
    '2026-04-12 19:00:00-07',
    '2026-04-12 19:45:00-07',
    TRUE
  );

/*
CATEGORY COVERAGE SUPPLEMENTS
Date Range: 2026-03-17 → 2026-04-12
Goal: Ensure each day has at least 4 distinct categories
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
    'Daily planning check-in',
    2,
    NULL,
    '2026-03-17 17:00:00-07',
    '2026-03-17 17:25:00-07',
    TRUE
  ),
  (
    'Learning recap session',
    5,
    NULL,
    '2026-03-17 17:40:00-07',
    '2026-03-17 18:05:00-07',
    TRUE
  ),
  (
    'Focus follow-up task',
    2,
    NULL,
    '2026-03-18 17:00:00-07',
    '2026-03-18 17:25:00-07',
    TRUE
  ),
  (
    'Planning wrap-up',
    3,
    NULL,
    '2026-03-18 17:40:00-07',
    '2026-03-18 18:05:00-07',
    TRUE
  ),
  (
    'Communication roundup',
    4,
    NULL,
    '2026-03-19 17:00:00-07',
    '2026-03-19 17:25:00-07',
    TRUE
  ),
  (
    'Learning notes review',
    5,
    NULL,
    '2026-03-19 17:40:00-07',
    '2026-03-19 18:05:00-07',
    TRUE
  ),
  (
    'Focus tune-up block',
    2,
    NULL,
    '2026-03-20 17:00:00-07',
    '2026-03-20 17:25:00-07',
    TRUE
  ),
  (
    'Planning touchpoint',
    3,
    NULL,
    '2026-03-20 17:40:00-07',
    '2026-03-20 18:05:00-07',
    TRUE
  ),
  (
    'Focus checkpoint',
    2,
    NULL,
    '2026-03-21 17:00:00-07',
    '2026-03-21 17:25:00-07',
    TRUE
  ),
  (
    'Learning review',
    5,
    NULL,
    '2026-03-21 17:40:00-07',
    '2026-03-21 18:05:00-07',
    TRUE
  ),
  (
    'Planning follow-up',
    3,
    NULL,
    '2026-03-22 17:00:00-07',
    '2026-03-22 17:25:00-07',
    TRUE
  ),
  (
    'Study sprint',
    5,
    NULL,
    '2026-03-22 17:40:00-07',
    '2026-03-22 18:05:00-07',
    TRUE
  ),
  (
    'Communication check-in',
    4,
    NULL,
    '2026-03-23 17:00:00-07',
    '2026-03-23 17:25:00-07',
    TRUE
  ),
  (
    'Learning block',
    5,
    NULL,
    '2026-03-23 17:40:00-07',
    '2026-03-23 18:05:00-07',
    TRUE
  ),
  (
    'Focus extension',
    2,
    NULL,
    '2026-03-24 17:00:00-07',
    '2026-03-24 17:25:00-07',
    TRUE
  ),
  (
    'Planning closeout',
    3,
    NULL,
    '2026-03-24 17:40:00-07',
    '2026-03-24 18:05:00-07',
    TRUE
  ),
  (
    'Focus micro-session',
    2,
    NULL,
    '2026-03-25 17:00:00-07',
    '2026-03-25 17:25:00-07',
    TRUE
  ),
  (
    'Study consolidation',
    5,
    NULL,
    '2026-03-25 17:40:00-07',
    '2026-03-25 18:05:00-07',
    TRUE
  ),
  (
    'Planning sync',
    3,
    NULL,
    '2026-03-26 17:00:00-07',
    '2026-03-26 17:25:00-07',
    TRUE
  ),
  (
    'Communication prep',
    4,
    NULL,
    '2026-03-26 17:40:00-07',
    '2026-03-26 18:05:00-07',
    TRUE
  ),
  (
    'Focus quick win',
    2,
    NULL,
    '2026-03-27 17:00:00-07',
    '2026-03-27 17:25:00-07',
    TRUE
  ),
  (
    'Learning recap',
    5,
    NULL,
    '2026-03-27 17:40:00-07',
    '2026-03-27 18:05:00-07',
    TRUE
  ),
  (
    'Planning alignment',
    3,
    NULL,
    '2026-03-28 17:00:00-07',
    '2026-03-28 17:25:00-07',
    TRUE
  ),
  (
    'Communication follow-up',
    4,
    NULL,
    '2026-03-28 17:40:00-07',
    '2026-03-28 18:05:00-07',
    TRUE
  ),
  (
    'Focus checkpoint',
    2,
    NULL,
    '2026-03-29 17:00:00-07',
    '2026-03-29 17:25:00-07',
    TRUE
  ),
  (
    'Communication summary',
    4,
    NULL,
    '2026-03-29 17:40:00-07',
    '2026-03-29 18:05:00-07',
    TRUE
  ),
  (
    'Communication block',
    4,
    NULL,
    '2026-03-30 17:00:00-07',
    '2026-03-30 17:25:00-07',
    TRUE
  ),
  (
    'Learning read-through',
    5,
    NULL,
    '2026-03-30 17:40:00-07',
    '2026-03-30 18:05:00-07',
    TRUE
  ),
  (
    'Focus completion pass',
    2,
    NULL,
    '2026-03-31 17:00:00-07',
    '2026-03-31 17:25:00-07',
    TRUE
  ),
  (
    'Planning notes',
    3,
    NULL,
    '2026-03-31 17:40:00-07',
    '2026-03-31 18:05:00-07',
    TRUE
  ),
  (
    'Planning checkpoint',
    3,
    NULL,
    '2026-04-01 17:00:00-07',
    '2026-04-01 17:25:00-07',
    TRUE
  ),
  (
    'Communication review',
    4,
    NULL,
    '2026-04-01 17:40:00-07',
    '2026-04-01 18:05:00-07',
    TRUE
  ),
  (
    'Focus extension block',
    2,
    NULL,
    '2026-04-02 17:00:00-07',
    '2026-04-02 17:25:00-07',
    TRUE
  ),
  (
    'Learning reflection',
    5,
    NULL,
    '2026-04-02 17:40:00-07',
    '2026-04-02 18:05:00-07',
    TRUE
  ),
  (
    'Planning micro-review',
    3,
    NULL,
    '2026-04-03 17:00:00-07',
    '2026-04-03 17:25:00-07',
    TRUE
  ),
  (
    'Study notes session',
    5,
    NULL,
    '2026-04-03 17:40:00-07',
    '2026-04-03 18:05:00-07',
    TRUE
  ),
  (
    'Focus maintenance',
    2,
    NULL,
    '2026-04-04 17:00:00-07',
    '2026-04-04 17:25:00-07',
    TRUE
  ),
  (
    'Planning snapshot',
    3,
    NULL,
    '2026-04-04 17:40:00-07',
    '2026-04-04 18:05:00-07',
    TRUE
  ),
  (
    'Communication status update',
    4,
    NULL,
    '2026-04-05 17:45:00-07',
    '2026-04-05 18:10:00-07',
    TRUE
  ),
  (
    'Learning digest',
    5,
    NULL,
    '2026-04-05 18:20:00-07',
    '2026-04-05 18:45:00-07',
    TRUE
  ),
  (
    'Communication alignment',
    4,
    NULL,
    '2026-04-06 17:00:00-07',
    '2026-04-06 17:25:00-07',
    TRUE
  ),
  (
    'Learning reinforcement',
    5,
    NULL,
    '2026-04-06 17:40:00-07',
    '2026-04-06 18:05:00-07',
    TRUE
  ),
  (
    'Focus add-on',
    2,
    NULL,
    '2026-04-07 17:00:00-07',
    '2026-04-07 17:25:00-07',
    TRUE
  ),
  (
    'Planning summary',
    3,
    NULL,
    '2026-04-07 17:40:00-07',
    '2026-04-07 18:05:00-07',
    TRUE
  ),
  (
    'Focus check',
    2,
    NULL,
    '2026-04-08 17:00:00-07',
    '2026-04-08 17:25:00-07',
    TRUE
  ),
  (
    'Learning pass',
    5,
    NULL,
    '2026-04-08 17:40:00-07',
    '2026-04-08 18:05:00-07',
    TRUE
  ),
  (
    'Communication sprint',
    4,
    NULL,
    '2026-04-09 17:00:00-07',
    '2026-04-09 17:25:00-07',
    TRUE
  ),
  (
    'Learning deep-dive',
    5,
    NULL,
    '2026-04-09 17:40:00-07',
    '2026-04-09 18:05:00-07',
    TRUE
  ),
  (
    'Focus check-in',
    2,
    NULL,
    '2026-04-10 17:00:00-07',
    '2026-04-10 17:25:00-07',
    TRUE
  ),
  (
    'Planning recap',
    3,
    NULL,
    '2026-04-10 17:40:00-07',
    '2026-04-10 18:05:00-07',
    TRUE
  ),
  (
    'Planning reflection',
    3,
    NULL,
    '2026-04-11 17:00:00-07',
    '2026-04-11 17:25:00-07',
    TRUE
  ),
  (
    'Learning closeout',
    5,
    NULL,
    '2026-04-11 17:40:00-07',
    '2026-04-11 18:05:00-07',
    TRUE
  ),
  (
    'Focus retro',
    2,
    NULL,
    '2026-04-12 17:50:00-07',
    '2026-04-12 18:15:00-07',
    TRUE
  ),
  (
    'Communication wrap-up',
    4,
    NULL,
    '2026-04-12 18:20:00-07',
    '2026-04-12 18:45:00-07',
    TRUE
  );
