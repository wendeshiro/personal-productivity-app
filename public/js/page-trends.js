(() => {
  const documentNode = globalThis.document;
  const canvas = documentNode.getElementById("trend-pie-chart");
  const tooltip = documentNode.getElementById("trend-pie-tooltip");
  const tooltipName = documentNode.getElementById("trend-tooltip-name");
  const tooltipTime = documentNode.getElementById("trend-tooltip-time");
  const weekTooltip = documentNode.getElementById("trend-week-tooltip");
  const weekTooltipName = documentNode.getElementById("trend-week-tooltip-name");
  const weekTooltipTime = documentNode.getElementById("trend-week-tooltip-time");
  const trendDateLabel = documentNode.getElementById("trend-date-label");
  const trendTotalLabel = documentNode.getElementById("trend-total-label");
  const trendTotalTime = documentNode.getElementById("trend-total-time");
  const legendList = documentNode.getElementById("trend-legend-list");
  const dayChart = documentNode.getElementById("trend-day-chart");
  const weekChart = documentNode.getElementById("trend-week-chart");
  const weekBarsRoot = documentNode.getElementById("trend-week-bars");
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

  const fallbackCategories = parseJsonNode(chartDataNode, []);
  const pageData = parseJsonNode(pageDataNode, {
    day: {
      dateLabel: "Today",
      totalLabel: "Total time",
      totalTime: "00:00",
      categories: fallbackCategories,
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
    !weekBarsRoot
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

  const dayCategories = normalizeCategories(pageData.day?.categories);
  const weekCategories = normalizeCategories(pageData.week?.categories);
  const dayChartData = dayCategories.filter((item) => item.totalSeconds > 0);

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

  const renderLegend = (categories) => {
    legendList.innerHTML = "";

    categories.forEach((category) => {
      const listItem = documentNode.createElement("li");

      const dot = documentNode.createElement("span");
      dot.className = `trend-dot trend-dot--${category.tone}`;

      const name = documentNode.createElement("span");
      name.className = "trend-category-name";
      name.textContent = category.name;

      const separator = documentNode.createElement("span");
      separator.className = "trend-separator";
      separator.textContent = "/";

      const time = documentNode.createElement("strong");
      time.className = "trend-category-time";
      time.textContent = category.timeLabel;

      listItem.append(dot, name, separator, time);
      legendList.append(listItem);
    });
  };

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

      const showWeekTooltip = (event) => {
        weekTooltipName.textContent = bar.label || "";
        weekTooltipTime.textContent = bar.timeLabel || "00:00";
        weekTooltip.classList.remove("is-hidden");

        const bounds = weekChart.getBoundingClientRect();
        const leftOffset = event.clientX - bounds.left + 16;
        const topOffset = event.clientY - bounds.top - 20;
        const maxLeft = Math.max(8, bounds.width - weekTooltip.offsetWidth - 8);
        const maxTop = Math.max(8, bounds.height - weekTooltip.offsetHeight - 8);

        weekTooltip.style.left = `${Math.max(8, Math.min(leftOffset, maxLeft))}px`;
        weekTooltip.style.top = `${Math.max(8, Math.min(topOffset, maxTop))}px`;
      };

      item.addEventListener("mouseenter", showWeekTooltip);
      item.addEventListener("mousemove", showWeekTooltip);
      item.addEventListener("mouseleave", hideWeekTooltip);

      weekBarsRoot.append(item);
    });
  };

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

  const setTooltipPosition = (clientX, clientY) => {
    const bounds = canvas.getBoundingClientRect();
    const leftOffset = clientX - bounds.left + 16;
    const topOffset = clientY - bounds.top - 20;

    const maxLeft = Math.max(8, bounds.width - tooltip.offsetWidth - 8);
    const maxTop = Math.max(8, bounds.height - tooltip.offsetHeight - 8);

    tooltip.style.left = `${Math.max(8, Math.min(leftOffset, maxLeft))}px`;
    tooltip.style.top = `${Math.max(8, Math.min(topOffset, maxTop))}px`;
  };

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

    return (
      segments.find((segment) => angle >= segment.start && angle < segment.end)
        ?.category || null
    );
  };

  const handlePointer = (event) => {
    if (activeMode !== "day") {
      hidePieTooltip();
      return;
    }

    const category = findCategoryAtPoint(event.clientX, event.clientY);

    if (!category) {
      hidePieTooltip();
      return;
    }

    tooltipName.textContent = category.name;
    tooltipTime.textContent = category.timeLabel;
    tooltip.classList.remove("is-hidden");
    setTooltipPosition(event.clientX, event.clientY);
  };

  const setActiveMode = (mode) => {
    activeMode = mode === "week" ? "week" : "day";

    rangeButtons.forEach((button) => {
      const isActive = button.dataset.range === activeMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    const modeData = pageData[activeMode] || pageData.day;
    const categories =
      activeMode === "week" && weekCategories.length > 0
        ? weekCategories
        : dayCategories;

    trendDateLabel.textContent = modeData.dateLabel || "";
    trendTotalLabel.textContent = modeData.totalLabel || "Total time";
    trendTotalTime.textContent = modeData.totalTime || "00:00";
    renderLegend(categories);

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

  rangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveMode(button.dataset.range || "day");
    });
  });

  drawDayChart();
  setActiveMode("day");

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
