import { query } from "../db/client.js";

/*
const activities = [
  {
    id: 1,
    name: "Deep Work Session",
    category: "Focus",
    activeDays: 10,
    totalTime: "00:20:00",
  },
  {
    id: 2,
    name: "Weekly Agenda",
    category: "Planning",
    activeDays: 5,
    totalTime: "00:20:00",
  },
  {
    id: 3,
    name: "Clear Inbox",
    category: "Life Admin",
    activeDays: 1,
    totalTime: "00:20:00",
  },
  {
    id: 4,
    name: "Course Review",
    category: "Learning",
    activeDays: 2,
    totalTime: "00:20:00",
  },
  {
    id: 5,
    name: "Sketch Practice",
    category: "Creative",
    activeDays: 7,
    totalTime: "00:20:00",
  },
];
*/

const categoryIconMap = {
  Focus: "/image/focus-fill.svg",
  Planning: "/image/plan-fill.svg",
  "Life Admin": "/image/life-fill.svg",
  Learning: "/image/learn-fill.svg",
  Creative: "/image/creative-fill.svg",
  Communication: "/image/comm-fill.svg",
};

const categoryToneMap = {
  Focus: "focus",
  Planning: "planning",
  "Life Admin": "life-admin",
  Learning: "learning",
  Creative: "creative",
  Communication: "communication",
};

const homeCategoryOrder = [
  "Focus",
  "Planning",
  "Life Admin",
  "Learning",
  "Creative",
  "Communication",
];

const parseTimeToSeconds = (timeValue) => {
  const parts = String(timeValue)
    .split(":")
    .map((part) => Number(part));

  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return 0;
  }

  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
};

