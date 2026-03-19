(() => {
  // These nodes bridge the rendered timer screen with the client-side stopwatch and summary form payload.
  const timerDisplay = globalThis.document.getElementById("timer-display");
  const toggleButton = globalThis.document.getElementById("timer-toggle-btn");
  const toggleLabel = globalThis.document.getElementById("timer-toggle-label");
  const toggleIcon = globalThis.document.getElementById("timer-toggle-icon");
  const stopForm = globalThis.document.getElementById("timer-stop-form");

  if (
    !timerDisplay ||
    !toggleButton ||
    !toggleLabel ||
    !toggleIcon ||
    !stopForm
  ) {
    return;
  }

  const sessionTimeInput =
    globalThis.document.getElementById("session-time-input");
  const activityIdInput = stopForm.querySelector('input[name="activityId"]');
  const activityNameInput = stopForm.querySelector(
    'input[name="activityName"]',
  );
  const categoryInput = stopForm.querySelector('input[name="category"]');
  const TIMER_STORAGE_KEY = "lockedInActiveTimerV1";

  if (!sessionTimeInput || !activityNameInput || !categoryInput) {
    return;
  }

  // Summary posts the elapsed time as `HH:MM:SS`, so both timer persistence and form submission use the same format.
  const parseTimerValue = (value) => {
    const parts = value.split(":").map((part) => Number(part));

    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
      return 0;
    }

    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  };

  const formatTimerValue = (totalSeconds) => {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0",
    );
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  };

  const parseSavedState = () => {
    try {
      const rawValue = globalThis.localStorage.getItem(TIMER_STORAGE_KEY);

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

  const currentActivity = {
    activityId: activityIdInput ? activityIdInput.value.trim() : "",
    activityName: activityNameInput.value.trim(),
    category: categoryInput.value.trim(),
  };

  // Resume only applies when the stored timer belongs to the same grouped activity shown on this screen.
  const isSameActivity = (savedState) => {
    if (!savedState) {
      return false;
    }

    const savedActivityId = String(savedState.activityId || "");
    const currentActivityId = String(currentActivity.activityId || "");

    if (savedActivityId && currentActivityId) {
      return savedActivityId === currentActivityId;
    }

    return (
      savedState.activityName === currentActivity.activityName &&
      savedState.category === currentActivity.category
    );
  };

  const saveState = (state) => {
    globalThis.localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  };

  const clearState = () => {
    globalThis.localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  // Stored timer state is shared with the home/new/continue flows through `shared-active-timer-redirect.js`.
  let timerState = {
    activityId: currentActivity.activityId,
    activityName: currentActivity.activityName,
    category: currentActivity.category,
    baseElapsedSeconds: parseTimerValue(timerDisplay.textContent.trim()),
    isRunning: false,
    startedAtMs: null,
    hasStarted: false,
  };

  const savedState = parseSavedState();

  if (isSameActivity(savedState)) {
    timerState = {
      ...timerState,
      ...savedState,
      baseElapsedSeconds: Math.max(
        0,
        Number(savedState.baseElapsedSeconds) || 0,
      ),
      isRunning: Boolean(savedState.isRunning),
      startedAtMs:
        Number.isFinite(Number(savedState.startedAtMs)) &&
        Number(savedState.startedAtMs) > 0
          ? Number(savedState.startedAtMs)
          : null,
      hasStarted: Boolean(savedState.hasStarted),
    };
  }

  const getElapsedSeconds = () => {
    if (!timerState.isRunning || !timerState.startedAtMs) {
      return timerState.baseElapsedSeconds;
    }

    const deltaSeconds = Math.floor(
      (Date.now() - timerState.startedAtMs) / 1000,
    );

    return timerState.baseElapsedSeconds + Math.max(0, deltaSeconds);
  };

  timerDisplay.textContent = formatTimerValue(getElapsedSeconds());
  let intervalId = null;

  // Toggle keeps DOM, localStorage, and elapsed-time math in sync so pausing/resuming survives navigation.
  const setRunning = (isRunning) => {
    toggleLabel.textContent = isRunning ? "Pause" : "Start";
    toggleIcon.src = isRunning ? "/image/pause.svg" : "/image/start.svg";
    toggleButton.setAttribute("aria-pressed", isRunning ? "true" : "false");

    if (isRunning) {
      if (intervalId !== null) {
        return;
      }

      timerState.baseElapsedSeconds = getElapsedSeconds();
      timerState.startedAtMs = Date.now();
      timerState.isRunning = true;
      timerState.hasStarted = true;
      saveState(timerState);

      intervalId = globalThis.setInterval(() => {
        timerDisplay.textContent = formatTimerValue(getElapsedSeconds());
      }, 1000);
      return;
    }

    if (intervalId !== null) {
      globalThis.clearInterval(intervalId);
      intervalId = null;
    }

    timerState.baseElapsedSeconds = getElapsedSeconds();
    timerState.startedAtMs = null;
    timerState.isRunning = false;

    if (timerState.hasStarted) {
      saveState(timerState);
    }

    timerDisplay.textContent = formatTimerValue(timerState.baseElapsedSeconds);
  };

  toggleButton.addEventListener("click", () => {
    setRunning(intervalId === null);
  });

  // Stop freezes the current elapsed value into the form and clears resume state before `/activities/summary` loads.
  stopForm.addEventListener("submit", () => {
    sessionTimeInput.value = formatTimerValue(getElapsedSeconds());
    clearState();
  });

  if (timerState.isRunning) {
    setRunning(true);
  } else {
    setRunning(false);
  }
})();
