// Will be pulling from database once backend is set up.
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

let nextActivityId = activities.length + 1;

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
  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(safeSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
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

export const renderContinueActivity = (_req, res) => {
  const activitiesWithIcons = activities.map((activity) => ({
    ...activity,
    icon: categoryIconMap[activity.category] || categoryIconMap.Focus,
  }));

  res.render("continue-activity", {
    pageTitle: "Continue Activity",
    activities: activitiesWithIcons,
  });
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

export const createActivity = (req, res) => {
  const activityName =
    typeof req.body.activityName === "string" && req.body.activityName.trim()
      ? req.body.activityName.trim()
      : "Activity Name";

  const category =
    typeof req.body.category === "string" && req.body.category.trim()
      ? req.body.category.trim()
      : "Category";

  activities.unshift({
    id: nextActivityId,
    name: activityName,
    category,
    activeDays: 0,
    totalTime: "00:00:00",
  });
  nextActivityId += 1;

  const query = new URLSearchParams({
    activityId: String(nextActivityId - 1),
    activityName,
    category,
  });

  res.redirect(`/activities/timer?${query.toString()}`);
};

export const deleteActivity = (req, res) => {
  const activityId = Number(req.params.id);

  if (Number.isNaN(activityId)) {
    res.redirect("/activities/continue");
    return;
  }

  const activityIndex = activities.findIndex((activity) => activity.id === activityId);
  if (activityIndex !== -1) {
    activities.splice(activityIndex, 1);
  }

  res.redirect("/activities/continue");
};

export const completeActivity = (req, res) => {
  const activityId = Number(req.params.id);

  if (Number.isNaN(activityId)) {
    res.status(400).json({ message: "Invalid activity ID." });
    return;
  }

  const activityIndex = activities.findIndex((activity) => activity.id === activityId);
  if (activityIndex === -1) {
    res.status(404).json({ message: "Activity not found." });
    return;
  }

  const [activity] = activities.splice(activityIndex, 1);

  res.json({
    activity,
    removedIndex: activityIndex,
  });
};

export const restoreActivity = (req, res) => {
  const activityId = Number(req.body.id);
  const removedIndex = Number(req.body.removedIndex);

  if (Number.isNaN(activityId)) {
    res.status(400).json({ message: "Invalid activity ID." });
    return;
  }

  if (activities.some((activity) => activity.id === activityId)) {
    res.json({ restored: false, message: "Activity already exists." });
    return;
  }

  const activityName =
    typeof req.body.name === "string" && req.body.name.trim()
      ? req.body.name.trim()
      : "Activity Name";
  const category =
    typeof req.body.category === "string" && req.body.category.trim()
      ? req.body.category.trim()
      : "Category";
  const activeDays =
    Number.isInteger(req.body.activeDays) && req.body.activeDays >= 0 ? req.body.activeDays : 0;
  const totalTime = formatSecondsToTime(parseTimeToSeconds(req.body.totalTime));

  const restoredActivity = {
    id: activityId,
    name: activityName,
    category,
    activeDays,
    totalTime,
  };

  const safeIndex =
    Number.isInteger(removedIndex) && removedIndex >= 0 && removedIndex <= activities.length
      ? removedIndex
      : 0;

  activities.splice(safeIndex, 0, restoredActivity);
  nextActivityId = Math.max(nextActivityId, activityId + 1);

  res.json({ restored: true });
};

export const renderTimerScreen = (req, res) => {
  const activityId = Number(req.query.activityId);
  const activityName =
    typeof req.query.activityName === "string" && req.query.activityName.trim()
      ? req.query.activityName.trim()
      : "Activity Name";

  const category =
    typeof req.query.category === "string" && req.query.category.trim()
      ? req.query.category.trim()
      : "Category";

  const matchedActivity =
    (!Number.isNaN(activityId) && activities.find((activity) => activity.id === activityId)) ||
    activities.find((activity) => activity.name === activityName && activity.category === category);

  const resolvedActivityId = matchedActivity ? matchedActivity.id : null;
  const resolvedName = matchedActivity ? matchedActivity.name : activityName;
  const resolvedCategory = matchedActivity ? matchedActivity.category : category;
  const resolvedTotalTime = matchedActivity ? matchedActivity.totalTime : "00:00:00";
  const activityIcon = categoryIconMap[resolvedCategory] || categoryIconMap.Focus;

  res.render("timer", {
    pageTitle: "Timer Screen",
    activityId: resolvedActivityId,
    activityName: resolvedName,
    category: resolvedCategory,
    activityIcon,
    timerValue: "00:00:00",
    totalTime: resolvedTotalTime,
  });
};

export const renderActivitySummary = (req, res) => {
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

  const matchedActivity =
    (!Number.isNaN(activityId) && activities.find((activity) => activity.id === activityId)) ||
    activities.find((activity) => activity.name === activityName && activity.category === category);

  const previousTotalSeconds = matchedActivity ? parseTimeToSeconds(matchedActivity.totalTime) : 0;
  const updatedTotalSeconds = previousTotalSeconds + sessionSeconds;
  const updatedTotalTime = formatSecondsToTime(updatedTotalSeconds);
  const previousTotalTime = formatSecondsToTime(previousTotalSeconds);

  if (matchedActivity) {
    matchedActivity.totalTime = updatedTotalTime;
    if (sessionSeconds > 0) {
      matchedActivity.activeDays += 1;
    }
  }

  const streakDays = matchedActivity ? matchedActivity.activeDays : sessionSeconds > 0 ? 1 : 0;
  const displayName = matchedActivity ? matchedActivity.name : activityName;
  const displayCategory = matchedActivity ? matchedActivity.category : category;
  const displayIcon = categoryIconMap[displayCategory] || categoryIconMap.Focus;
  const summaryActivityId = matchedActivity ? matchedActivity.id : null;

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
};
