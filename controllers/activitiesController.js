import { query } from "../db/client.js";

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

// Shared parser for timer/session values posted between the timer, summary, and grouped totals logic.
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

// Normalizes database totals into the fixed-width `HH:MM:SS` format used across the app UI.
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

// Trends screens use a shorter display format so small daily totals do not waste horizontal space.
const formatSecondsForTrend = (totalSeconds) => {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(safeSeconds % 60).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${minutes}:${seconds}`;
  }

  return `${minutes}:${seconds}`;
};

// Produces the ordinal suffixes reused by both day and week trend labels.
const formatOrdinalDay = (day) => {
  const mod100 = day % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${day}th`;
  }

  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
};

// Builds the special "Today - Mar 19th" label used by the trends day view.
const formatTrendDateLabel = (dateValue) => {
  const dayWithOrdinal = formatOrdinalDay(dateValue.getDate());
  const monthLabel = dateValue.toLocaleString("en-US", { month: "short" });

  return `Today - ${monthLabel} ${dayWithOrdinal}`;
};

// Formats standalone dates for week ranges and non-today day navigation labels.
const formatMonthDayWithOrdinal = (dateValue) => {
  const monthLabel = dateValue.toLocaleString("en-US", { month: "short" });
  const dayWithOrdinal = formatOrdinalDay(dateValue.getDate());

  return `${monthLabel} ${dayWithOrdinal}`;
};

// Week bars use this compact label directly under each column.
const formatMonthDayShort = (dateValue) =>
  `${dateValue.getMonth() + 1}/${dateValue.getDate()}`;

// A stable local date key lets weekly queries line up database rows with the rendered calendar positions.
const formatDateKey = (dateValue) =>
  `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(dateValue.getDate()).padStart(2, "0")}`;

// Parses `/api/trends` date query params into safe local-midnight Date objects for stepping logic.
const parseDateInput = (dateValue) => {
  if (typeof dateValue !== "string") {
    return null;
  }

  const match = dateValue.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

// Daily trend queries and "today" comparisons both start from local midnight.
const getStartOfDay = (dateValue) => {
  const start = new Date(dateValue);
  start.setHours(0, 0, 0, 0);
  return start;
};

// Weekly navigation anchors on Sunday so bars and labels stay aligned between server and client.
const getStartOfWeekSunday = (dateValue) => {
  const start = new Date(dateValue);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

// Feeds both the home donut and the trends views with category totals for a date range.
const fetchCategoryTotalsByRange = async (rangeStart, rangeEndExclusive) => {
  const { rows } = await query(
    `
      SELECT
        c.name,
        COALESCE(SUM(a.duration_seconds), 0)::INTEGER AS "totalSeconds"
      FROM categories c
      LEFT JOIN activities a
        ON a.category_id = c.id
       AND a.start_time >= $1
       AND a.start_time < $2
       AND a.end_time IS NOT NULL
      WHERE c.name <> 'Uncategorized'
      GROUP BY c.id, c.name
      ORDER BY c.id
    `,
    [rangeStart.toISOString(), rangeEndExclusive.toISOString()],
  );

  const totalsByCategory = new Map(
    rows.map((row) => [row.name, Number(row.totalSeconds) || 0]),
  );

  return homeCategoryOrder.map((name) => ({
    name,
    tone: categoryToneMap[name],
    totalSeconds: totalsByCategory.get(name) || 0,
    timeLabel: formatSecondsForTrend(totalsByCategory.get(name) || 0),
  }));
};

// Daily trends use this separate query so the list can rank individual activities while still showing category dots.
const fetchActivityTotalsByRange = async (rangeStart, rangeEndExclusive) => {
  const { rows } = await query(
    `
      SELECT
        a.title AS name,
        c.name AS category,
        COALESCE(SUM(a.duration_seconds), 0)::INTEGER AS "totalSeconds"
      FROM activities a
      INNER JOIN categories c ON c.id = a.category_id
      WHERE a.start_time >= $1
        AND a.start_time < $2
        AND a.end_time IS NOT NULL
        AND c.name <> 'Uncategorized'
      GROUP BY a.title, c.name
      ORDER BY "totalSeconds" DESC, a.title ASC, c.name ASC
    `,
    [rangeStart.toISOString(), rangeEndExclusive.toISOString()],
  );

  return rows.map((row) => {
    const totalSeconds = Number(row.totalSeconds) || 0;

    return {
      name: row.name,
      category: row.category,
      tone: categoryToneMap[row.category] || "focus",
      totalSeconds,
      timeLabel: formatSecondsForTrend(totalSeconds),
    };
  });
};

// Builds the seven day bar-series that the trends page week mode renders client-side.
const fetchWeeklyBars = async (rangeStart, rangeEndExclusive) => {
  const { rows } = await query(
    `
      SELECT
        DATE(a.start_time)::TEXT AS "dayKey",
        COALESCE(SUM(a.duration_seconds), 0)::INTEGER AS "totalSeconds"
      FROM activities a
      WHERE a.start_time >= $1
        AND a.start_time < $2
        AND a.end_time IS NOT NULL
      GROUP BY DATE(a.start_time)
      ORDER BY "dayKey"
    `,
    [rangeStart.toISOString(), rangeEndExclusive.toISOString()],
  );

  const totalsByDay = new Map(
    rows.map((row) => [String(row.dayKey), Number(row.totalSeconds) || 0]),
  );

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(rangeStart);
    day.setDate(rangeStart.getDate() + index);
    const dayKey = formatDateKey(day);
    const totalSeconds = totalsByDay.get(dayKey) || 0;

    return {
      label: formatMonthDayShort(day),
      totalSeconds,
      timeLabel: formatSecondsForTrend(totalSeconds),
    };
  });
};