const formatSecondsToTime = (totalSeconds) => {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(safeSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const buildDonutGradient = (categories) => {
  const segments = [];
  let accumulatedDegrees = 0;

  categories.forEach((category) => {
    const percentage = Number(category.percentage) || 0;

    if (percentage <= 0) {
      return;
    }

    const start = accumulatedDegrees;
    const end = Math.min(360, start + (percentage / 100) * 360);

    segments.push(`var(--${category.tone}) ${start}deg ${end}deg`);
    accumulatedDegrees = end;
  });

  if (segments.length === 0) {
    return "var(--focus) 0deg 360deg";
  }

  if (accumulatedDegrees < 360) {
    const lastIndex = segments.length - 1;
    segments[lastIndex] = segments[lastIndex].replace(
      /\d+(?:\.\d+)?deg$/,
      "360deg",
    );
  }

  return segments.join(", ");
};

const fetchTodayInsight = async () => {
  const { rows } = await query(
    `
      SELECT
        c.name,
        COALESCE(SUM(a.duration_seconds), 0)::INTEGER AS "totalSeconds"
      FROM categories c
      LEFT JOIN activities a
        ON a.category_id = c.id
       AND a.start_time >= CURRENT_DATE
       AND a.start_time < CURRENT_DATE + INTERVAL '1 day'
       AND a.end_time IS NOT NULL
      WHERE c.name <> 'Uncategorized'
      GROUP BY c.id, c.name
      ORDER BY c.id
    `,
  );

  const totalsByCategory = new Map(
    rows.map((row) => [row.name, Number(row.totalSeconds) || 0]),
  );

  const categories = homeCategoryOrder.map((name) => ({
    name,
    tone: categoryToneMap[name],
    totalSeconds: totalsByCategory.get(name) || 0,
  }));

  const totalSecondsToday = categories.reduce(
    (sum, category) => sum + category.totalSeconds,
    0,
  );

  const categoriesWithStats = categories.map((category) => {
    const percentage =
      totalSecondsToday > 0
        ? Number(((category.totalSeconds / totalSecondsToday) * 100).toFixed(1))
        : 0;

    return {
      ...category,
      minutes: Math.round(category.totalSeconds / 60),
      percentage,
    };
  });

  return {
    categories: categoriesWithStats,
    donutGradient: buildDonutGradient(categoriesWithStats),
  };
};

const mapActivityRow = (row) => ({
  id: Number(row.id),
  name: row.name,
  category: row.category,
  activeDays: Number(row.activeDays),
  totalTime: formatSecondsToTime(row.totalSeconds),
});

let completionColumnEnsured = false;

const ensureCompletionColumn = async () => {
  if (completionColumnEnsured) {
    return;
  }

  await query(
    `
      ALTER TABLE activities
      ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT FALSE
    `,
  );

  completionColumnEnsured = true;
};

const fetchActivityGroups = async () => {
  await ensureCompletionColumn();

  const { rows } = await query(
    `
      SELECT
        MIN(a.id) AS id,
        a.title AS name,
        c.name AS category,
        COUNT(DISTINCT DATE(a.start_time))::INTEGER AS "activeDays",
        COALESCE(SUM(a.duration_seconds), 0)::INTEGER AS "totalSeconds"
      FROM activities a
      INNER JOIN categories c ON c.id = a.category_id
      GROUP BY a.title, c.name
      HAVING BOOL_OR(NOT a.is_completed)
      ORDER BY MAX(a.start_time) DESC, MIN(a.id) DESC
    `,
  );

  return rows.map(mapActivityRow);
};

const fetchActivityGroupById = async (activityId) => {
  const { rows } = await query(
    `
      WITH target AS (
        SELECT title, category_id
        FROM activities
        WHERE id = $1
      )
      SELECT
        MIN(a.id) AS id,
        a.title AS name,
        c.name AS category,
        COUNT(DISTINCT DATE(a.start_time))::INTEGER AS "activeDays",
        COALESCE(SUM(a.duration_seconds), 0)::INTEGER AS "totalSeconds"
      FROM activities a
      INNER JOIN categories c ON c.id = a.category_id
      INNER JOIN target t ON t.title = a.title AND t.category_id = a.category_id
      GROUP BY a.title, c.name
    `,
    [activityId],
  );

  if (rows.length === 0) {
    return null;
  }

  return mapActivityRow(rows[0]);
};

const fetchActivityGroupByNameCategory = async (name, category) => {
  const { rows } = await query(
    `
      SELECT
        MIN(a.id) AS id,
        a.title AS name,
        c.name AS category,
        COUNT(DISTINCT DATE(a.start_time))::INTEGER AS "activeDays",
        COALESCE(SUM(a.duration_seconds), 0)::INTEGER AS "totalSeconds"
      FROM activities a
      INNER JOIN categories c ON c.id = a.category_id
      WHERE a.title = $1 AND c.name = $2
      GROUP BY a.title, c.name
    `,
    [name, category],
  );

  if (rows.length === 0) {
    return null;
  }

  return mapActivityRow(rows[0]);
};

const resolveCategory = async (categoryName) => {
  const exactMatch = await query(
    `
      SELECT id, name
      FROM categories
      WHERE name = $1
      LIMIT 1
    `,
    [categoryName],
  );

  if (exactMatch.rows.length > 0) {
    return exactMatch.rows[0];
  }

  const fallback = await query(
    `
      SELECT id, name
      FROM categories
      WHERE id = 1
      LIMIT 1
    `,
  );

  if (fallback.rows.length > 0) {
    return fallback.rows[0];
  }

  return { id: 1, name: "Uncategorized" };
};

export const renderHome = async (_req, res) => {
  try {
    const { categories, donutGradient } = await fetchTodayInsight();

    res.render("index", {
      pageTitle: "Home",
      categories,
      donutGradient,
    });
  } catch {
    res.status(500).send("Failed to load home page.");
  }
};

export const renderContinueActivity = async (_req, res) => {
  try {
    const activities = await fetchActivityGroups();
    const activitiesWithIcons = activities.map((activity) => ({
      ...activity,
      icon: categoryIconMap[activity.category] || categoryIconMap.Focus,
    }));

    res.render("continue-activity", {
      pageTitle: "Continue Activity",
      activities: activitiesWithIcons,
    });
  } catch {
    res.status(500).send("Failed to load activities.");
  }
};

export const renderNewActivity = (_req, res) => {
  const categories = [
    { name: "Focus", icon: "/image/focus-fill.svg" },
    { name: "Planning", icon: "/image/plan-fill.svg" },
    { name: "Life Admin", icon: "/image/life-fill.svg" },
    { name: "Learning", icon: "/image/learn-fill.svg" },
    { name: "Creative", icon: "/image/creative-fill.svg" },
  ];

  res.render("new-activity", {
    pageTitle: "New Activity",
    categories,
  });
};

export const createActivity = async (req, res) => {
  const activityName =
    typeof req.body.activityName === "string" && req.body.activityName.trim()
      ? req.body.activityName.trim()
      : "Activity Name";

  const category =
    typeof req.body.category === "string" && req.body.category.trim()
      ? req.body.category.trim()
      : "Category";

  try {
    const existingActivity = await fetchActivityGroupByNameCategory(
      activityName,
      category,
    );

    const queryString = new URLSearchParams({
      activityName,
      category,
    });

    if (existingActivity) {
      queryString.set("activityId", String(existingActivity.id));
    }

    res.redirect(`/activities/timer?${queryString.toString()}`);
  } catch {
    res.status(500).send("Failed to create activity.");
  }
};

export const deleteActivity = async (req, res) => {
  const activityId = Number(req.params.id);

  if (Number.isNaN(activityId)) {
    res.redirect("/activities/continue");
    return;
  }

  try {
    await ensureCompletionColumn();

    const target = await query(
      `
        SELECT title, category_id
        FROM activities
        WHERE id = $1
        LIMIT 1
      `,
      [activityId],
    );

    if (target.rows.length === 0) {
      res.redirect("/activities/continue");
      return;
    }

    const { title, category_id: categoryId } = target.rows[0];

    await query(
      `
        UPDATE activities
        SET is_completed = TRUE
        WHERE title = $1 AND category_id = $2
      `,
      [title, categoryId],
    );

    res.redirect("/activities/continue");
  } catch {
    res.status(500).send("Failed to delete activity.");
  }
};

export const completeActivity = async (req, res) => {
  const activityId = Number(req.params.id);

  if (Number.isNaN(activityId)) {
    res.status(400).json({ message: "Invalid activity ID." });
    return;
  }

  try {
    await ensureCompletionColumn();

    const targetResult = await query(
      `
        SELECT a.id, a.title, a.category_id, c.name AS category_name
        FROM activities a
        INNER JOIN categories c ON c.id = a.category_id
        WHERE a.id = $1
        LIMIT 1
      `,
      [activityId],
    );

    if (targetResult.rows.length === 0) {
      res.status(404).json({ message: "Activity not found." });
      return;
    }

    const firstRow = targetResult.rows[0];

    await query(
      `
        UPDATE activities
        SET is_completed = TRUE
        WHERE title = $1 AND category_id = $2
      `,
      [firstRow.title, firstRow.category_id],
    );

    res.json({
      activity: {
        id: Number(firstRow.id),
        name: firstRow.title,
        category: firstRow.category_name,
        title: firstRow.title,
        categoryId: Number(firstRow.category_id),
      },
      removedIndex: 0,
    });
  } catch {
    res.status(500).json({ message: "Failed to complete activity." });
  }
};

export const restoreActivity = async (req, res) => {
  const activityId = Number(req.body.id);
  const activityTitle =
    typeof req.body.title === "string" && req.body.title.trim()
      ? req.body.title.trim()
      : typeof req.body.name === "string" && req.body.name.trim()
        ? req.body.name.trim()
        : "";
  const categoryId = Number(req.body.categoryId);
  const removedRows = Array.isArray(req.body.removedRows)
    ? req.body.removedRows
    : [];

  if (!activityTitle && Number.isNaN(activityId) && removedRows.length === 0) {
    res.status(400).json({ message: "No activity payload to restore." });
    return;
  }

  try {
    await ensureCompletionColumn();

    let resolvedTitle = activityTitle;
    let resolvedCategoryId = categoryId;

    if (
      (!resolvedTitle || Number.isNaN(resolvedCategoryId)) &&
      removedRows.length > 0
    ) {
      resolvedTitle =
        removedRows[0].title || removedRows[0].name || resolvedTitle;
      resolvedCategoryId = Number(
        removedRows[0].categoryId ?? removedRows[0].category_id,
      );
    }

    if (
      (!resolvedTitle || Number.isNaN(resolvedCategoryId)) &&
      !Number.isNaN(activityId)
    ) {
      const targetResult = await query(
        `
          SELECT title, category_id
          FROM activities
          WHERE id = $1
          LIMIT 1
        `,
        [activityId],
      );

      if (targetResult.rows.length > 0) {
        resolvedTitle = targetResult.rows[0].title;
        resolvedCategoryId = Number(targetResult.rows[0].category_id);
      }
    }

    if (!resolvedTitle || Number.isNaN(resolvedCategoryId)) {
      res.status(404).json({ restored: false, message: "Activity not found." });
      return;
    }

    await query(
      `
        UPDATE activities
        SET is_completed = FALSE
        WHERE title = $1 AND category_id = $2
      `,
      [resolvedTitle, resolvedCategoryId],
    );

    res.json({ restored: true });
  } catch {
    res
      .status(500)
      .json({ restored: false, message: "Failed to restore activity." });
  }
};

export const renderTimerScreen = async (req, res) => {
  const activityId = Number(req.query.activityId);
  const activityName =
    typeof req.query.activityName === "string" && req.query.activityName.trim()
      ? req.query.activityName.trim()
      : "Activity Name";

  const category =
    typeof req.query.category === "string" && req.query.category.trim()
      ? req.query.category.trim()
      : "Category";

  try {
    let matchedActivity = null;

    if (!Number.isNaN(activityId)) {
      matchedActivity = await fetchActivityGroupById(activityId);
    }

    if (!matchedActivity) {
      matchedActivity = await fetchActivityGroupByNameCategory(
        activityName,
        category,
      );
    }

    const resolvedActivityId = matchedActivity ? matchedActivity.id : null;
    const resolvedName = matchedActivity ? matchedActivity.name : activityName;
    const resolvedCategory = matchedActivity
      ? matchedActivity.category
      : category;
    const resolvedTotalTime = matchedActivity
      ? matchedActivity.totalTime
      : "00:00:00";
    const activityIcon =
      categoryIconMap[resolvedCategory] || categoryIconMap.Focus;

    res.render("timer", {
      pageTitle: "Timer Screen",
      activityId: resolvedActivityId,
      activityName: resolvedName,
      category: resolvedCategory,
      activityIcon,
      timerValue: "00:00:00",
      totalTime: resolvedTotalTime,
    });
  } catch {
    res.status(500).send("Failed to load timer screen.");
  }
};

export const renderActivitySummary = async (req, res) => {
  const activityId = Number(req.body.activityId);
  const activityName =
    typeof req.body.activityName === "string" && req.body.activityName.trim()
      ? req.body.activityName.trim()
      : "Activity Name";
  const category =
    typeof req.body.category === "string" && req.body.category.trim()
      ? req.body.category.trim()
      : "Category";
  const sessionTime =
    typeof req.body.sessionTime === "string" && req.body.sessionTime.trim()
      ? req.body.sessionTime.trim()
      : "00:00:00";

  const sessionSeconds = parseTimeToSeconds(sessionTime);

  try {
    let matchedActivity = null;

    if (!Number.isNaN(activityId)) {
      matchedActivity = await fetchActivityGroupById(activityId);
    }

    if (!matchedActivity) {
      matchedActivity = await fetchActivityGroupByNameCategory(
        activityName,
        category,
      );
    }

    const previousTotalSeconds = matchedActivity
      ? parseTimeToSeconds(matchedActivity.totalTime)
      : 0;
    const previousTotalTime = formatSecondsToTime(previousTotalSeconds);

    const displayName = matchedActivity ? matchedActivity.name : activityName;
    let displayCategory = matchedActivity ? matchedActivity.category : category;

    if (sessionSeconds > 0) {
      const resolvedCategory = await resolveCategory(displayCategory);
      displayCategory = resolvedCategory.name;

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - sessionSeconds * 1000);

      await query(
        `
          INSERT INTO activities (title, category_id, note, start_time, end_time)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          displayName,
          resolvedCategory.id,
          null,
          startTime.toISOString(),
          endTime.toISOString(),
        ],
      );

      await ensureCompletionColumn();

      await query(
        `
          UPDATE activities
          SET is_completed = FALSE
          WHERE title = $1 AND category_id = $2
        `,
        [displayName, resolvedCategory.id],
      );

      matchedActivity = await fetchActivityGroupByNameCategory(
        displayName,
        displayCategory,
      );
    }

    const updatedTotalSeconds = matchedActivity
      ? parseTimeToSeconds(matchedActivity.totalTime)
      : previousTotalSeconds;
    const updatedTotalTime = formatSecondsToTime(updatedTotalSeconds);
    const streakDays = matchedActivity ? matchedActivity.activeDays : 0;
    const summaryActivityId = matchedActivity ? matchedActivity.id : null;
    const displayIcon =
      categoryIconMap[displayCategory] || categoryIconMap.Focus;

    res.render("activity-summary", {
      pageTitle: "Activity Summary",
      activityId: summaryActivityId,
      activityName: displayName,
      category: displayCategory,
      activityIcon: displayIcon,
      previousTotalTime,
      updatedTotalTime,
      sessionTime: formatSecondsToTime(sessionSeconds),
      streakDays,
    });
  } catch {
    res.status(500).send("Failed to render activity summary.");
  }
};
