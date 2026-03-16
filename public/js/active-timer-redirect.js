(() => {
  const TIMER_STORAGE_KEY = "lockedInActiveTimerV1";

  const parseSavedState = () => {
    try {
      const rawValue = localStorage.getItem(TIMER_STORAGE_KEY);

      if (!rawValue) {
        return null;
      }

      const parsedValue = JSON.parse(rawValue);

      if (!parsedValue || typeof parsedValue !== "object") {
        return null;
      }

      return parsedValue;
    } catch {
      return null;
    }
  };

  const savedState = parseSavedState();

  if (!savedState || !savedState.hasStarted) {
    return;
  }

  if (
    typeof savedState.activityName !== "string" ||
    !savedState.activityName.trim() ||
    typeof savedState.category !== "string" ||
    !savedState.category.trim()
  ) {
    return;
  }

  const params = new URLSearchParams({
    activityName: savedState.activityName,
    category: savedState.category,
  });

  const numericActivityId = Number(savedState.activityId);

  if (Number.isFinite(numericActivityId) && numericActivityId > 0) {
    params.set("activityId", String(Math.floor(numericActivityId)));
  }

  globalThis.location.replace(`/activities/timer?${params.toString()}`);
})();
