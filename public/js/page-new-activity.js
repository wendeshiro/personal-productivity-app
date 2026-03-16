(() => {
  const categorySelect =
    globalThis.document.getElementById("activity-category");
  const iconWrap = globalThis.document.getElementById("category-icon-wrap");
  const iconImage = globalThis.document.getElementById("category-icon-image");

  if (!categorySelect || !iconWrap || !iconImage) {
    return;
  }

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
