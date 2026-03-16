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

export const renderTimerScreen = (req, res) => {
  const activityName =
    typeof req.query.activityName === "string" && req.query.activityName.trim()
      ? req.query.activityName.trim()
      : "Activity Name";

  const category =
    typeof req.query.category === "string" && req.query.category.trim()
      ? req.query.category.trim()
      : "Category";

  const activityIcon = categoryIconMap[category] || categoryIconMap.Focus;

  res.render("timer", {
    pageTitle: "Timer Screen",
    activityName,
    category,
    activityIcon,
    timerValue: "00:00:00",
  });
};
