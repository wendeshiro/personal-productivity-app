(() => {
  // These nodes are the handoff points between the server-rendered trends template and the client updates.
  const documentNode = globalThis.document;
  const canvas = documentNode.getElementById("trend-pie-chart");
  const tooltip = documentNode.getElementById("trend-pie-tooltip");
  const tooltipName = documentNode.getElementById("trend-tooltip-name");
  const tooltipTime = documentNode.getElementById("trend-tooltip-time");
  const weekTooltip = documentNode.getElementById("trend-week-tooltip");
  const weekTooltipName = documentNode.getElementById(
    "trend-week-tooltip-name",
  );
  const weekTooltipTime = documentNode.getElementById(
    "trend-week-tooltip-time",
  );
  const trendDateLabel = documentNode.getElementById("trend-date-label");
  const trendTotalLabel = documentNode.getElementById("trend-total-label");
  const trendTotalTime = documentNode.getElementById("trend-total-time");
  const legendList = documentNode.getElementById("trend-legend-list");
  const dayChart = documentNode.getElementById("trend-day-chart");
  const weekChart = documentNode.getElementById("trend-week-chart");
  const weekBarsRoot = documentNode.getElementById("trend-week-bars");
  const previousButton = documentNode.getElementById("trend-prev-btn");
  const nextButton = documentNode.getElementById("trend-next-btn");
  const chartDataNode = documentNode.getElementById("trend-chart-data");
  const pageDataNode = documentNode.getElementById("trend-page-data");
  const rangeButtons = Array.from(
    documentNode.querySelectorAll(".trend-range-toggle .trend-range-btn"),
  );

  const parseJsonNode = (node, fallbackValue) => {
    if (!node) {
      return fallbackValue;
    }

    try {
      return JSON.parse(node.textContent || "") || fallbackValue;
    } catch {
      return fallbackValue;
    }
  };

  const parseDateKey = (dateValue) => {
    if (typeof dateValue !== "string") {
      return null;
    }

    const match = dateValue.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }

    const parsed = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    );
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    parsed.setHours(0, 0, 0, 0);
    return parsed;
  };

  const formatDateKey = (dateValue) =>
    `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(dateValue.getDate()).padStart(2, "0")}`;

  const shiftDateByDays = (dateValue, daysDelta) => {
    const shifted = new Date(dateValue);
    shifted.setDate(shifted.getDate() + daysDelta);
    shifted.setHours(0, 0, 0, 0);
    return shifted;
  };

  const fallbackCategories = parseJsonNode(chartDataNode, []);
  let pageData = parseJsonNode(pageDataNode, {
    day: {
      dateLabel: "Today",
      totalLabel: "Total time",
      totalTime: "00:00",
      categories: fallbackCategories,
      activities: [],
    },
    week: {
      dateLabel: "",
      totalLabel: "Weekly Total",
      totalTime: "00:00",
      categories: fallbackCategories,
      bars: [],
    },
  });

  if (
    !canvas ||
    !tooltip ||
    !tooltipName ||
    !tooltipTime ||
    !weekTooltip ||
    !weekTooltipName ||
    !weekTooltipTime ||
    !trendDateLabel ||
    !trendTotalLabel ||
    !trendTotalTime ||
    !legendList ||
    !dayChart ||
    !weekChart ||
    !weekBarsRoot ||
    !previousButton ||
    !nextButton
  ) {
    return;
  }

  const rootStyle = globalThis.getComputedStyle(documentNode.documentElement);
  const getColorByTone = (tone) =>
    rootStyle.getPropertyValue(`--${tone}`).trim() || "#231307";

  const normalizeCategories = (categories) =>
    (Array.isArray(categories) ? categories : []).map((item) => ({
      name: item.name,
      tone: item.tone,
      totalSeconds: Number(item.totalSeconds) || 0,
      timeLabel: item.timeLabel || "00:00",
      color: getColorByTone(item.tone),
    }));

  let dayChartData = [];
  let currentReferenceDate = parseDateKey(pageData.day?.referenceDate);
  if (!currentReferenceDate) {
    currentReferenceDate = new Date();
    currentReferenceDate.setHours(0, 0, 0, 0);
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  let activeMode = "day";
  let segments = [];
  let center = 0;
  let radius = 0;
  let innerRadius = 0;

  const hidePieTooltip = () => {
    tooltip.classList.add("is-hidden");
  };

  const hideWeekTooltip = () => {
    weekTooltip.classList.add("is-hidden");
  };

  const hideAllTooltips = () => {
    hidePieTooltip();
    hideWeekTooltip();
  };

  // Both the legend and the charts read from the same normalized category payload.
  const getModeCategories = (mode) =>
    normalizeCategories(pageData?.[mode]?.categories);

  // Day mode lists activities, while week mode continues to list category totals.
  const getModeLegendItems = (mode) => {
    if (mode === "day") {
      return normalizeCategories(pageData?.day?.activities);
    }

    return getModeCategories("week");
  };

  // Day mode redraws from the latest fetched payload instead of the initial page HTML.
  const refreshDayChartData = () => {
    dayChartData = getModeCategories("day").filter(
      (item) => item.totalSeconds > 0,
    );
  };

  const renderLegend = (categories) => {
    legendList.innerHTML = "";

    categories.forEach((category) => {
      const listItem = documentNode.createElement("li");

      const dot = documentNode.createElement("span");
      dot.className = `trend-dot trend-dot--${category.tone}`;

      const name = documentNode.createElement("span");
      name.className = "trend-category-name";
      name.textContent = category.name;

      const legend = documentNode.createElement("div");
      legend.className = "trend-legend-main";
      legend.append(dot, name);

      const time = documentNode.createElement("strong");
      time.className = "trend-category-time";
      time.textContent = category.timeLabel;

      listItem.append(legend, time);
      legendList.append(listItem);
    });
  };

  // Week mode rebuilds the bar chart each time the date range changes.
  const renderWeekBars = () => {
    const bars = Array.isArray(pageData.week?.bars) ? pageData.week.bars : [];
    const activeTotals = bars
      .map((bar) => Number(bar.totalSeconds) || 0)
      .filter((seconds) => seconds > 0);
    const maxTotalSeconds =
      activeTotals.length > 0 ? Math.max(...activeTotals) : 1;
    const maxBarHeight = 320;
    const minActiveHeight = 40;
    const placeholderHeight = 24;

    weekBarsRoot.innerHTML = "";

    bars.forEach((bar) => {
      const totalSeconds = Number(bar.totalSeconds) || 0;
      const barHeightFromData = Number(bar.barHeight);
      let height = placeholderHeight;

      if (Number.isFinite(barHeightFromData) && barHeightFromData > 0) {
        height = Math.round(barHeightFromData);
      } else if (totalSeconds > 0) {
        const ratio = totalSeconds / maxTotalSeconds;
        height = Math.round(
          minActiveHeight + ratio * (maxBarHeight - minActiveHeight),
        );
      }

      const item = documentNode.createElement("div");
      item.className = "trend-week-bar-item";
      item.title = `${bar.label || ""} ${bar.timeLabel || "00:00"}`.trim();

      const barNode = documentNode.createElement("div");
      barNode.className = "trend-week-bar";
      if (bar.isActive || totalSeconds > 0) {
        barNode.classList.add("is-active");
      }
      barNode.style.height = `${height}px`;

      const label = documentNode.createElement("p");
      label.className = "trend-week-label";
      label.textContent = bar.label || "";

      item.append(barNode, label);

      const showWeekTooltipForItem = () => {
        weekTooltipName.textContent = bar.label || "";
        weekTooltipTime.textContent = bar.timeLabel || "00:00";
        weekTooltip.classList.remove("is-hidden");

        const chartBounds = weekChart.getBoundingClientRect();
        const itemBounds = item.getBoundingClientRect();
        const barBounds = barNode.getBoundingClientRect();

        const centeredLeft =
          itemBounds.left +
          itemBounds.width / 2 -
          chartBounds.left -
          weekTooltip.offsetWidth / 2;
        const preferredTop =
          barBounds.top - chartBounds.top - weekTooltip.offsetHeight - 12;
        const maxLeft = Math.max(
          8,
          chartBounds.width - weekTooltip.offsetWidth - 8,
        );
        const maxTop = Math.max(
          8,
          chartBounds.height - weekTooltip.offsetHeight - 8,
        );

        weekTooltip.style.left = `${Math.max(8, Math.min(centeredLeft, maxLeft))}px`;
        weekTooltip.style.top = `${Math.max(8, Math.min(preferredTop, maxTop))}px`;
      };

      item.addEventListener("mouseenter", showWeekTooltipForItem);
      item.addEventListener("mouseleave", hideWeekTooltip);

      weekBarsRoot.append(item);
    });
  };

  // Canvas drawing is only used for day mode; week mode is regular DOM bars.
  const drawDayChart = () => {
    const width = Math.round(canvas.clientWidth || 360);
    const height = Math.round(canvas.clientHeight || 360);
    const size = Math.max(1, Math.min(width, height));
    const dpr = globalThis.devicePixelRatio || 1;

    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, size, size);

    center = size / 2;
    radius = size / 2 - 1;
    innerRadius = radius * 0.46;
    segments = [];

    const totalSeconds = dayChartData.reduce(
      (sum, category) => sum + category.totalSeconds,
      0,
    );

    if (totalSeconds <= 0) {
      context.beginPath();
      context.arc(center, center, radius, 0, Math.PI * 2);
      context.arc(center, center, innerRadius, Math.PI * 2, 0, true);
      context.closePath();
      context.fillStyle = "#d8d3ce";
      context.fill();
      return;
    }

    let currentAngle = 0;

    dayChartData.forEach((category, index) => {
      const nextAngle =
        index === dayChartData.length - 1
          ? Math.PI * 2
          : currentAngle + (category.totalSeconds / totalSeconds) * Math.PI * 2;

      context.beginPath();
      context.arc(
        center,
        center,
        radius,
        currentAngle - Math.PI / 2,
        nextAngle - Math.PI / 2,
      );
      context.arc(
        center,
        center,
        innerRadius,
        nextAngle - Math.PI / 2,
        currentAngle - Math.PI / 2,
        true,
      );
      context.closePath();
      context.fillStyle = category.color;
      context.fill();

      segments.push({
        start: currentAngle,
        end: nextAngle,
        category,
      });

      currentAngle = nextAngle;
    });
  };

  // Donut tooltips anchor to the active slice, not the pointer, so they stay stable while hovering.
  const setTooltipPositionAtSliceMidpoint = (segment) => {
    const bounds = canvas.getBoundingClientRect();
    const midAngle = (segment.start + segment.end) / 2;
    const midRadius = (innerRadius + radius) / 2;
    const pointX = center + Math.cos(midAngle - Math.PI / 2) * midRadius;
    const pointY = center + Math.sin(midAngle - Math.PI / 2) * midRadius;
    const centeredLeft = pointX - tooltip.offsetWidth / 2;
    const centeredTop = pointY - tooltip.offsetHeight / 2;
    const maxLeft = Math.max(8, bounds.width - tooltip.offsetWidth - 8);
    const maxTop = Math.max(8, bounds.height - tooltip.offsetHeight - 8);

    tooltip.style.left = `${Math.max(8, Math.min(centeredLeft, maxLeft))}px`;
    tooltip.style.top = `${Math.max(8, Math.min(centeredTop, maxTop))}px`;
  };

  // Hit-testing turns the cursor position into the matching donut segment.
  const findCategoryAtPoint = (clientX, clientY) => {
    const bounds = canvas.getBoundingClientRect();
    const x = clientX - bounds.left;
    const y = clientY - bounds.top;
    const dx = x - center;
    const dy = y - center;
    const distance = Math.hypot(dx, dy);

    if (distance > radius || distance < innerRadius) {
      return null;
    }

    let angle = Math.atan2(dy, dx) + Math.PI / 2;

    if (angle < 0) {
      angle += Math.PI * 2;
    }

    return segments.find(
      (segment) => angle >= segment.start && angle < segment.end,
    );
  };

  const handlePointer = (event) => {
    if (activeMode !== "day") {
      hidePieTooltip();
      return;
    }

    const activeSegment = findCategoryAtPoint(event.clientX, event.clientY);

    if (!activeSegment) {
      hidePieTooltip();
      return;
    }

    tooltipName.textContent = activeSegment.category.name;
    tooltipTime.textContent = activeSegment.category.timeLabel;
    tooltip.classList.remove("is-hidden");
    setTooltipPositionAtSliceMidpoint(activeSegment);
  };

  // This is the main UI switcher used by tab clicks and by fetched date updates.
  const setActiveMode = (mode) => {
    activeMode = mode === "week" ? "week" : "day";

    rangeButtons.forEach((button) => {
      const isActive = button.dataset.range === activeMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    const modeData = pageData[activeMode] || pageData.day;
    const legendItems = getModeLegendItems(activeMode);

    trendDateLabel.textContent = modeData.dateLabel || "";
    trendTotalLabel.textContent = modeData.totalLabel || "Total time";
    trendTotalTime.textContent = modeData.totalTime || "00:00";
    renderLegend(legendItems);

    if (activeMode === "day") {
      refreshDayChartData();
    }

    if (activeMode === "week") {
      dayChart.classList.add("is-hidden");
      dayChart.setAttribute("aria-hidden", "true");
      weekChart.classList.remove("is-hidden");
      weekChart.setAttribute("aria-hidden", "false");
      hideAllTooltips();
      renderWeekBars();
      return;
    }

    weekChart.classList.add("is-hidden");
    weekChart.setAttribute("aria-hidden", "true");
    dayChart.classList.remove("is-hidden");
    dayChart.setAttribute("aria-hidden", "false");
    hideAllTooltips();
    drawDayChart();
  };

  // Arrow labels change with the active mode so accessibility matches the current navigation step.
  const updateArrowLabels = () => {
    previousButton.setAttribute(
      "aria-label",
      activeMode === "week" ? "Previous week" : "Previous day",
    );
    nextButton.setAttribute(
      "aria-label",
      activeMode === "week" ? "Next week" : "Next day",
    );
  };

  // All date stepping goes through the same backend endpoint so day/week stay in sync with the database.
  const fetchTrendData = async (mode, dateValue) => {
    const searchParams = new URLSearchParams({
      mode,
      date: formatDateKey(dateValue),
    });

    try {
      const response = await globalThis.fetch(`/api/trends?${searchParams.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      return null;
    }
  };

  // Stores the fetched payload locally so charts, labels, and legend can all rerender from one source of truth.
  const loadModeData = async (mode, dateValue) => {
    const fetched = await fetchTrendData(mode, dateValue);

    if (!fetched) {
      return false;
    }

    pageData = {
      ...pageData,
      [mode]: fetched,
    };

    const parsedReferenceDate = parseDateKey(fetched.referenceDate);
    if (parsedReferenceDate) {
      currentReferenceDate = parsedReferenceDate;
    }

    return true;
  };

  // Left/right arrows call this with `-1` or `1`, then mode decides whether that means days or weeks.
  const shiftByDirection = async (direction) => {
    const dayDelta = activeMode === "week" ? 7 : 1;
    const nextDate = shiftDateByDays(currentReferenceDate, direction * dayDelta);
    const loaded = await loadModeData(activeMode, nextDate);

    if (!loaded) {
      return;
    }

    setActiveMode(activeMode);
  };

  rangeButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const nextMode = button.dataset.range === "week" ? "week" : "day";

      if (nextMode !== activeMode) {
        await loadModeData(nextMode, currentReferenceDate);
      }

      setActiveMode(nextMode);
      updateArrowLabels();
    });
  });

  setActiveMode("day");
  updateArrowLabels();

  previousButton.addEventListener("click", async () => {
    await shiftByDirection(-1);
  });

  nextButton.addEventListener("click", async () => {
    await shiftByDirection(1);
  });

  globalThis.addEventListener("resize", () => {
    if (activeMode === "day") {
      drawDayChart();
    }
  });

  canvas.addEventListener("mousemove", handlePointer);
  canvas.addEventListener("click", handlePointer);
  canvas.addEventListener("mouseleave", hidePieTooltip);
  weekChart.addEventListener("mouseleave", hideWeekTooltip);
})();
