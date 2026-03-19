(() => {
  // Keeps the category preview icon synced with the current select option in `new-activity.ejs`.
  const categorySelect =
    globalThis.document.getElementById("activity-category");
  const iconWrap = globalThis.document.getElementById("category-icon-wrap");
  const iconImage = globalThis.document.getElementById("category-icon-image");

  if (!categorySelect || !iconWrap || !iconImage) {
    return;
  }

  // Each option carries its icon path in `data-icon`, so the preview updates without another request.
  const updateCategoryIcon = () => {
    const selectedOption = categorySelect.options[categorySelect.selectedIndex];
    const icon = selectedOption.dataset.icon;
    const label = selectedOption.value;

    if (icon) {
      iconImage.src = icon;
    }

    iconImage.alt = `${label} category icon`;
  };

  categorySelect.addEventListener("change", updateCategoryIcon);
  updateCategoryIcon();
})();
