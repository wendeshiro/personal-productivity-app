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

const mapActivityRow = (row) => ({
  id: Number(row.id),
  name: row.name,
  category: row.category,
  activeDays: Number(row.activeDays),
  totalTime: formatSecondsToTime(row.totalSeconds),
});

const fetchActivityGroups = async () => {
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

export const renderHome = (_req, res) => {
  const categories = [
    { name: "Focus", tone: "focus" },
    { name: "Planning", tone: "planning" },
    { name: "Life Admin", tone: "life-admin" },
    { name: "Learning", tone: "learning" },
    { name: "Creative", tone: "creative" },
    { name: "Communication", tone: "communication" },
  ];

  res.render("index", {
    pageTitle: "Home",
    categories,
  });
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
        DELETE FROM activities
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
    const deletedResult = await query(
      `
        WITH target AS (
          SELECT title, category_id
          FROM activities
          WHERE id = $1
          LIMIT 1
        ),
        deleted AS (
          DELETE FROM activities a
          USING target t
          WHERE a.title = t.title AND a.category_id = t.category_id
          RETURNING a.id, a.title, a.category_id, a.note, a.start_time, a.end_time
        )
        SELECT d.id, d.title, d.category_id, c.name AS category_name, d.note, d.start_time, d.end_time
        FROM deleted d
        INNER JOIN categories c ON c.id = d.category_id
        ORDER BY d.id
      `,
      [activityId],
    );

    if (deletedResult.rows.length === 0) {
      res.status(404).json({ message: "Activity not found." });
      return;
    }

    const firstRow = deletedResult.rows[0];

    res.json({
      activity: {
        id: Number(firstRow.id),
        name: firstRow.title,
        category: firstRow.category_name,
        removedRows: deletedResult.rows,
      },
      removedIndex: 0,
    });
  } catch {
    res.status(500).json({ message: "Failed to complete activity." });
  }
};

export const restoreActivity = async (req, res) => {
  const removedRows = Array.isArray(req.body.removedRows)
    ? req.body.removedRows
    : [];

  if (removedRows.length === 0) {
    res.status(400).json({ message: "No removed rows to restore." });
    return;
  }

  try {
    const restorePromises = removedRows.map((row) =>
      query(
        `
          INSERT INTO activities (title, category_id, note, start_time, end_time)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [row.title, row.category_id, row.note, row.start_time, row.end_time],
      ),
    );

    await Promise.all(restorePromises);

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
