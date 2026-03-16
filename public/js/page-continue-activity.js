(() => {
  const activityItems = Array.from(
    globalThis.document.querySelectorAll(".activity-item"),
  );
  let expandedItem = null;

  const collapseItem = (item) => {
    item.classList.remove("is-expanded");
    item.setAttribute("aria-expanded", "false");
  };

  const expandItem = (item) => {
    item.classList.add("is-expanded");
    item.setAttribute("aria-expanded", "true");
  };

  const toggleItem = (item) => {
    if (expandedItem === item) {
      collapseItem(item);
      expandedItem = null;
      return;
    }

    if (expandedItem) {
      collapseItem(expandedItem);
    }

    expandItem(item);
    expandedItem = item;
  };

  activityItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      if (event.target.closest(".activity-actions-row")) {
        return;
      }

      toggleItem(item);
    });

    item.addEventListener("keydown", (event) => {
      if (event.target.closest(".activity-actions-row")) {
        return;
      }

      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      toggleItem(item);
    });
  });
})();