// Packages weekly totals, labels, and bar heights for the trends template and `/api/trends`.
const buildWeekTrendData = async (referenceDate = new Date()) => {
  const weekStart = getStartOfWeekSunday(referenceDate);
  const weekEndExclusive = new Date(weekStart);
  weekEndExclusive.setDate(weekStart.getDate() + 7);
  const weekEndDisplay = new Date(weekStart);
  weekEndDisplay.setDate(weekStart.getDate() + 6);

  const categories = await fetchCategoryTotalsByRange(
    weekStart,
    weekEndExclusive,
  );

  // Sort categories based on descending total time.
  const sortedCategories = [...categories].sort((left, right) => {
    const totalDelta = right.totalSeconds - left.totalSeconds;

    if (totalDelta !== 0) {
      return totalDelta;
    }

    return left.name.localeCompare(right.name);
  });

  const bars = await fetchWeeklyBars(weekStart, weekEndExclusive);
  const activeTotals = bars
    .map((bar) => Number(bar.totalSeconds) || 0)
    .filter((seconds) => seconds > 0);
  const maxTotalSeconds =
    activeTotals.length > 0 ? Math.max(...activeTotals) : 1;
  const maxBarHeight = 320;
  const minActiveHeight = 40;
  const placeholderHeight = 24;

  const barsWithHeights = bars.map((bar) => {
    const totalSeconds = Number(bar.totalSeconds) || 0;
    const barHeight =
      totalSeconds > 0
        ? Math.round(
            minActiveHeight +
              (totalSeconds / maxTotalSeconds) *
                (maxBarHeight - minActiveHeight),
          )
        : placeholderHeight;

    return {
      ...bar,
      barHeight,
      isActive: totalSeconds > 0,
    };
  });

  const totalSeconds = sortedCategories.reduce(
    (sum, category) => sum + category.totalSeconds,
    0,
  );

  return {
    referenceDate: formatDateKey(referenceDate),
    dateLabel: `${formatMonthDayWithOrdinal(weekStart)} - ${formatMonthDayWithOrdinal(weekEndDisplay)}`,
    totalLabel: "Weekly Total",
    totalTime: formatSecondsForTrend(totalSeconds),
    categories: sortedCategories,
    bars: barsWithHeights,
  };
};

// Packages daily totals for the home/trends donut views and keeps the label in sync with the selected day.
const buildDayTrendData = async (referenceDate = new Date()) => {
  const dayStart = getStartOfDay(referenceDate);
  const dayEndExclusive = new Date(dayStart);
  dayEndExclusive.setDate(dayStart.getDate() + 1);
  const today = getStartOfDay(new Date());
  const categories = await fetchCategoryTotalsByRange(
    dayStart,
    dayEndExclusive,
  );
  const activities = await fetchActivityTotalsByRange(
    dayStart,
    dayEndExclusive,
  );
  const totalSeconds = categories.reduce(
    (sum, category) => sum + category.totalSeconds,
    0,
  );
  const isToday = formatDateKey(dayStart) === formatDateKey(today);

  return {
    referenceDate: formatDateKey(dayStart),
    dateLabel: isToday
      ? formatTrendDateLabel(dayStart)
      : formatMonthDayWithOrdinal(dayStart),
    totalLabel: "Total time",
    totalTime: formatSecondsForTrend(totalSeconds),
    categories,
    activities,
  };
};

