(() => {
  const summaryTotal = globalThis.document.getElementById("summary-total-time");
  const sessionTime = globalThis.document.getElementById(
    "summary-session-time",
  );
  const summaryNode = globalThis.document.querySelector(".summary-total");
  const ongoingButton = globalThis.document.getElementById("ongoing-btn");
  const ongoingPopup = globalThis.document.getElementById("ongoing-popup");
  const completedButton = globalThis.document.getElementById("completed-btn");
  const completedPopup = globalThis.document.getElementById("completed-popup");
  const undoButton = globalThis.document.getElementById("undo-btn");
  let removedActivityPayload = null;

  if (!summaryTotal || !sessionTime || !summaryNode) {
    return;
  }

  const parsedActivityId = Number(summaryNode.dataset.activityId);
  const parsedActiveDays = Number(summaryNode.dataset.activityDays);
  const summaryActivity = {
    id: Number.isFinite(parsedActivityId) ? parsedActivityId : null,
    name: summaryNode.dataset.activityName || "",
    category: summaryNode.dataset.activityCategory || "",
    activeDays: Number.isFinite(parsedActiveDays) ? parsedActiveDays : 0,
    totalTime: summaryNode.dataset.activityTotalTime || "00:00:00",
  };

  const parseTimeToSeconds = (value) => {
    const parts = String(value)
      .trim()
      .split(":")
      .map((part) => Number(part));

    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
      return 0;
    }

    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  };

  const formatSecondsToTime = (totalSeconds) => {
    const safeSeconds = Math.max(0, Math.round(totalSeconds));
    const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(
      2,
      "0",
    );
    const seconds = String(safeSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const animateTotalTime = (fromSeconds, toSeconds, durationMs) => {
    if (fromSeconds === toSeconds) {
      summaryTotal.textContent = formatSecondsToTime(toSeconds);
      return;
    }

    const startTime = globalThis.performance.now();
    const delta = toSeconds - fromSeconds;

    const tick = (now) => {
      const elapsed = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const currentValue = fromSeconds + delta * eased;

      summaryTotal.textContent = formatSecondsToTime(currentValue);

      if (elapsed < 1) {
        globalThis.requestAnimationFrame(tick);
      }
    };

    globalThis.requestAnimationFrame(tick);
  };

  const updatedTotal =
    summaryNode.dataset.updatedTotal || summaryTotal.textContent;
  const sessionDuration = summaryNode.dataset.sessionTime || "00:00:00";
  const fromTotalSeconds = parseTimeToSeconds(summaryTotal.textContent);
  const updatedTotalSeconds = parseTimeToSeconds(updatedTotal);

  if (sessionDuration === "00:00:00") {
    sessionTime.classList.add("is-hidden");
    animateTotalTime(fromTotalSeconds, updatedTotalSeconds, 650);
  } else {
    globalThis.setTimeout(() => {
      sessionTime.classList.add("is-hidden");
      animateTotalTime(fromTotalSeconds, updatedTotalSeconds, 900);
    }, 3000);
  }

  if (!ongoingButton || !ongoingPopup || !completedButton || !completedPopup) {
    return;
  }

  ongoingButton.addEventListener("click", () => {
    ongoingPopup.classList.remove("is-hidden");
    globalThis.document.body.classList.add("is-popup-open");
  });

  const openPopup = (popupNode) => {
    popupNode.classList.remove("is-hidden");
    globalThis.document.body.classList.add("is-popup-open");
  };

  const closePopup = (popupNode) => {
    popupNode.classList.add("is-hidden");

    if (
      ongoingPopup.classList.contains("is-hidden") &&
      completedPopup.classList.contains("is-hidden")
    ) {
      globalThis.document.body.classList.remove("is-popup-open");
    }
  };

  completedButton.addEventListener("click", async () => {
    if (
      typeof summaryActivity.id !== "number" ||
      Number.isNaN(summaryActivity.id)
    ) {
      openPopup(completedPopup);
      return;
    }

    try {
      const response = await globalThis.fetch(
        `/activities/${summaryActivity.id}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        return;
      }

      const result = await response.json();
      removedActivityPayload = {
        ...result.activity,
        removedIndex: result.removedIndex,
      };
      openPopup(completedPopup);
    } catch {
      return;
    }
  });

  if (undoButton) {
    undoButton.addEventListener("click", async () => {
      if (!removedActivityPayload) {
        closePopup(completedPopup);
        return;
      }

      try {
        const response = await globalThis.fetch("/activities/restore", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(removedActivityPayload),
        });

        if (!response.ok) {
          return;
        }

        removedActivityPayload = null;
        closePopup(completedPopup);
      } catch {
        return;
      }
    });
  }

  globalThis.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (!ongoingPopup.classList.contains("is-hidden")) {
      closePopup(ongoingPopup);
    }

    if (!completedPopup.classList.contains("is-hidden")) {
      closePopup(completedPopup);
    }
  });
})();
