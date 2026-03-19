(() => {
  // Continue cards act like accordions: one expanded card exposes its continue/delete actions.
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

  // Only one grouped activity stays open at a time so the action row stays predictable on mobile.
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
    // Ignore clicks inside the revealed action row so link/form actions still work normally.
    item.addEventListener("click", (event) => {
      if (event.target.closest(".activity-actions-row")) {
        return;
      }

      toggleItem(item);
    });

    // Mirrors the click interaction for keyboard users because each card is exposed as a button-like article.
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