// Generates the CSS conic-gradient string used by the home donut chart.
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
    return "#d8d3ce 0deg 360deg";
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

// Home uses this to render today's donut and legend without needing client-side chart code.
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

// Converts grouped SQL rows into the card shape used by continue activity and timer resolution.
const mapActivityRow = (row) => ({
  id: Number(row.id),
  name: row.name,
  category: row.category,
  activeDays: Number(row.activeDays),
  totalTime: formatSecondsToTime(row.totalSeconds),
});

let completionColumnEnsured = false;

// Older databases may not have `is_completed`; this guard upgrades once before grouped queries rely on it.
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

// Continue activity uses this grouped query so one card represents all unfinished sessions for a title/category pair.
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

// Resolves a grouped activity from any session id so timer/summary routes can reopen the correct aggregate record.
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

// Create/timer/summary flows use this fallback when they only know the activity title and category name.
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

// Summary inserts depend on a valid category id, so this resolves the requested name with a safe fallback.
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

// Home is fully server-rendered from today's aggregated totals, including the donut gradient and legend order.
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

// Seeds the trends page with both day and week payloads so the first render works before any API calls.
export const renderTrendsReport = async (_req, res) => {
  try {
    const today = new Date();
    const dayData = await buildDayTrendData(today);
    const weekData = await buildWeekTrendData(today);

    const trendData = {
      day: dayData,
      week: weekData,
    };

    res.render("trends", {
      pageTitle: "Trend Report",
      chartCategories: trendData.day.categories,
      trendDateLabel: trendData.day.dateLabel,
      trendTotalTime: trendData.day.totalTime,
      trendTotalLabel: trendData.day.totalLabel,
      trendData,
    });
  } catch {
    res.status(500).send("Failed to load trends report.");
  }
};

// Arrow navigation on the trends page calls this endpoint for day/week stepping.
export const getTrendData = async (req, res) => {
  const mode = req.query.mode === "week" ? "week" : "day";
  const parsedDate = parseDateInput(req.query.date);
  const referenceDate = parsedDate || getStartOfDay(new Date());

  try {
    if (mode === "week") {
      const weekData = await buildWeekTrendData(referenceDate);
      res.json(weekData);
      return;
    }

    const dayData = await buildDayTrendData(referenceDate);
    res.json(dayData);
  } catch {
    res.status(500).json({ message: "Failed to load trend data." });
  }
};

export const renderContinueActivity = async (_req, res) => {
  try {
    // Continue view lists grouped activities so one saved card represents all sessions for that title/category.
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

export const renderNewActivity = async (_req, res) => {
  try {
    // New activity uses category rows from the database so the form and icon picker stay aligned with stored categories.
    const { rows } = await query(
      `
        SELECT name
        FROM categories
        WHERE name <> 'Uncategorized'
        ORDER BY id
      `,
    );

    const categories = rows
      .map((row) => ({
        name: row.name,
        icon: categoryIconMap[row.name] || categoryIconMap.Focus,
      }))
      .filter((category) => Boolean(category.name));

    const fallbackCategories = homeCategoryOrder.map((name) => ({
      name,
      icon: categoryIconMap[name] || categoryIconMap.Focus,
    }));

    res.render("new-activity", {
      pageTitle: "New Activity",
      categories: categories.length > 0 ? categories : fallbackCategories,
    });
  } catch {
    res.status(500).send("Failed to load new activity screen.");
  }
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
    // Creating redirects straight to the timer; if the title/category already exists we pass its grouped id forward.
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

    // Continue view "delete" marks every session in the grouped activity completed so it disappears from the list.
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

// Summary completion uses this endpoint to hide a grouped activity from continue view without deleting historical sessions.
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

// Undo from the summary popup calls this to mark the grouped activity active again using the saved completion payload.
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
    // Timer can be opened from either a grouped activity id or a name/category pair from the create flow.
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

    // The timer always starts at zero; total accumulated time is shown separately in later summary screens.
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
    // Summary resolves the same grouped activity the timer was running against so totals roll up correctly.
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

    // Stopping the timer persists a completed session row, then rehydrates the grouped totals for display.
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

    // The summary template seeds both the animation state and the save/complete popup actions from this payload.
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
